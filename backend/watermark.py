import shutil, io, os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "..", "static", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

COMPANY_NAME = "Eagle Industrial Services Pvt. Ltd."


def watermark_image(src: str, dst: str, text: str = COMPANY_NAME):
    try:
        from PIL import Image, ImageDraw, ImageFont
        img = Image.open(src).convert("RGBA")
        overlay = Image.new("RGBA", img.size, (255, 255, 255, 0))
        draw = ImageDraw.Draw(overlay)
        W, H = img.size
        try:
            font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", max(18, W // 35))
        except:
            font = ImageFont.load_default()
        for y in range(-H, H * 2, max(H // 5, 100)):
            for x in range(-W, W * 2, max(W // 3, 200)):
                draw.text((x, y), text, font=font, fill=(180, 0, 0, 50))
        result = Image.alpha_composite(img, overlay).convert("RGB")
        result.save(dst, quality=90)
    except Exception:
        shutil.copy(src, dst)


def watermark_pdf(src: str, dst: str, text: str = COMPANY_NAME):
    try:
        from pypdf import PdfReader, PdfWriter
        from reportlab.pdfgen import canvas as rl_c
        reader = PdfReader(src)
        writer = PdfWriter()
        for page in reader.pages:
            w = float(page.mediabox.width)
            h = float(page.mediabox.height)
            buf = io.BytesIO()
            c = rl_c.Canvas(buf, pagesize=(w, h))
            c.saveState()
            c.setFont("Helvetica-Bold", max(14, int(w / 30)))
            c.setFillColorRGB(0.65, 0, 0, alpha=0.12)
            c.translate(w / 2, h / 2)
            c.rotate(38)
            c.drawCentredString(0, 40, text)
            c.drawCentredString(0, -30, "CONFIDENTIAL — DO NOT DISTRIBUTE")
            c.setFont("Helvetica", max(8, int(w / 50)))
            c.setFillColorRGB(0.5, 0, 0, alpha=0.09)
            c.drawCentredString(0, -75, "+91 89566 79935 | eagleisplpune@gmail.com")
            c.restoreState()
            c.save()
            buf.seek(0)
            from pypdf import PdfReader as PR2
            op = PR2(buf).pages[0]
            page.merge_page(op)
            writer.add_page(page)
        with open(dst, "wb") as f:
            writer.write(f)
    except Exception:
        shutil.copy(src, dst)
