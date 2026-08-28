import sys
from pathlib import Path
from ultralytics import YOLO

# Add root directory to path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))

from config.config import BEHAVIOR_DATASET_DIR, MODELS_DIR

def train_behavior():
    yaml_path = BEHAVIOR_DATASET_DIR / "data.yaml"
    if not yaml_path.exists():
        print(f"Error: behavior dataset config not found at {yaml_path}")
        print("Please run merge_behavior_datasets.py first!")
        return

    print("=" * 60)
    print("Training Classroom Behavior Model (Model 2)...")
    print(f"Dataset: {yaml_path}")
    print("=" * 60)

    model = YOLO("yolov8n.pt")  # Load pretrained YOLOv8 base
    results = model.train(
        data=str(yaml_path.resolve()),
        epochs=10,  # Fast training run
        imgsz=640,
        batch=16,
        project=str(MODELS_DIR),
        name="behavior_train_run",
        exist_ok=True
    )

    # Save best weights to models/behavior_yolo.pt
    best_weights = MODELS_DIR / "behavior_train_run" / "weights" / "best.pt"
    target_weights = MODELS_DIR / "behavior_yolo.pt"

    if best_weights.exists():
        import shutil
        shutil.copy2(best_weights, target_weights)
        print(f"Successfully saved behavior model weights to {target_weights}")
    else:
        print("Model training complete.")

if __name__ == "__main__":
    train_behavior()
