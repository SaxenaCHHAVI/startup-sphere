import os
from reportlab.lib.pagesizes import letter, landscape
from reportlab.pdfgen import canvas
from reportlab.lib import colors

def create_sample_deck(pdf_path: str):
    c = canvas.Canvas(pdf_path, pagesize=landscape(letter))
    width, height = landscape(letter)

    # Slide 1: Cover
    c.setFillColor(colors.HexColor("#0f0f1c"))
    c.rect(0, 0, width, height, fill=1, stroke=0)
    c.setFillColor(colors.HexColor("#8b5cf6"))
    c.setFont("Helvetica-Bold", 36)
    c.drawString(60, height - 120, "Nexus AI - Series Seed")
    c.setFillColor(colors.HexColor("#d8b4fe"))
    c.setFont("Helvetica", 18)
    c.drawString(60, height - 160, "Autonomous Intelligence Layer for High-Growth Enterprise SaaS")
    c.setFillColor(colors.white)
    c.setFont("Helvetica", 14)
    c.drawString(60, 80, "Confidential Pitch Deck • 2026")
    c.showPage()

    # Slide 2: Problem & Market TAM
    c.setFillColor(colors.HexColor("#0f0f1c"))
    c.rect(0, 0, width, height, fill=1, stroke=0)
    c.setFillColor(colors.HexColor("#8b5cf6"))
    c.setFont("Helvetica-Bold", 28)
    c.drawString(60, height - 80, "Market Opportunity & TAM")
    c.setFillColor(colors.white)
    c.setFont("Helvetica", 16)
    c.drawString(60, height - 140, "• Global Cloud Data Automation Market expanding at 24% CAGR")
    c.drawString(60, height - 180, "• Total Addressable Market (TAM): $16.5B across Tier-1 enterprise segments")
    c.drawString(60, height - 220, "• High customer urgency with 60+ qualified enterprise waitlist accounts")
    c.showPage()

    # Slide 3: Traction & Financial Metrics
    c.setFillColor(colors.HexColor("#0f0f1c"))
    c.rect(0, 0, width, height, fill=1, stroke=0)
    c.setFillColor(colors.HexColor("#8b5cf6"))
    c.setFont("Helvetica-Bold", 28)
    c.drawString(60, height - 80, "Financial Traction & Unit Economics")
    c.setFillColor(colors.white)
    c.setFont("Helvetica", 16)
    c.drawString(60, height - 130, "Key Financial Indicators:")
    c.drawString(80, height - 170, "• Monthly Recurring Revenue (MRR): $38,000 / mo ($456k ARR)")
    c.drawString(80, height - 210, "• Gross Monthly Burn Rate: $44,000")
    c.drawString(80, height - 250, "• Cash Reserves: $700,000 with 16 months runway")
    c.drawString(80, height - 290, "• Unit Economics: CAC is $480, Customer LTV is $2,900")
    c.drawString(80, height - 330, "• Customer Retention: Monthly churn rate is 2.2% with 118% NRR")
    c.showPage()

    # Slide 4: Team
    c.setFillColor(colors.HexColor("#0f0f1c"))
    c.rect(0, 0, width, height, fill=1, stroke=0)
    c.setFillColor(colors.HexColor("#8b5cf6"))
    c.setFont("Helvetica-Bold", 28)
    c.drawString(60, height - 80, "Founding Team & Execution Pedigree")
    c.setFillColor(colors.white)
    c.setFont("Helvetica", 16)
    c.drawString(60, height - 140, "• Exceptional team of 8 full-time engineers and ML researchers")
    c.drawString(60, height - 180, "• Founders bring 6 years of deep enterprise infrastructure experience")
    c.drawString(60, height - 220, "• Previous exit in data analytics with top-tier venture backing")
    c.showPage()

    c.save()
    print(f"Generated sample pitch deck: {pdf_path}")

if __name__ == "__main__":
    out1 = r"c:\startup_sphere\sample_pitch_deck.pdf"
    out2 = r"c:\startup_sphere\client\public\sample_pitch_deck.pdf"
    os.makedirs(os.path.dirname(out2), exist_ok=True)
    create_sample_deck(out1)
    create_sample_deck(out2)
