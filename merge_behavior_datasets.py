from pathlib import Path
import shutil
import yaml

# --------------------------------------------------
# EDIT THESE TWO PATHS IF YOUR FOLDER NAMES DIFFER
# --------------------------------------------------
DATASET_1 = Path("datasets/behavior_detection-fight")
DATASET_2 = Path("datasets/behavior_detection-phone")

OUTPUT_DIR = Path("datasets/behavior_detection")

# Final class list you asked for
FINAL_CLASSES = [
    "Fighting",       # 0
    "Sleeping",       # 1
    "Using Phone",    # 2
    "Reading",        # 3
    "Writing",        # 4
    "Hand Raising",   # 5
    "Eating",         # 6
]

# Map source class names -> final class ids
# Dataset 1: Student Classroom Behavior v7
MAP_1 = {
    "Eating": 6,
    "Fighting": 0,
    "Sleeping": 1,
}

# Dataset 2: Classroom Student Dataset v16
MAP_2 = {
    "Hand Rising": 5,   # renamed to Hand Raising
    "Reading": 3,
    "Sleeping": 1,
    "Using Phone": 2,
    "Writing": 4,
}

# --------------------------------------------------
# HELPERS
# --------------------------------------------------
def load_yaml_names(yaml_path: Path):
    with open(yaml_path, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f)
    names = data["names"]
    if isinstance(names, dict):
        # Roboflow sometimes stores names as {0: "class", 1: "class"}
        names = [names[i] for i in sorted(names.keys(), key=lambda x: int(x))]
    return names, data

def ensure_dirs(base: Path):
    for split in ["train", "valid", "test"]:
        (base / split / "images").mkdir(parents=True, exist_ok=True)
        (base / split / "labels").mkdir(parents=True, exist_ok=True)

def unique_name(prefix: str, original_stem: str, suffix: str):
    return f"{prefix}_{original_stem}{suffix}"

def process_split(source_root: Path, source_names, class_map, split: str, prefix: str):
    src_img_dir = source_root / split / "images"
    src_lbl_dir = source_root / split / "labels"

    # Some Roboflow exports use "valid" not "val"
    if not src_img_dir.exists():
        return 0, 0

    out_img_dir = OUTPUT_DIR / split / "images"
    out_lbl_dir = OUTPUT_DIR / split / "labels"

    image_count = 0
    kept_labels = 0

    for img_path in src_img_dir.iterdir():
        if not img_path.is_file():
            continue

        # Copy image with prefix to avoid name collisions
        new_img_name = unique_name(prefix, img_path.stem, img_path.suffix)
        new_img_path = out_img_dir / new_img_name
        shutil.copy2(img_path, new_img_path)
        image_count += 1

        # Corresponding label file
        lbl_path = src_lbl_dir / f"{img_path.stem}.txt"
        new_lbl_path = out_lbl_dir / f"{prefix}_{img_path.stem}.txt"

        remapped_lines = []
        if lbl_path.exists():
            with open(lbl_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if not line:
                        continue

                    parts = line.split()
                    if len(parts) != 5:
                        continue

                    old_class_id = int(parts[0])
                    class_name = source_names[old_class_id]

                    if class_name in class_map:
                        new_class_id = class_map[class_name]
                        remapped_lines.append(
                            f"{new_class_id} {' '.join(parts[1:])}"
                        )
                        kept_labels += 1

        # Write label file (empty file is okay if no kept objects)
        with open(new_lbl_path, "w", encoding="utf-8") as f:
            f.write("\n".join(remapped_lines))

    return image_count, kept_labels

# --------------------------------------------------
# MAIN
# --------------------------------------------------
def main():
    if OUTPUT_DIR.exists():
        shutil.rmtree(OUTPUT_DIR)

    ensure_dirs(OUTPUT_DIR)

    # Read source YAMLs
    names1, yaml1 = load_yaml_names(DATASET_1 / "data.yaml")
    names2, yaml2 = load_yaml_names(DATASET_2 / "data.yaml")

    # Process dataset 1
    train_img_1, train_lbl_1 = process_split(DATASET_1, names1, MAP_1, "train", "dataset1")
    valid_img_1, valid_lbl_1 = process_split(DATASET_1, names1, MAP_1, "valid", "dataset1")
    test_img_1, test_lbl_1   = process_split(DATASET_1, names1, MAP_1, "test", "dataset1")

    # Process dataset 2
    train_img_2, train_lbl_2 = process_split(DATASET_2, names2, MAP_2, "train", "dataset2")
    valid_img_2, valid_lbl_2 = process_split(DATASET_2, names2, MAP_2, "valid", "dataset2")
    test_img_2, test_lbl_2   = process_split(DATASET_2, names2, MAP_2, "test", "dataset2")

    # Write merged data.yaml
    data_yaml = {
        "path": str(OUTPUT_DIR.resolve()),
        "train": "train/images",
        "valid": "valid/images",
        "test": "test/images",
        "nc": len(FINAL_CLASSES),
        "names": FINAL_CLASSES,
    }

    with open(OUTPUT_DIR / "data.yaml", "w", encoding="utf-8") as f:
        yaml.safe_dump(data_yaml, f, sort_keys=False)

    # Summary
    print("\nMERGE COMPLETE")
    print("=" * 50)
    print(f"Output folder : {OUTPUT_DIR}")
    print(f"Classes       : {FINAL_CLASSES}")
    print("-" * 50)
    print(f"Dataset 1 images: train={train_img_1}, valid={valid_img_1}, test={test_img_1}")
    print(f"Dataset 1 labels: train={train_lbl_1}, valid={valid_lbl_1}, test={test_lbl_1}")
    print(f"Dataset 2 images: train={train_img_2}, valid={valid_img_2}, test={test_img_2}")
    print(f"Dataset 2 labels: train={train_lbl_2}, valid={valid_lbl_2}, test={test_lbl_2}")
    print("=" * 50)

if __name__ == "__main__":
    main()