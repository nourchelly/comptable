import pytesseract
from PIL import Image
from PyPDF2 import PdfReader
from pdf2image import convert_from_bytes

import io
import re
import fitz  # PyMuPDF
def extract_text_with_ocr(file_stream, max_pages=None):
    """Convertit le PDF en images, puis utilise l'OCR pour extraire tout le texte"""
    try:
        # Lire le contenu du fichier
        file_content = file_stream.read()
        
        # Essayer d'abord d'extraire le texte avec PyPDF2 (pour les PDFs textuels)
        text_from_pdf = ""
        try:
            pdf = PdfReader(io.BytesIO(file_content))
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text_from_pdf += page_text + "\n\n"
        except Exception as e:
            print(f"Extraction PyPDF2 échouée: {e}")
        
        # Si PyPDF2 a extrait du texte substantiel, l'utiliser
        if len(text_from_pdf.strip()) > 100:
            return text_from_pdf
        
        # Sinon, utiliser OCR
        images = convert_from_bytes(
            io.BytesIO(file_content),
            first_page=1, 
            last_page=max_pages if max_pages else None
        )
        
        text = ""
        for img in images:
            text += pytesseract.image_to_string(img, lang='eng+fra') + "\n\n"
        
        return text
    except Exception as e:
        print(f"Erreur d'extraction de texte: {e}")
        return ""