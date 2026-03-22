"""PDF text extraction endpoint — uses pypdf (already installed)."""

import io
from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import JSONResponse
import pypdf

router = APIRouter()


@router.post("/extract-text")
async def extract_pdf_text(file: UploadFile = File(...)):
    if file.content_type not in ("application/pdf", "application/octet-stream"):
        # Accept anything and let pypdf fail gracefully
        pass

    try:
        data = await file.read()
        reader = pypdf.PdfReader(io.BytesIO(data))
        pages = []
        for page in reader.pages:
            text = page.extract_text() or ""
            pages.append(text)
        full_text = "\n\n".join(pages).strip()
        if not full_text:
            raise ValueError("No text found — PDF may be image-only or scanned.")
        return JSONResponse({"text": full_text, "pages": len(reader.pages)})
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))
