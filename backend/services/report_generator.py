import os
import logging
from datetime import datetime
from pathlib import Path
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from config.config import REPORTS_DIR, BASE_DIR

logger = logging.getLogger(__name__)

def generate_pdf_report(classroom_id: str, date_str: str, events: list, alerts: list, evidence: list, peak_occupancy: int = 0) -> str:
    """
    Generates a professional PDF monitoring report using ReportLab.
    Returns the file path of the generated PDF report.
    """
    filename = f"Report_{classroom_id}_{date_str}_{datetime.now().strftime('%H%M%S')}.pdf"
    pdf_path = REPORTS_DIR / filename

    doc = SimpleDocTemplate(
        str(pdf_path),
        pagesize=letter,
        rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#1E293B')
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#64748B')
    )

    section_style = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=colors.HexColor('#0F172A'),
        spaceBefore=12,
        spaceAfter=6
    )

    body_style = ParagraphStyle(
        'BodyTextCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#334155')
    )

    story = []

    # Header
    story.append(Paragraph("AI-BASED SMART CLASSROOM MONITORING SYSTEM", title_style))
    story.append(Paragraph(f"Official Surveillance & Incident Report | Classroom: {classroom_id} | Date: {date_str}", subtitle_style))
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor('#2563EB'), spaceAfter=15))

    # Summary Metrics Table
    summary_data = [
        ["Classroom ID", "Report Date", "Peak Occupancy", "Total Events", "Critical Alerts", "Evidence Screenshots"],
        [classroom_id, date_str, str(peak_occupancy), str(len(events)), str(len(alerts)), str(len(evidence))]
    ]

    t_summary = Table(summary_data, colWidths=[90, 90, 90, 90, 90, 90])
    t_summary.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1E293B')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('BACKGROUND', (0, 1), (-1, 1), colors.HexColor('#F1F5F9')),
        ('TEXTCOLOR', (0, 1), (-1, 1), colors.HexColor('#0F172A')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(t_summary)
    story.append(Spacer(1, 15))

    # Active Alerts Section
    story.append(Paragraph("1. High Priority & Active Alerts", section_style))
    if alerts:
        alert_table_data = [["Time", "Type", "Severity", "Message", "Confidence"]]
        for a in alerts[:10]:  # Limit top 10 for clean output
            sev_color = colors.HexColor('#EF4444') if a.get("severity") == "HIGH" else colors.HexColor('#F59E0B')
            alert_table_data.append([
                a.get("time", ""),
                a.get("alert_type", ""),
                a.get("severity", ""),
                Paragraph(a.get("message", ""), body_style),
                f"{float(a.get('confidence', 0)):.2f}"
            ])
        t_alerts = Table(alert_table_data, colWidths=[65, 110, 65, 230, 70])
        t_alerts.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0F172A')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 8.5),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ]))
        story.append(t_alerts)
    else:
        story.append(Paragraph("No critical alerts recorded for this session.", body_style))

    story.append(Spacer(1, 15))

    # Event Timeline Section
    story.append(Paragraph("2. Event Timeline Log", section_style))
    if events:
        event_table_data = [["Time", "Event Type", "Classroom", "Confidence", "Details"]]
        for e in events[:15]:
            event_table_data.append([
                e.get("time", ""),
                e.get("event_type", ""),
                e.get("classroom_id", ""),
                f"{float(e.get('confidence', 0)):.2f}",
                Paragraph(e.get("details", ""), body_style)
            ])
        t_events = Table(event_table_data, colWidths=[65, 110, 75, 70, 220])
        t_events.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#334155')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 8.5),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ]))
        story.append(t_events)
    else:
        story.append(Paragraph("No behavior events recorded during this session.", body_style))

    story.append(Spacer(1, 15))

    # Captured Evidence Section
    story.append(Paragraph("3. Captured Evidence Gallery", section_style))
    if evidence:
        for ev in evidence[:4]:
            rel_path = ev.get("image_path", "").lstrip("/")
            full_img_path = BASE_DIR / rel_path
            if full_img_path.exists():
                try:
                    story.append(Paragraph(f"• Incident: {ev.get('event_type')} | Time: {ev.get('time')} | Classroom: {ev.get('classroom_id')}", body_style))
                    story.append(Spacer(1, 4))
                    story.append(Image(str(full_img_path), width=240, height=140))
                    story.append(Spacer(1, 8))
                except Exception as img_err:
                    logger.error(f"Error embedding image in PDF report: {img_err}")
    else:
        story.append(Paragraph("No evidence screenshots captured.", body_style))

    story.append(Spacer(1, 20))
    story.append(Paragraph(f"Generated automatically by Command Center System at {datetime.now().strftime('%Y-%m-%d %I:%M:%S %p')}", subtitle_style))

    doc.build(story)
    logger.info(f"Generated PDF report successfully at {pdf_path}")
    return f"/reports/{filename}"
