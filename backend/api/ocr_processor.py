from PyPDF2 import PdfReader
from pdf2image import convert_from_bytes
import pytesseract
import io
import re

def extract_text_with_ocr(pdf_file):
    """Extract text from PDF using OCR if needed"""
    try:
        # First try to extract text directly
        reader = PdfReader(pdf_file)
        text = ""
        for page in reader.pages:
            text += page.extract_text() or ""
        
        # If no text found, use OCR
        if len(text.strip()) < 50:  # Arbitrary threshold
            images = convert_from_bytes(pdf_file.read())
            text = ""
            for img in images:
                text += pytesseract.image_to_string(img) + "\n"
        
        return text
    except Exception as e:
        raise Exception(f"Erreur d'extraction texte: {str(e)}")