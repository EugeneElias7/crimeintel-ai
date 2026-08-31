import logging
import io
import os
from typing import Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse

from middleware.auth_middleware import get_current_user
from models.common import SuccessResponse
from services.case_service import CaseService
from services.evidence_service import EvidenceService
from services.analytics_service import AnalyticsService
from adapters.db import db
from adapters.local_fs import local_fs
from fpdf import FPDF

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/reports", tags=["Reports"])

case_service = CaseService(db=db)
evidence_service = EvidenceService(db=db, fs=local_fs)
analytics_service = AnalyticsService(db=db)


@router.get(
    "/case/{case_id}",
    response_model=SuccessResponse,
    status_code=status.HTTP_200_OK,
    summary="Get structured case report data",
)
async def get_case_report(
    case_id: str,
    current_user: dict = Depends(get_current_user),
):
    try:
        case = await case_service.get_case(case_id)
        evidence_list = await evidence_service.list_evidence(case_id)

        timeline = case.get("timeline_events", [])
        suspects = case.get("suspects", [])
        witnesses = case.get("witnesses", [])

        report = {
            "case_info": {
                "case_id": case.get("case_id"),
                "fir_number": case.get("fir_number"),
                "crime_type": case.get("crime_type"),
                "status": case.get("status"),
                "date_filed": case.get("date_filed"),
                "location": case.get("location"),
                "district": case.get("district"),
                "description": case.get("description"),
                "priority": case.get("priority"),
                "officer": case.get("officer"),
            },
            "evidence": [
                {
                    "evidence_id": e.get("evidence_id"),
                    "file_name": e.get("file_name"),
                    "file_type": e.get("file_type"),
                    "file_size": e.get("file_size"),
                    "description": e.get("description"),
                    "sensitive": e.get("sensitive", False),
                    "uploaded_at": e.get("uploaded_at"),
                }
                for e in evidence_list
            ],
            "timeline": [
                {
                    "event_id": t.get("event_id"),
                    "event_date": t.get("event_date"),
                    "event_type": t.get("event_type"),
                    "description": t.get("description"),
                    "officer": t.get("officer"),
                }
                for t in timeline
            ],
            "suspects": [
                {
                    "suspect_id": s.get("suspect_id"),
                    "name": s.get("name"),
                    "alias": s.get("alias"),
                    "age": s.get("age"),
                    "gender": s.get("gender"),
                    "status": s.get("status"),
                }
                for s in suspects
            ],
            "witnesses": [
                {
                    "witness_id": w.get("witness_id"),
                    "name": w.get("name"),
                    "contact": w.get("contact"),
                    "credibility_score": w.get("credibility_score"),
                    "status": w.get("status"),
                }
                for w in witnesses
            ],
            "summary": {
                "total_evidence": len(evidence_list),
                "total_suspects": len(suspects),
                "total_witnesses": len(witnesses),
                "total_timeline_events": len(timeline),
            },
        }

        return SuccessResponse(data=report, message="Case report generated successfully.")
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except Exception as e:
        logger.exception("Failed to generate case report for %s: %s", case_id, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate case report.",
        )


@router.get(
    "/summary",
    response_model=SuccessResponse,
    status_code=status.HTTP_200_OK,
    summary="Get summary report with KPIs and crime distribution",
)
async def get_summary_report(
    current_user: dict = Depends(get_current_user),
    from_date: Optional[str] = Query(default=None, alias="from", description="Start date (ISO format)"),
    to_date: Optional[str] = Query(default=None, alias="to", description="End date (ISO format)"),
    district: Optional[str] = Query(default=None, description="Filter by district"),
):
    try:
        overview = await analytics_service.get_overview(from_date=from_date, to_date=to_date)
        distribution = await analytics_service.get_distribution(from_date=from_date, to_date=to_date)
        trends = await analytics_service.get_trends(from_date=from_date, to_date=to_date)
        by_district = await analytics_service.get_by_district(from_date=from_date, to_date=to_date)

        if district:
            by_district = [d for d in by_district if d["district"] == district]

        report = {
            "period": {"from": from_date or "", "to": to_date or ""},
            "district_filter": district,
            "kpis": {
                "total_cases": overview["total_cases"],
                "open_cases": overview["open_cases"],
                "closed_cases": overview["closed_cases"],
                "filed_cases": overview["filed_cases"],
                "clearance_rate": overview["clearance_rate"],
                "avg_resolution_days": overview["avg_resolution_days"],
            },
            "crime_distribution": distribution,
            "trends": trends,
            "district_breakdown": by_district,
        }

        return SuccessResponse(data=report, message="Summary report generated successfully.")
    except Exception as e:
        logger.exception("Failed to generate summary report: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate summary report.",
        )


class PDFReport(FPDF):
    def __init__(self):
        super().__init__("P", "mm", "A4")
        self.alias_nb_pages()
        self.set_auto_page_break(auto=True, margin=20)

    def header(self):
        self.set_font("Helvetica", "B", 16)
        self.set_text_color(30, 58, 138)
        self.cell(0, 10, "CRIME INTELLIGENCE REPORT", align="C", new_x="LMARGIN", new_y="NEXT")
        self.set_font("Helvetica", "", 10)
        self.set_text_color(100, 116, 139)
        self.cell(0, 6, "Karnataka State Police - CrimeIntel Platform", align="C", new_x="LMARGIN", new_y="NEXT")
        self.ln(4)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(128, 128, 128)
        self.cell(0, 10, f"Page {self.page_no()}/{{nb}}", align="C")
        self.set_font("Helvetica", "I", 7)
        self.cell(0, 5, f"CrimeIntel - Confidential | Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} IST", align="C")

    def add_case_header(self, case):
        self.set_font("Helvetica", "B", 14)
        self.set_text_color(30, 58, 138)
        self.cell(0, 8, f"Case Report: {case.get('fir_number', case.get('case_id', 'N/A'))}", new_x="LMARGIN", new_y="NEXT")
        self.set_font("Helvetica", "", 11)
        self.set_text_color(51, 65, 85)
        self.cell(0, 6, case.get("title", "Untitled Case"), new_x="LMARGIN", new_y="NEXT")
        self.ln(2)
        self.set_font("Helvetica", "", 9)
        self.set_text_color(100, 116, 139)
        self.cell(0, 5, f"Case ID: {case.get('case_id', 'N/A')} | Crime: {case.get('crime_type', 'N/A')} | Status: {case.get('status', 'N/A')}", new_x="LMARGIN", new_y="NEXT")
        self.cell(0, 5, f"Location: {case.get('location', 'N/A')} | District: {case.get('district', 'N/A')}", new_x="LMARGIN", new_y="NEXT")
        self.cell(0, 5, f"Date Filed: {case.get('date_filed', 'N/A')} | Priority: {case.get('priority', 'N/A')}", new_x="LMARGIN", new_y="NEXT")
        self.ln(4)

    def add_section_title(self, title):
        self.set_font("Helvetica", "B", 12)
        self.set_text_color(30, 58, 138)
        self.cell(0, 8, title, new_x="LMARGIN", new_y="NEXT")
        self.set_draw_color(30, 58, 138)
        self.line(self.l_margin, self.get_y(), self.w - self.r_margin, self.get_y())
        self.ln(3)

    def add_key_value(self, label, value):
        self.set_font("Helvetica", "B", 9)
        self.set_text_color(100, 116, 139)
        self.cell(45, 5, label, new_x="LMARGIN", new_y="NEXT")
        self.set_font("Helvetica", "", 9)
        self.set_text_color(30, 41, 59)
        self.multi_cell(0, 5, str(value) if value else "—")
        self.ln(1)

    def add_section_content(self, title, content):
        self.add_section_title(title)
        self.set_font("Helvetica", "", 9)
        self.set_text_color(30, 41, 59)
        self.multi_cell(0, 5, content if content else "Not provided")
        self.ln(3)

    def add_table(self, headers, data, col_widths):
        # Header
        self.set_font("Helvetica", "B", 8)
        self.set_fill_color(30, 58, 138)
        self.set_text_color(255, 255, 255)
        for i, header in enumerate(headers):
            self.cell(col_widths[i], 6, header, border=1, fill=True, align="C")
        self.ln()
        # Data
        self.set_font("Helvetica", "", 8)
        self.set_text_color(30, 41, 59)
        fill = False
        for row in data:
            if self.get_y() > 270:
                self.add_page()
            if fill:
                self.set_fill_color(240, 245, 255)
            else:
                self.set_fill_color(255, 255, 255)
            for i, cell in enumerate(row):
                self.cell(col_widths[i], 5, str(cell), border=1, fill=fill, align="L")
            self.ln()
            fill = not fill
        self.ln(3)


@router.get(
    "/case/{case_id}/pdf",
    summary="Download case report as PDF",
)
async def download_case_report_pdf(
    case_id: str,
    current_user: dict = Depends(get_current_user),
):
    try:
        case = await case_service.get_case(case_id)
        evidence_list = await evidence_service.list_evidence(case_id)
        timeline = case.get("timeline_events", [])
        suspects = case.get("suspects", [])
        witnesses = case.get("witnesses", [])

        pdf = PDFReport()
        pdf.add_page()

        # Case header
        pdf.add_case_header(case)

        # Case details
        pdf.add_section_title("Case Details")
        pdf.add_key_value("Case Number", case.get("fir_number", case.get("case_id", "N/A")))
        pdf.add_key_value("Case Title", case.get("title", "N/A"))
        pdf.add_key_value("Crime Type", case.get("crime_type", "N/A"))
        pdf.add_key_value("Status", case.get("status", "N/A"))
        pdf.add_key_value("Priority", case.get("priority", "N/A"))
        pdf.add_key_value("Date Filed", case.get("date_filed", "N/A"))
        pdf.add_key_value("Location", case.get("location", "N/A"))
        pdf.add_key_value("District", case.get("district", "N/A"))
        pdf.add_key_value("Priority", case.get("priority", "N/A"))
        pdf.add_key_value("Status", case.get("status", "N/A"))
        pdf.ln(2)

        # Description
        pdf.add_section_content("Description", case.get("description", "Not provided"))

        # Evidence
        if evidence_list:
            pdf.add_section_title("Evidence")
            ev_headers = ["File Name", "Type", "Size", "Description", "Uploaded", "Sensitive"]
            ev_widths = [35, 20, 20, 45, 25, 20]
            ev_data = []
            for e in evidence_list:
                ev_data.append([
                    e.get("file_name", "N/A")[:30],
                    e.get("file_type", "N/A"),
                    f"{e.get('file_size', 0) / 1024:.1f} KB",
                    e.get("description", "")[:30],
                    e.get("uploaded_at", "")[:10],
                    "Yes" if e.get("sensitive") else "No"
                ])
            pdf.add_table(ev_headers, ev_data, ev_widths)

        # Timeline
        if case.get("timeline_events"):
            pdf.add_section_title("Timeline")
            tl_headers = ["Date", "Type", "Description", "Officer"]
            tl_widths = [25, 30, 100, 30]
            tl_data = []
            for t in case.get("timeline_events", []):
                tl_data.append([
                    t.get("event_date", "")[:10],
                    t.get("event_type", "N/A"),
                    t.get("description", "")[:50],
                    t.get("officer", {}).get("display_name", "N/A")[:15]
                ])
            pdf.add_table(tl_headers, tl_data, tl_widths)

        # Suspects
        suspects = case.get("suspects", [])
        if suspects:
            pdf.add_section_title("Suspects")
            s_headers = ["Name", "Age", "Gender", "Status", "Description"]
            s_widths = [30, 15, 20, 25, 70]
            s_data = []
            for s in suspects:
                s_data.append([
                    s.get("name", "N/A")[:25],
                    str(s.get("age", "")),
                    s.get("gender", "N/A"),
                    s.get("status", "N/A"),
                    s.get("description", "N/A")[:40]
                ])
            pdf.add_table(["Name", "Age", "Gender", "Status", "Description"], s_data, [30, 15, 20, 25, 70])

        # Witnesses
        witnesses = case.get("witnesses", [])
        if witnesses:
            pdf.add_section_title("Witnesses")
            w_headers = ["Name", "Contact", "Credibility", "Statement"]
            w_widths = [35, 30, 25, 90]
            w_data = []
            for w in witnesses:
                w_data.append([
                    w.get("name", "N/A")[:30],
                    w.get("contact", "N/A")[:20],
                    str(w.get("credibility_score", "N/A")),
                    w.get("statement_summary", "")[:50]
                ])
            pdf.add_table(["Name", "Contact", "Credibility", "Statement"], w_data, [35, 30, 25, 100])

        # Output
        pdf_output = pdf.output(dest="S").encode("latin-1")
        pdf_buffer = io.BytesIO(pdf_output)
        pdf_buffer.seek(0)

        filename = f"CrimeIntel_Report_{case.get('fir_number', case.get('case_id', 'case'))}_{datetime.now().strftime('%Y%m%d')}.pdf"

        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        logger.exception("Failed to generate PDF report for %s: %s", case_id, e)
        raise HTTPException(status_code=500, detail="Failed to generate PDF report.")