
from flask import Flask, request, jsonify,make_response,current_app
import google.generativeai as genai
from flask_mongoengine import MongoEngine
from mongoengine import Document, StringField, ListField, EmbeddedDocumentListField, ReferenceField, DictField, DateTimeField # Include all necessary MongoEngine field types you might use or check against
from mongoengine import connect
import sys
import traceback
import openpyxl
import PyPDF2
import numpy as np
from mongoengine.queryset.visitor import Q
import cv2
import pytesseract
from pdf2image import convert_from_path
import tempfile
import os
import shutil
import traceback
import re
from bson import ObjectId
import json  # Assurez-vous que cette importation est présente
from mongoengine.connection import get_db
from mongoengine.errors import DoesNotExist, ValidationError
from collections import Counter
import cv2
import numpy as np
import tempfile
import os
import pandas as pd
from io import BytesIO
import json
import os
from werkzeug.utils import secure_filename
from api.models import Facture,Rapport, Banque,Reconciliation ,ImportedFile
import threading
import time
import PyPDF2
import re
from datetime import datetime, timedelta, date, timezone  # Ajout de l'import manquant
import pytesseract  # Pour l'OCR
from pdf2image import convert_from_path  # Pour convertir PDF en images
from PIL import Image  # Pour manipuler les images
import io
import logging

# Configuration du logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration API Gemini
genai.configure(api_key="AIzaSyBqm2z_pcTDCU0ubeEMidJRohRkXDvlIsg")

model = genai.GenerativeModel(
    model_name="gemini-1.5-flash",
    generation_config={"temperature": 0.3, "max_output_tokens": 4096}
)

from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:3000"],  # Adresse de votre frontend React
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "expose_headers": ["Content-Type"],
        "supports_credentials": True,


    },
    r"/api/reconciliations": {  # Configuration spécifique pour votre route /api/reconciliations
        "origins": ["http://localhost:3000"],
        "methods": ["GET"],
        "allow_headers": ["Content-Type"],
        "supports_credentials": True  # Assurez-vous que c'est inclus ici aussi
    }

})
@app.after_request
def after_request(response):
    # Headers CORS explicites
    response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    response.headers.add('Access-Control-Expose-Headers', 'Content-Type')
    return response # Autorise toutes les origines (à restreindre en prod)
app.config['MONGODB_SETTINGS'] = {
    'db': 'mydb',
    'host': 'localhost',
    'port': 27017
}
db = MongoEngine(app)


# Connexion à la base de données MongoDB
connect('mydb')
indexes = get_db().factures.index_information()
print(indexes)
# Configuration du dossier de téléchargement
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Configuration de Tesseract OCR
# Si vous êtes sous Windows, spécifiez le chemin vers tesseract.exe
# pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

# Fonctions d'extraction de texte
def extract_text_from_pdf(filepath):
    """Version améliorée avec plus de logging"""
    try:
        print(f"\n=== Tentative d'extraction texte standard ===")
        with open(filepath, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            text = ""
            
            for i, page in enumerate(reader.pages):
                page_text = page.extract_text() or ""
                print(f"Page {i+1} - Texte extrait: {len(page_text)} caractères")
                if len(page_text) > 0:
                    print("Extrait:", page_text[:100].replace('\n', ' ') + "...")
                text += page_text
            
            if len(text.strip()) < 100:
                print("=== Texte trop court, tentative OCR ===")
                ocr_text = extract_text_with_ocr(filepath)
                return ocr_text
                
            return text
    except Exception as e:
        print(f"Erreur extraction standard: {str(e)}")
        return extract_text_with_ocr(filepath)

def preprocess_image(image):
    """Améliore la qualité de l'image pour l'OCR"""
    img_np = np.array(image)

    # Vérifie si l’image est déjà en niveaux de gris
    if len(img_np.shape) == 3 and img_np.shape[2] == 3:
        gray = cv2.cvtColor(img_np, cv2.COLOR_RGB2GRAY)
    else:
        gray = img_np  # déjà en niveaux de gris

    # Débruitage
    denoised = cv2.fastNlMeansDenoising(gray, h=30, templateWindowSize=7, searchWindowSize=21)

    # Seuillage adaptatif
    thresh = cv2.adaptiveThreshold(denoised, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                   cv2.THRESH_BINARY, 11, 2)

    # Amélioration de la netteté
    kernel = np.array([[-1, -1, -1], [-1, 9, -1], [-1, -1, -1]])
    sharpened = cv2.filter2D(thresh, -1, kernel)

    return sharpened


def extract_text_with_ocr(filepath, save_temp_images=False):
    """
    Utilise OCR pour extraire le texte d'un PDF scanné avec prétraitement d'image
    
    Args:
        filepath: Chemin vers le fichier PDF
        save_temp_images: Si True, sauvegarde les images traitées pour diagnostic
    
    Returns:
        Texte extrait ou message d'erreur
    """
    try:
        text = ""
        print(f"[OCR] Début traitement pour {filepath}")
        
        # Configuration Tesseract
        custom_config = r'--oem 3 --psm 6 -l fra+eng'
        
        # Conversion PDF en images avec résolution plus élevée
        images = convert_from_path(filepath, 
                                 dpi=300, 
                                 grayscale=True,
                                 thread_count=4)
        print(f"[OCR] PDF converti en {len(images)} images (300 DPI)")
        
        temp_dir = tempfile.mkdtemp()
        
        for i, image in enumerate(images):
            try:
                # Prétraitement de l'image
                processed_img = preprocess_image(image)
                
                if save_temp_images:
                    img_path = os.path.join(temp_dir, f"page_{i+1}_processed.png")
                    cv2.imwrite(img_path, processed_img)
                    print(f"[OCR] Image traitée sauvegardée: {img_path}")
                
                # Extraction du texte avec configuration optimisée
                page_text = pytesseract.image_to_string(processed_img, 
                                                      config=custom_config)
                
                # Nettoyage du texte
                page_text = ' '.join(page_text.split())  # Supprime les espaces multiples
                
                print(f"[OCR] Page {i+1}: {len(page_text)} caractères valides")
                text += f"\n--- Page {i+1} ---\n{page_text}\n"
                
            except Exception as page_error:
                print(f"[OCR] Erreur page {i+1}: {str(page_error)}")
                continue
        
        print(f"[OCR] Terminé avec succès. {len(text)} caractères extraits au total")
        return text.strip()
    
    except Exception as e:
        error_msg = f"[OCR] Erreur critique: {str(e)}"
        print(error_msg)
        import traceback
        traceback.print_exc()
        return error_msg
    finally:
        # Nettoyage des fichiers temporaires
         if 'temp_dir' in locals():
            import shutil
            shutil.rmtree(temp_dir, ignore_errors=True)
from functools import lru_cache

def safe_date(value):
    if value is None or not isinstance(value, str):
        return None
    date_formats = [
        '%Y-%m-%d', '%d/%m/%Y', '%d-%m-%Y', '%d.%m.%Y',
        '%m/%d/%Y', '%m/%d/%y', '%Y/%m/%d', '%m/%d/%y',
        "%d %b %Y", "%d %B %Y", "%d-%b-%Y", "%d-%B-%Y"
    ]
    for fmt in date_formats:
        try:
            return datetime.datetime.strptime(value.strip(), fmt).date()
        except ValueError:
            continue
    return None

def parse_date(date_str):
    formats = [
        "%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y", "%d.%m.%Y",
        "%d/%m/%y", "%Y/%m/%d", "%m/%d/%Y", "%d %b %Y",
        "%d %B %Y", "%d-%b-%Y", "%d-%B-%Y"
    ]
    for fmt in formats:
        try:
            return datetime.datetime.strptime(date_str, fmt)
        except ValueError:
            continue
    return None

def extract_field(text, pattern):
    match = re.search(pattern, text, re.IGNORECASE)
    return match.group(1).strip() if match and match.group(1) else None

def extract_amount(text, pattern):
    match = re.search(pattern, text)
    if not match:
        return None
    value_str = match.group(1).replace(" ", "").replace(",", "")
    try:
        return float(value_str)
    except ValueError:
        return None

def extract_period(text):
    match = re.search(r"Période\s*(?:du)?\s*(\d{2}/\d{2}/\d{4})\s*au\s*(\d{2}/\d{2}/\d{4})", text, re.IGNORECASE)
    return f"{match.group(1)} au {match.group(2)}" if match else None

# (bank_statement_data et is_bank_statement, ainsi que les fonctions de rapprochement restent inchangées)
def is_bank_statement(text):
    """
    Détecte si le texte est un relevé bancaire avec des critères plus robustes
    """
    text_lower = text.lower()
    
    print(f"[DEBUG] Début détection relevé bancaire")
    print(f"[DEBUG] Texte d'entrée (100 premiers caractères): {text_lower[:100]}")
    
    # === CRITÈRE 1: Mots-clés spécifiques aux relevés bancaires ===
    bank_specific_keywords = [
        "relevé de compte", "relevé bancaire", "extrait de compte",
        "compte courant", "extrait n°", "extrait de votre compte",
        "solde initial", "solde final", "ancien solde", "nouveau solde",
        "code banque", "code agence", "iban", "bic", "période du",
        "agence", "titulaire", "compte n°", "compte chèques",
        "compte cheques", "releve de compte"  # Ajout de variantes sans accents
    ]
    
    # Compter les mots-clés bancaires trouvés
    bank_kw_count = 0
    found_keywords = []
    for kw in bank_specific_keywords:
        if kw in text_lower:
            bank_kw_count += 1
            found_keywords.append(kw)
    
    print(f"[DEBUG] Mots-clés bancaires trouvés ({bank_kw_count}): {found_keywords}")
    
    # === CRITÈRE 2: Vérifier la présence d'opérations bancaires typiques ===
    operation_keywords = [
        "débit", "crédit", "montant", "paiement", "virement", "retrait",
        "carte visa", "prelevement", "retraitdab", "cartevisa", "dab",
        "cheque", "chèque", "versement", "depot", "dépôt"
    ]
    
    operation_kw_count = 0
    found_operations = []
    for kw in operation_keywords:
        if kw in text_lower:
            operation_kw_count += 1
            found_operations.append(kw)
    
    print(f"[DEBUG] Mots-clés opérations trouvés ({operation_kw_count}): {found_operations}")
    
    # === CRITÈRE 3: Pattern pour les dates et montants (format bancaire) ===
    # Pattern plus flexible pour les opérations bancaires
    date_patterns = [
        r"\d{2}/\d{2}/\d{4}",  # Format DD/MM/YYYY
        r"\d{2}-\d{2}-\d{4}",  # Format DD-MM-YYYY
        r"\d{1,2}/\d{1,2}/\d{2,4}"  # Format flexible
    ]
    
    date_found = False
    for pattern in date_patterns:
        if re.search(pattern, text):
            date_found = True
            print(f"[DEBUG] Pattern de date trouvé: {pattern}")
            break
    
    # Pattern pour les montants (plus flexible)
    amount_patterns = [
        r"[\d\s,]+\.\d{2}",  # Format avec point décimal
        r"[\d\s,]+,\d{2}",   # Format avec virgule décimale
        r"\d+\s*,\s*\d{2}",  # Montant avec virgule
        r"\d+\s*\.\s*\d{2}"  # Montant avec point
    ]
    
    amount_found = False
    for pattern in amount_patterns:
        if re.search(pattern, text):
            amount_found = True
            print(f"[DEBUG] Pattern de montant trouvé: {pattern}")
            break
    
    # === CRITÈRE 4: Indicateurs forts de relevé bancaire ===
    strong_indicators = [
        "extrait n°", "compte courant", "extrait de votre compte",
        "code banque", "code agence", "période du", "solde au"
    ]
    
    strong_indicator_found = False
    for indicator in strong_indicators:
        if indicator in text_lower:
            strong_indicator_found = True
            print(f"[DEBUG] Indicateur fort trouvé: {indicator}")
            break
    
    # === CRITÈRE 5: Exclusion des factures ===
    # Si trop de mots-clés de facture et pas assez de mots bancaires, ce n'est pas un relevé
    invoice_exclusion_keywords = [
        "facture n°", "devis n°", "tva", "montant ht", "montant ttc", 
        "net à payer", "échéance facture", "bon de commande"
    ]
    
    invoice_kw_count = 0
    for kw in invoice_exclusion_keywords:
        if kw in text_lower:
            invoice_kw_count += 1
    
    print(f"[DEBUG] Mots-clés facture trouvés (exclusion): {invoice_kw_count}")
    
    # Si beaucoup de mots facture et peu de mots bancaires, exclure
    if invoice_kw_count >= 3 and bank_kw_count < 2:
        print(f"[DEBUG] EXCLUSION: Trop de mots-clés facture ({invoice_kw_count}) vs bancaire ({bank_kw_count})")
        return False
    
    # === LOGIQUE DE DÉCISION ===
    print(f"[DEBUG] === RÉSUMÉ DES CRITÈRES ===")
    print(f"[DEBUG] Mots-clés bancaires: {bank_kw_count}")
    print(f"[DEBUG] Mots-clés opérations: {operation_kw_count}")
    print(f"[DEBUG] Date trouvée: {date_found}")
    print(f"[DEBUG] Montant trouvé: {amount_found}")
    print(f"[DEBUG] Indicateur fort: {strong_indicator_found}")
    
    # Conditions pour considérer comme relevé bancaire:
    # 1. Au moins 2 mots-clés bancaires ET au moins 1 opération ET (date OU montant)
    # OU
    # 2. Au moins 1 indicateur fort ET au moins 1 mot-clé bancaire
    
    condition_1 = (bank_kw_count >= 2 and operation_kw_count >= 1 and (date_found or amount_found))
    condition_2 = (strong_indicator_found and bank_kw_count >= 1)
    
    is_bank = condition_1 or condition_2
    
    print(f"[DEBUG] Condition 1 (2+ bancaire + 1+ opération + date/montant): {condition_1}")
    print(f"[DEBUG] Condition 2 (indicateur fort + 1+ bancaire): {condition_2}")
    print(f"[DEBUG] RÉSULTAT FINAL: {is_bank}")
    
    return is_bank
logging.basicConfig(level=logging.DEBUG)

def clean_amount(amount_str):
    """
    Nettoie une chaîne de caractères représentant un montant pour la convertir en float.
    Gère les différents formats de séparateurs décimaux (virgule, point), les espaces,
    les parenthèses pour les négatifs et les caractères non numériques.
    """
    if not amount_str:
        return 0.0
    
    amount_str = amount_str.strip()
    
    if amount_str in ('–', '-', '', ' ', 'N/A', 'n/a'):
        return 0.0

    is_negative = False
    if amount_str.startswith('(') and amount_str.endswith(')'):
        is_negative = True
        amount_str = amount_str[1:-1]
    
    if amount_str.startswith('-'):
        is_negative = True
        amount_str = amount_str[1:]
    elif amount_str.startswith('–'): # U+2013 (tiret cadratin)
        is_negative = True
        amount_str = amount_str[1:]
            
    amount_str = amount_str.replace(' ', '') 
    # Supprime tous les caractères qui ne sont ni chiffres, ni virgules, ni points
    amount_str = re.sub(r'[^\d,\.]', '', amount_str) 

    if not amount_str: 
        return 0.0

    # Gère les cas où les milliers sont séparés par des points et les décimales par une virgule
    # ou l'inverse, en normalisant toujours vers le point comme séparateur décimal.
    if ',' in amount_str and '.' in amount_str:
        # Si la dernière virgule apparaît après le dernier point, la virgule est le séparateur décimal
        if amount_str.rfind(',') > amount_str.rfind('.'):
            amount_str = amount_str.replace('.', '') # Supprime les séparateurs de milliers
            amount_str = amount_str.replace(',', '.') # Remplace la virgule décimale par un point
        else: # Sinon, le point est le séparateur décimal
            amount_str = amount_str.replace(',', '') # Supprime les séparateurs de milliers
    elif ',' in amount_str: # S'il n'y a qu'une virgule, c'est le séparateur décimal
        amount_str = amount_str.replace(',', '.')
    
    try:
        amount = float(amount_str)
        if is_negative:
            amount *= -1
        return round(amount, 2)
    except ValueError:
        logging.warning(f"Impossible de convertir le montant '{amount_str}' en float. Retourne 0.0.")
        return 0.0

def parse_date(date_input):
    """
    Analyse une entrée de date (chaîne ou objet datetime) en un objet datetime standardisé.
    Gère gracieusement l'entrée None en renvoyant None.
    Lève TypeError si l'entrée n'est pas une chaîne ou un datetime.
    Lève ValueError pour les chaînes de date non parsables.
    """
    if date_input is None:
        return None
    if isinstance(date_input, datetime):
        return date_input
    elif isinstance(date_input, str):
        cleaned_date_input = date_input.strip()
        
        # Cas spécifique pour "00/00/0000" ou des dates invalides
        if re.match(r'^\d{1,2}[/\-\.]\d{1,2}[/\-\.]0{2,4}$', cleaned_date_input):
            logging.warning(f"Invalid 'zero' date string encountered: '{cleaned_date_input}'. Returning None.")
            return None

        formats_to_try = [
            lambda s: datetime.fromisoformat(s.replace('Z', '+00:00')) if s.endswith('Z') else datetime.fromisoformat(s) if 'T' in s else None, # ISO format with/without Z
            lambda s: datetime.strptime(s, '%Y-%m-%d'), # YYYY-MM-DD
            lambda s: datetime.strptime(s, '%d/%m/%Y'), # DD/MM/YYYY
            lambda s: datetime.strptime(s, '%m/%d/%Y'), # MM/DD/YYYY
            lambda s: datetime.strptime(s, '%d-%m-%Y'), # DD-MM-YYYY
            lambda s: datetime.strptime(s, '%d.%m.%Y'), # DD.MM.YYYY
            # Pour gérer les années à 2 chiffres si nécessaire, mais soyez prudent
            # lambda s: datetime.strptime(s, '%d/%m/%y'), # DD/MM/YY
        ]
        for parser_func in formats_to_try:
            try:
                result = parser_func(cleaned_date_input)
                if result is not None:
                    return result
            except ValueError:
                continue
        logging.warning(f"Could not parse date string: '{date_input}'. Returning None.")
        return None # Ou raise ValueError si vous préférez une erreur explicite
    else:
        logging.warning(f"Date input must be a string, datetime object, or None. Got type: {type(date_input)} with value: {date_input!r}. Returning None.")
        return None # Ou raise TypeError

# La fonction parse_periode_to_dates reste la même si elle est utilisée ailleurs
def parse_periode_to_dates(periode_str):
    """
    Tente d'extraire la date de début et la date de fin d'une chaîne de période.
    Gère les formats courants comme 'DD/MM/YYYY - DD/MM/YYYY' ou 'YYYY-MM-DD to/fromYYYY-MM-DD'.
    Retourne un tuple (date_debut, date_fin) en tant qu'objets datetime, ou (None, None) si échec.
    """
    if not isinstance(periode_str, str) or not periode_str.strip():
        return None, None

    periode_str = periode_str.strip()

    # Regex pour DD/MM/YYYY - DD/MM/YYYY ou DD.MM.YYYY - DD.MM.YYYY
    match = re.search(r'(\d{1,2}[/.]\d{1,2}[/.]\d{2,4})\s*-\s*(\d{1,2}[/.]\d{1,2}[/.]\d{2,4})', periode_str)
    if match:
        date_str1, date_str2 = match.groups()
        # Important : appeler la version améliorée de parse_date ici
        date_debut = parse_date(date_str1.replace('.', '/'))
        date_fin = parse_date(date_str2.replace('.', '/'))
        return date_debut, date_fin

    # Regex pour YYYY-MM-DD to/from YYYY-MM-DD
    match = re.search(r'(\d{4}-\d{2}-\d{2})\s*(?:to|-|à|au)?\s*(\d{4}-\d{2}-\d{2})', periode_str, re.IGNORECASE)
    if match:
        date_str1, date_str2 = match.groups()
        # Important : appeler la version améliorée de parse_date ici
        date_debut = parse_date(date_str1)
        date_fin = parse_date(date_str2)
        return date_debut, date_fin
        
    return None, None

def extract_bank_statement_data(text):
    """
    Extrait les métadonnées et les opérations d'un relevé bancaire à partir de son texte OCR.
    """
    operations = []
    metadata = {}
    
    # Normalise le texte pour une meilleure extraction des métadonnées (remplace les retours à la ligne/espaces multiples)
    normalized_text_for_metadata = re.sub(r'\s+', ' ', text).strip()

    # --- 1. EXTRACTION DES MÉTADONNÉES ---

    # Détection de la banque (laissez tel quel)
    bank_patterns = {
        "Société Générale": [r'SOCIETE\s*GENERALE', r'SOCI[EÉ]T[EÉ]\s*G[EÉ]N[EÉ]RALE', r'\bSG\b'],
        "BNP Paribas": [r'BNP\s*PARIBAS', r'BANQUE\s*NATIONALE\s*DE\s*PARIS'],
        "Crédit Agricole": [r'CR[EÉ]DIT\s*AGRICOLE', r'CAISSE\s*R[EÉ]GIONALE'],
        "LCL": [r'\bLCL\b', r'CREDIT\s*LYONNAIS'],
        "Banque Populaire": [r'BANQUE\s*POPULAIRE', r'\bBP\b'],
        "Caisse d'Épargne": [r'CAISSE\s*D.?\'?[EÉ]PARGNE', r'CEPAC'],
        "La Banque Postale": [r'BANQUE\s*POSTALE', r'LA\s*POSTE'],
        "Crédit Mutuel": [r'CR[EÉ]DIT\s*MUTUEL', r'\bCM\b'],
        "HSBC": [r'\bHSBC\b'],
        "ING": [r'\bING\b'],
        "Boursorama": [r'BOURSORAMA'],
        "Hello Bank": [r'HELLO\s*BANK'],
        "Monabanq": [r'MONABANQ'],
        "Fortuneo": [r'FORTUNEO'],
        "Revolut": [r'REVOLUT'],
        "N26": [r'\bN26\b']
    }
    for bank_name, patterns in bank_patterns.items():
        for pattern in patterns:
            if re.search(pattern, normalized_text_for_metadata, re.IGNORECASE):
                metadata['banque'] = bank_name
                break
        if 'banque' in metadata:
            break
    if 'banque' not in metadata:
        bank_match = re.search(r'(BANQUE|CREDIT|CAISSE)\s+([A-Z\s]+)', normalized_text_for_metadata, re.IGNORECASE)
        if bank_match:
            metadata['banque'] = bank_match.group(0).strip()

    # Extraction du numéro de compte / IBAN / BIC (laissez tel quel)
    account_patterns = [
        r'Num[eé]ro\s*de\s*compte\s*:?\s*([\d\s]{10,})',
        r'N[°]?\s*COMPTE\s*:?\s*([\d\s]{10,})',
        r'RIB\s*:?\s*([\d\s]{10,})',
        r'(\d{5}\s*\d{5}\s*\d{11}\s*\d{2})', # Format français spécifique (Code Banque Code Guichet N° Compte Clé RIB)
        r'\bIBAN\b\s*:?\s*([A-Z]{2}\d{2}(?:\s*\w{4}){4}(?:\s*\w{1,2})?)', # IBAN
        r'Code\s*BIC\s*:?\s*([A-Z0-9]{8,11})' # BIC/SWIFT
    ]
    for pattern in account_patterns:
        account_match = re.search(pattern, normalized_text_for_metadata, re.IGNORECASE)
        if account_match:
            numero_compte = re.sub(r'\s+', '', account_match.group(1))
            if len(numero_compte) >= 10: # S'assurer que c'est un numéro de compte valide, pas juste un petit nombre
                metadata['numero_compte'] = numero_compte
                break
    
    # Extraction de la période du relevé (MODIFIÉE ICI)
    period_patterns = [
        r'P[eé]riode\s*:?\s*(\d{1,2}[/\-\.]\d{1,2}[/\-\.]\d{2,4})\s*-\s*(\d{1,2}[/\-\.]\d{1,2}[/\-\.]\d{2,4})',
        r'du\s+(\d{1,2}[/\-\.]\d{1,2}[/\-\.]\d{2,4})\s+au\s+(\d{1,2}[/\-\.]\d{1,2}[/\-\.]\d{2,4})',
        r'p[eé]riode\s*:?\s*(\d{1,2}[/\-\.]\d{1,2}[/\-\.]\d{2,4})\s*[aà]\s*(\d{1,2}[/\-\.]\d{1,2}[/\-\.]\d{2,4})',
        r'(\d{1,2}[/\-\.]\d{1,2}[/\-\.]\d{2,4})\s*[aà]\s*(\d{1,2}[/\-\.]\d{1,2}[/\-\.]\d{2,4})',
        r'extraits\s*de\s*compte\s*du\s*(\d{1,2}[/\-\.]\d{1,2}[/\-\.]\d{2,4})\s*au\s*(\d{1,2}[/\-\.]\d{1,2}[/\-\.]\d{2,4})'
    ]
    
    found_period_str = None
    for pattern in period_patterns:
        period_match = re.search(pattern, normalized_text_for_metadata, re.IGNORECASE)
        if period_match:
            # Reconstruire la chaîne de période complète à passer à parse_periode_to_dates
            found_period_str = f"{period_match.group(1)} - {period_match.group(2)}"
            break

    if found_period_str:
        date_debut_dt, date_fin_dt = parse_periode_to_dates(found_period_str)
        if date_debut_dt:
            metadata['date_debut'] = date_debut_dt
        if date_fin_dt:
            metadata['date_fin'] = date_fin_dt
        metadata['periode'] = found_period_str # Stocker la chaîne brute pour l'affichage ou une utilisation ultérieure
    else:
        logging.warning("Aucun motif de période trouvé ou impossible de l'analyser.")


    # Extraction du titulaire du compte (laissez tel quel)
    titulaire_patterns = [
        r'Titulaire\s*:?\s*([A-Z0-9\s.-]+(?:SARL|SA|SAS|EURL)?(?:AUTO)?(?:(?:CLIENT)\s)?(?:[A-Z\s-]+)?)',
        r'(?:Compte\s*de|Client)\s*:?\s*([A-Z][A-Z\s\-\']{2,}(?:\s+\w+){0,3})',
        r'M\.?\s*([A-Z][A-Z\s\-\']{2,}(?:\s+\w+){0,3})',
        r'MME\.?\s*([A-Z][A-Z\s\-\']{2,}(?:\s+\w+){0,3})',
        r'MR\.?\s*([A-Z][A-Z\s\-\']{2,}(?:\s+\w+){0,3})',
        r'MLLE\.?\s*([A-Z][A-Z\s\-\']{2,}(?:\s+\w+){0,3})',
        r'(?:Nom|Raison\s*Sociale)\s*:?\s*([^\n]+)'
    ]
    for pattern in titulaire_patterns:
        titulaire_match = re.search(pattern, normalized_text_for_metadata, re.IGNORECASE)
        if titulaire_match:
            titulaire = titulaire_match.group(1).strip()
            # Nettoyage spécifique pour éviter les faux positifs ou les restes d'OCR
            if titulaire.endswith(' P') and len(titulaire) > 2: 
                titulaire = titulaire[:-2].strip()
            # Filtrer les titulaires qui ressemblent à des totaux, adresses, etc.
            if not re.search(r'total|cr[eé]dit|d[eé]bit|\d{4,}|adresse|ville|cp', titulaire, re.IGNORECASE):
                metadata['titulaire'] = titulaire
                break

    # Ajout de l'extraction de la devise (DH, EUR, etc.) (laissez tel quel)
    devise_match = re.search(r'\b(DH|EUR|€)\b', normalized_text_for_metadata, re.IGNORECASE)
    if devise_match:
        devise_extracted = devise_match.group(1).upper()
        if devise_extracted == '€':
            metadata['devise'] = 'EUR' # Normaliser le symbole € en code ISO
        else:
            metadata['devise'] = devise_extracted
    else:
        metadata['devise'] = 'DH' # Valeur par défaut si aucune devise n'est trouvée dans le texte

    # --- 2. IDENTIFIER LA SECTION DES OPÉRATIONS --- (laissez tel quel)
    lines = text.split('\n')
    operations_start_line_idx = -1
    operations_end_line_idx = len(lines)

    # Patterns stricts pour l'en-tête des opérations
    header_patterns_strict = [
        r'^\s*Date\s+R[eé]f\.?\s*Facture\s+Libell[eé]\s+D[eé]bit\s+\(DH\)\s+Cr[eé]dit\s+\(DH\)\s+Solde\s+\(DH\)',
        r'"Date\s*\n?"?\s*,\s*"R[eé]f\.?\s*Facture\s*\n?"?\s*,\s*"Libell[eé]\s*\n?"?\s*,\s*"D[eé]bit\s*\(DH\)\s*\n?"?,\s*"?Cr[eé]dit\s*\(DH\)\s*\n?"?,\s*"Solde\s*\(DH\)\s*\n?"?',
        r'^\s*Date\s+(?:Op[eé]ration|Libell[eé])\s+(?:R[eé]f|D[eé]bit)\s+(?:D[eé]bit|Cr[eé]dit)\s+(?:Cr[eé]dit|Solde)\s+Solde',
        r'^\s*Date\s+Libell[eé]\s+D[eé]bit\s+Cr[eé]dit\s+Solde',
        r'^\s*Date\s+Valeur\s+Op[eé]ration\s+D[eé]bit\s+Cr[eé]dit',
    ]

    for i, line in enumerate(lines):
        processed_line_for_header = ' '.join(line.split()).strip()
        for pattern in header_patterns_strict:
            if re.search(pattern, processed_line_for_header, re.IGNORECASE):
                operations_start_line_idx = i
                logging.info(f"En-tête des opérations trouvé à la ligne {i}: {processed_line_for_header}")
                break
        if operations_start_line_idx != -1:
            break
    
    # Si aucun en-tête strict n'est trouvé, tenter de deviner le début des opérations
    if operations_start_line_idx == -1:
        logging.warning("Impossible de trouver un en-tête clair pour la section des opérations. Tentative de devinette.")
        for i, line in enumerate(lines):
            processed_line_for_header = ' '.join(line.split()).strip()
            # Chercher une ligne qui ressemble à une transaction (date + texte + montant)
            if re.search(r'\d{1,2}[/\-\.]\d{1,2}[/\-\.]\d{2,4}\s+.*?\s+[\d,\.\-]+', processed_line_for_header):
                operations_start_line_idx = i - 1 # Le début des opérations est probablement la ligne juste avant
                if operations_start_line_idx < 0: operations_start_line_idx = 0 
                logging.info(f"Ligne de début des opérations devinée basée sur la première ligne de type transaction: {operations_start_line_idx}")
                break
        if operations_start_line_idx == -1:
            logging.warning("Impossible même de deviner une ligne de départ pour les opérations. Retourne uniquement les métadonnées.")
            return metadata

    # Patterns de pied de page pour identifier la fin des opérations
    footer_patterns = [
        r'Total\s+des\s+op[eé]rations\s*:',
        r'TOTAL\s*(?:DES\s*)?(?:OP[EÉ]RATIONS|MOUVEMENTS)',
        r'SOLDE\s*(?:FINAL|NOUVEAU|ACTUEL)',
        r'Report\s+[aà]\s*nouveau',
        r'Signature',
        r'Votre\s*(?:banque|conseiller)',
        r'Page\s*\d+\s*sur\s*\d+',
        r'Pour\s*toute\s*r[eé]clamation',
        r'Date\s+d[eé]\s*d[eé]cembre', 
        r'Montant\s+des\s*commissions' 
    ]
    
    for i in range(operations_start_line_idx + 1, len(lines)):
        processed_line_for_footer = ' '.join(lines[i].split()).strip()
        for pattern in footer_patterns:
            if re.search(pattern, processed_line_for_footer, re.IGNORECASE):
                operations_end_line_idx = i
                logging.info(f"Pied de page des opérations trouvé à la ligne {i}: {processed_line_for_footer}")
                break
        if operations_end_line_idx != len(lines):
            break
            
    operations_lines = lines[operations_start_line_idx + 1 : operations_end_line_idx]
    logging.info(f"Traitement de {len(operations_lines)} lignes pour les opérations.")

    # --- 3. EXTRACTION DES SOLDES (Initial et Final) --- (laissez tel quel)
    solde_initial_patterns = [
        r'SOLDE\s*(?:PR[EÉ]C[EÉ]DENT|INITIAL|ANCIEN)\s*(?:AU\s*\d{1,2}[/\-\.]\d{1,2}[/\-\.]\d{2,4})?\s*:?\s*([\d\s,\.\-\(\)]+)',
        r'ANCIEN\s*SOLDE\s*:?\s*([\d\s,\.\-\(\)]+)',
        r'SOLDE\s*DEBUT\s*:?\s*([\d\s,\.\-\(\)]+)',
        r'SOLDE\s*AU\s*\d{1,2}[/\-\.]\d{1,2}[/\-\.]\d{2,4}\s*:?\s*([\d\s,\.\-\(\)]+)',
        r'REPORT\s*(?:SOLDE|NOUVEAU)\s*:?\s*([\d\s,\.\-\(\)]+)',
        r'SOLDE\s*REPORTE\s*:?\s*([\d\s,\.\-\(\)]+)',
        r'SOLDE\s*EN\s*DEBUT\s*(?:DE\s*PERIODE)?\s*:?\s*([\d\s,\.\-\(\)]+)',
        r'(?:^|\n)(?!.*(?:NOUVEAU|FINAL|ACTUEL)).*SOLDE.*?([\d\s,\.\-\(\)]+)\s*(?:DH|EUR|€)?', # capture any "SOLDE" not followed by "NOUVEAU|FINAL|ACTUEL"
    ]
    for pattern in solde_initial_patterns:
        solde_match = re.search(pattern, normalized_text_for_metadata, re.IGNORECASE)
        if solde_match:
            metadata['solde_initial'] = clean_amount(solde_match.group(1))
            break
    
    nouveau_solde_patterns = [
        r'Nouveau\s*solde\s*:\s*([\d\s,\.\-\(\)]+)\s*DH',
        r'(?:NOUVEAU\s*SOLDE|SOLDE\s*FINAL|SOLDE\s*ACTUEL)\s*:?\s*([\d\s,\.\-\(\)]+)',
        r'SOLDE\s*AU\s*\d{1,2}[/\-\.]\d{1,2}[/\-\.]\d{2,4}\s*:?\s*([\d\s,\.\-\(\)]+)',
        r'SOLDE\s*CREDITEUR\s*:?\s*([\d\s,\.\-\(\)]+)',
        r'SOLDE\s*DEBITEUR\s*:?\s*([\d\s,\.\-\(\)]+)',
        r'SOLDE.*?([\d\s,\.\-\(\)]+)\s*(?:DH|EUR|€)?(?:\s*CREDITEUR|\s*DEBITEUR)?(?:\s|$)'
    ]
    for pattern in nouveau_solde_patterns:
        solde_match = re.search(pattern, normalized_text_for_metadata, re.IGNORECASE | re.DOTALL)
        if solde_match:
            metadata['solde_final'] = clean_amount(solde_match.group(1))
            break

    # Extraction des totaux crédits/débits (laissez tel quel)
    total_credits_match = re.search(r'Total\s+cr[eé]dits\s*:\s*([\d\s,\.\-]+)\s*DH', normalized_text_for_metadata, re.IGNORECASE)
    if total_credits_match:
        metadata['total_credits'] = clean_amount(total_credits_match.group(1))

    total_debits_match = re.search(r'Total\s+d[eé]bits\s*:\s*([\d\s,\.\-]+)\s*DH', normalized_text_for_metadata, re.IGNORECASE)
    if total_debits_match:
        metadata['total_debits'] = clean_amount(total_debits_match.group(1))

    # --- 4. EXTRACTION DES OPÉRATIONS --- (laissez tel quel)

    # Pattern 1: Format de type CSV robuste pour les champs entre guillemets (souvent issu de PDF avec structure tabulaire)
    csv_op_pattern = re.compile(r'"(\d{1,2}[/\-\.]\d{1,2}[/\-\.]\d{2,4})","([^"]*)","([^"]*)",([\d\s,\.\-\(\)]*|),\s*"([\d\s,\.\-\(\)]*)","([\d\s,\.\-\(\)]*)"', re.IGNORECASE)

    # Pattern général pour les lignes d'opérations (plus flexible pour les OCR moins structurés)
    general_op_pattern = re.compile(
        r'(\d{1,2}[/\-\.]\d{1,2}[/\-\.]\d{2,4})\s+'     # Groupe 1: Date (ex: 02/04/2022)
        r'([\w\d-]*)\s+'                               # Groupe 2: Réf. Facture (optionnel, ex: FA2204001)
        # Groupe 3: Libellé - Utilise un lookahead pour s'assurer que le libellé ne consomme pas les montants
        r'(.+?)\s*(?=\s*[\-–]?\s*\d[\d\s]*[,\.]\d{2}|\s*[\-–]\s*[\d\s]*[,\.]\d{2}|\s*[\d\s]*[,\.]\d{2})(.+)$', 
        # Groupe 4: Reste de la ligne (montants et solde) - Capturé après le lookahead
        re.IGNORECASE
    )


    for line in operations_lines:
        processed_line_for_parsing = ' '.join(line.split()).strip()
        
        if not processed_line_for_parsing:
            continue
        
        # Tenter d'abord le pattern CSV
        csv_match = re.search(csv_op_pattern, processed_line_for_parsing) 

        if csv_match: 
            logging.debug(f"Motif CSV trouvé pour la ligne: {processed_line_for_parsing}")
            try:
                date_op = csv_match.group(1)
                ref_facture = csv_match.group(2).strip() if csv_match.group(2) else None
                libelle = csv_match.group(3).strip() if csv_match.group(3) else None
                debit_str = csv_match.group(4)
                credit_str = csv_match.group(5)
                solde_op_str = csv_match.group(6)

                date_parsed = parse_date(date_op)
                if not date_parsed: continue

                debit = clean_amount(debit_str)
                credit = clean_amount(credit_str)
                solde_op = clean_amount(solde_op_str)

                montant = 0.0
                if credit != 0: 
                    montant = credit
                    debit = 0.0 # Assurer que le débit est 0 si c'est un crédit
                elif debit != 0: 
                    montant = -debit
                    credit = 0.0 # Assurer que le crédit est 0 si c'est un débit
                
                # Ignorer les lignes sans montants significatifs
                if montant == 0 and debit == 0 and credit == 0 and solde_op == 0: continue

                operations.append({
                    "date": date_parsed.strftime("%d/%m/%Y"),
                    "ref_facture": ref_facture,
                    "libelle": libelle,
                    "debit": abs(debit), # Le champ 'debit' doit être positif
                    "credit": credit,
                    "montant": montant, # Montant avec signe (crédit positif, débit négatif)
                    "solde": solde_op
                })
            except Exception as e:
                logging.warning(f"Erreur d'analyse de la ligne d'opération CSV: '{processed_line_for_parsing}' - {e}")
            continue # Passer à la ligne suivante si le motif CSV a correspondu

        # Tenter le motif général si le CSV n'a pas correspondu
        match = re.search(general_op_pattern, processed_line_for_parsing)
        
        if match:
            logging.debug(f"Motif général trouvé pour la ligne: {processed_line_for_parsing}")
            try:
                date_op = match.group(1)
                ref_facture_maybe = match.group(2)
                libelle_raw = match.group(3) 
                amounts_solde_raw_str = match.group(4) 

                logging.debug(f"Libellé (du groupe 3): '{libelle_raw}'")
                logging.debug(f"Chaîne brute des montants/solde pour sous-analyse: '{amounts_solde_raw_str}'")

                debit_str_raw = ''
                credit_str_raw = ''
                solde_op_str = ''

                # Stratégie pour extraire les montants du segment restant
                amount_pattern_in_segment = re.compile(r'([\-–]?\s*\d[\d\s]*[,\.]\d{2})|([\-–])')
                
                extracted_parts = [
                    item.strip() for group in amount_pattern_in_segment.findall(amounts_solde_raw_str) 
                    for item in group if item # Filtrer les groupes vides
                ]
                
                logging.debug(f"Parties de montant extraites du segment: {extracted_parts}")

                # Assigner débit, crédit, solde en fonction du nombre de parties extraites
                if len(extracted_parts) == 3: # Cas idéal : Débit, Crédit, Solde
                    debit_str_raw = extracted_parts[0]
                    credit_str_raw = extracted_parts[1]
                    solde_op_str = extracted_parts[2]
                elif len(extracted_parts) == 2:
                    # Cas spécifique rencontré avec Banque.pdf: "– 3 090,00 3 090,00"
                    # où extracted_parts est ['– 3 090,00', '3 090,00']
                    # Le premier est le crédit (avec un éventuel tiret de débit OCR), le second est le solde.
                    if ('–' in extracted_parts[0] or '-' in extracted_parts[0]) and \
                        any(char.isdigit() for char in extracted_parts[0].replace('–', '').replace('-', '').strip()):
                        # Cela signifie que extracted_parts[0] contient un nombre précédé d'un signe de débit,
                        # ce qui est une anomalie OCR pour un crédit.
                        debit_str_raw = '' # Le débit réel est inexistant ou juste un tiret séparé
                        credit_str_raw = extracted_parts[0].replace('–', '').replace('-', '').strip() # Le crédit est le nombre
                        solde_op_str = extracted_parts[1] # Le deuxième est le solde
                    else: 
                        # Autre cas à 2 montants: Débit et Crédit (sans solde en fin de ligne)
                        # Ex: ['100,00', '200,00'] -> Débit 100, Crédit 200
                        debit_str_raw = extracted_parts[0]
                        credit_str_raw = extracted_parts[1]
                        solde_op_str = '' 
                elif len(extracted_parts) == 1:
                    # Un seul montant trouvé: déterminer s'il s'agit d'un débit ou d'un crédit
                    if '–' in extracted_parts[0] or '-' in extracted_parts[0]:
                        debit_str_raw = extracted_parts[0]
                    else:
                        credit_str_raw = extracted_parts[0]
                    solde_op_str = ''
                else:
                    logging.warning(f"Impossible de trouver des montants discernables dans le segment: '{amounts_solde_raw_str}'")
                    debit_str_raw = ''
                    credit_str_raw = ''
                    solde_op_str = ''

                date_parsed = parse_date(date_op)
                if not date_parsed: continue

                debit = clean_amount(debit_str_raw)
                credit = clean_amount(credit_str_raw)
                solde_op = clean_amount(solde_op_str) 

                logging.debug(f"Débit (brut): '{debit_str_raw}'")
                logging.debug(f"Crédit (brut): '{credit_str_raw}'")
                logging.debug(f"Solde (brut): '{solde_op_str}'")
                logging.debug(f"Débit (nettoyé): {debit}")
                logging.debug(f"Crédit (nettoyé): {credit}")
                logging.debug(f"Solde (nettoyé): {solde_op}")

                montant = 0.0
                if credit != 0: 
                    montant = credit
                    debit = 0.0 
                elif debit != 0: 
                    montant = -debit
                    credit = 0.0 
                
                if montant == 0 and debit == 0 and credit == 0 and solde_op == 0: 
                    logging.debug(f"Ignorer la ligne d'opération vide (tous zéros): {processed_line_for_parsing}")
                    continue

                libelle = libelle_raw.strip()
                ref_facture = None
                # Vérifier si la partie ref_facture_maybe est bien une référence de facture
                if ref_facture_maybe: 
                    if re.match(r'^[A-Z0-9]{3,}', ref_facture_maybe): # Si elle ressemble à une réf de facture
                        ref_facture = ref_facture_maybe
                    else: # Sinon, l'ajouter au libellé
                        libelle = f"{ref_facture_maybe} {libelle}".strip()

                operations.append({
                    "date": date_parsed.strftime("%d/%m/%Y"),
                    "ref_facture": ref_facture,
                    "libelle": libelle,
                    "debit": abs(debit), 
                    "credit": credit,
                    "montant": montant, 
                    "solde": solde_op
                })
            except Exception as e:
                logging.warning(f"Erreur d'analyse de la ligne d'opération générale: '{processed_line_for_parsing}' - {e}")
        else:
            logging.debug(f"Aucun motif d'opération trouvé pour la ligne: {processed_line_for_parsing}")

    # --- 5. CALCULS ET MÉTADONNÉES FINALES ---
    if operations:
        try:
            # Trier les opérations par date pour s'assurer de l'ordre chronologique
            operations.sort(key=lambda x: datetime.strptime(x['date'], "%d/%m/%Y"))
        except ValueError:
            logging.warning("Impossible de trier les opérations par date en raison d'une erreur d'analyse.")
            pass

    metadata['operations'] = operations
    metadata['nombre_operations'] = len(operations)
    
    # Si les totaux n'ont pas été trouvés directement, les calculer à partir des opérations
    if 'total_credits' not in metadata or metadata['total_credits'] == 0.0:
        metadata['total_credits'] = sum(op.get('credit', 0) for op in operations)
    if 'total_debits' not in metadata or metadata['total_debits'] == 0.0:
        metadata['total_debits'] = sum(op.get('debit', 0) for op in operations)
    
    # Calculer le solde final à partir du solde initial et des totaux
    if metadata.get('solde_initial') is not None and metadata.get('total_credits') is not None and metadata.get('total_debits') is not None:
        solde_calcule = round(metadata['solde_initial'] + metadata['total_credits'] - metadata['total_debits'], 2)
        metadata['solde_calcule'] = solde_calcule
        # Comparer avec le solde final extrait, si disponible
        if metadata.get('solde_final') is not None:
            metadata['difference_solde'] = round(abs(solde_calcule - metadata['solde_final']), 2)
    elif operations: 
        # Si le solde final n'est pas extrait mais qu'il y a des opérations avec un solde par ligne
        if 'solde_final' not in metadata and operations and operations[-1].get('solde') is not None:
            metadata['solde_final'] = operations[-1]['solde']
            logging.info(f"Solde final estimé d'après la dernière opération: {metadata['solde_final']}")

    logging.info(f"Extraction terminée: {len(operations)} opérations trouvées")
    
    # Logs de débogage pour les métadonnées extraites
    logging.info(f"DEBUG - Métadonnées extraites:")
    logging.info(f" - Banque: {metadata.get('banque', 'NON TROUVÉ')}")
    logging.info(f" - Numéro compte: {metadata.get('numero_compte', 'NON TROUVÉ')}")
    logging.info(f" - Titulaire: {metadata.get('titulaire', 'NON TROUVÉ')}")
    # Afficher les objets date analysés pour date_debut et date_fin
    logging.info(f" - Date Début (analysée): {metadata.get('date_debut', 'NON TROUVÉ')}")
    logging.info(f" - Date Fin (analysée): {metadata.get('date_fin', 'NON TROUVÉ')}")
    logging.info(f" - Période (chaîne brute): {metadata.get('periode', 'NON TROUVÉ')}")
    logging.info(f" - Solde initial: {metadata.get('solde_initial', 'NON TROUVÉ')}")
    logging.info(f" - Solde final: {metadata.get('solde_final', 'NON TROUVÉ')}")
    logging.info(f" - Solde calculé: {metadata.get('solde_calcule', 'NON CALCULÉ')}")
    logging.info(f" - Différence solde: {metadata.get('difference_solde', 'NON CALCULÉ')}")
    logging.info(f" - Total crédits: {metadata.get('total_credits', 'NON TROUVÉ')}")
    logging.info(f" - Total débits: {metadata.get('total_debits', 'NON TROUVÉ')}")
    logging.info(f" - Nombre opérations: {metadata.get('nombre_operations', 'NON TROUVÉ')}")
    logging.info(f" - Devise: {metadata.get('devise', 'NON TROUVÉ')}") # Ajout de la devise aux logs
    
    return metadata


def extract_invoice_data_with_ai(text):
    logger.info("Extraction des données de facture pour rapprochement bancaire")
    print(f"--- Début de l'extraction IA ---")
    print(f"Texte reçu par extract_invoice_data_with_ai:\n{text[:1000]}...")

    try:
        invoice_data = {
            "type": "facture", "numero": None, "date": None, "date_echeance": None,
            "emetteur": None, "client": None,
            "montant_total": None, "montant_ht": None, "montant_tva": None, "net_a_payer": None,
            "mode_reglement": None, "reference_paiement": None,
            "devise": "TND", "confiance_extraction": None, "lignes": []
        }
        
        # Helper function to clean and convert amount strings
        def clean_and_convert_amount(value_str):
            if not value_str:
                return None
            
            # Remove any characters that are not digits, comma, or dot
            cleaned_value = re.sub(r'[^\d,.]', '', value_str)
            
            if not cleaned_value:
                return None

            # Handle cases with both comma and dot (e.g., "1.234,56" or "1,234.56")
            if ',' in cleaned_value and '.' in cleaned_value:
                # If comma is the last separator, it's likely the decimal separator
                if cleaned_value.rfind(',') > cleaned_value.rfind('.'):
                    # Example: "1.234,56" -> remove thousands dot, replace decimal comma
                    cleaned_value = cleaned_value.replace('.', '').replace(',', '.')
                else:
                    # Example: "1,234.56" -> remove thousands comma
                    cleaned_value = cleaned_value.replace(',', '')
            else:
                # If only comma, assume it's the decimal separator
                # If only dot, assume it's the decimal separator (default float behavior)
                cleaned_value = cleaned_value.replace(',', '.') # Normalize to dot as decimal

            try:
                # Ensure no trailing dots or multiple dots after cleaning
                if cleaned_value.count('.') > 1:
                    # Keep only the last dot as decimal, remove others
                    parts = cleaned_value.split('.')
                    cleaned_value = "".join(parts[:-1]).replace('.', '') + '.' + parts[-1]
                
                return round(float(cleaned_value), 2)
            except ValueError:
                logger.warning(f"Failed to convert cleaned amount '{cleaned_value}' from original '{value_str}'")
                return None


        # NOTE: L'ordre des patterns est important ! Les plus spécifiques en premier.
        patterns = {
            "numero": [
                r"Réf\.\s*:\s*([A-Z0-9\-_\/\(\)]+)", # Added for "Réf.: (PROV161)" 
                r"FACTURE\s*:\s*([A-Z0-9\-_\/\s]+)", # Ex: FACTURE : 2204/026
                r"Facture\s*Réf\.?\s*:?\s*([A-Z0-9\-_/]+)",
                r"Facture\s*N°\s*:?\s*([A-Z0-9\-_\/\s]+)",
                r"N°\s*facture\s*:?\s*([A-Z0-9\-_\/\s]+)",
                r"Numéro\s*:?\s*([A-Z0-9\-_\/\s]+)",
                r"Réf\.?\s*facture\s*:?\s*([A-Z0-9\-_\/\s]+)",
                r"Invoice\s*#?\s*:?\s*([A-Z0-9\-_\/\s]+)"
            ],
            "date": [
                r"Date:\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})", # Added for "Date: 13/05/2022" 
                r"LE\s*:\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})", # Ex: LE : 22/04/2022
                r"Date\s*(?:de\s*)?facturation\s*:?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})",
                r"Date\s*(?:d')?émission\s*:?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})",
                r"Date\s*facture\s*:?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})",
                r"(?:le\s*)?(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})"
            ],
            "date_echeance": [
                r"Date\s*de\s*fin\s*de\s*validité:\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})", # Added for "Date de fin de validité: 28/05/2022" 
                r"Date\s*(?:d')?échéance\s*:?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})",
                r"Échéance\s*:?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})",
                r"Date\s*limite\s*(?:de\s*)?paiement\s*:?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})",
                r"Payable\s*avant\s*(?:le\s*)?(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})"
            ],
            "emetteur": [
                r"Émetteur\s*([A-Z0-9\s.-]+(?:SARL|SA|SAS|EURL)?)\s*ATELIER SIS A N 912 EL MASSAR", # Specifically for "3M ESPACE AUTO" 
                r"([A-Z][A-Za-z\s&]+(?:SARL|SA|SAS|EURL|Services?|Solutions?|Auto)?)\s*OP\s*AGADIR",
                r"([A-Z][A-Za-z\s&]+(?:SARL|SA|SAS|EURL|Services?|Solutions?)?)\s*(?:N° B52|Tél|Fax|E-mail|Patent|IF|RC|ICE)",
                r"Emetteur\s*Adressé\s*a\s*([A-Z0-9\s.-]+(?:SARL|SA|SAS|EURL|Services?|Solutions?)?)\s*\.",
                r"Émetteur\s*:?\s*([A-Z0-9\s.-]+)",
                r"Société\s*:?\s*([^\n]+)",
                r"Entreprise\s*:?\s*([^\n]+)",
                r"Raison\s*sociale\s*:?\s*([^\n]+)"
            ],
            "client": [
                r"Adressé\s*à\s*:\s*([A-Z\s]+)\nCM UNITE 5 N° \d+\s*MARRAKECH", # Specifically for "BOUKHALKHAL FATIMA" 
                r"Code\s*client\s*:?\s*([A-Z0-9\-]+)",
                r"Client\s*:?\s*([^\n]+)",
                r"Facturé\s*à\s*:?\s*([^\n]+)",
                r"À\s*l'attention\s*de\s*:?\s*([^\n]+)"
            ],
            # Use more general patterns for amounts, letting clean_and_convert_amount handle specifics
            "montant_total": [
                r"Total\s*TTC\s*[:\s]*([\d\s,.]+)", # More general for any separator combination
                r"Montant\s*total\s*[:\s]*([\d\s,.]+)",
                r"TOTAL\s*[:\s]*([\d\s,.]+)",
                r"Total\s*général\s*[:\s]*([\d\s,.]+)",
                r"Montant\s*TTC\s*[:\s]*([\d\s,.]+)",
                r"([\d\s,]+\.\d{2})\s*(?:DIRHAMS ET \d{2} CTS)", # Capture the amount part before "DIRHAMS ET XX CTS"
                r"Arrêté\s*le\s*présent\s*devis\s*à\s*la\s*somme\s*de\s*:\s*.*?([\d\s,]+\.\d{2})"
            ],
            "montant_ht": [
                r"Total\s*HT\s*[:\s]*([\d\s,.]+)", # More general
                r"Montant\s*HT\s*[:\s]*([\d\s,.]+)",
                r"Base\s*imposable\s*[:\s]*([\d\s,.]+)",
                r"Sous-total\s*HT\s*[:\s]*([\d\s,.]+)"
            ],
            "montant_tva": [
                r"Total\s*TVA\s*\d*%?\s*[:\s]*([\d\s,.]+)", # More general
                r"Montant\s*TVA\s*[:\s]*([\d\s,.]+)",
                r"TVA\s*[:\s]*([\d\s,.]+)"
            ],
            "net_a_payer": [
                r"Net\s*à\s*payer\s*[:\s]*([\d\s,.]+)",
                r"À\s*payer\s*[:\s]*([\d\s,.]+)",
                r"Montant\s*dû\s*[:\s]*([\d\s,.]+)",
                r"Solde\s*à\s*payer\s*[:\s]*([\d\s,.]+)",
                r"Arrêtée?\s*(?:le\s*présent\s*)?(?:devis\s*)?à\s*(?:la\s*somme\s*de\s*)?:?\s*.*?([\d\s,]+\.\d{2})" # Adjusted for quote phrasing 
            ],
            "mode_reglement": [
                r"Règlement\s*par\s*([^\n]+)", # Added for "Règlement par virement sur le comp" 
                r"(?:Mode|Conditions)\s*(?:de\s*)?règlement\s*:?\s*([^\n]+)",
                r"(?:Mode|Conditions)\s*(?:de\s*)?réglement\s*:?\s*([^\n]+)",
                r"Mode\s*(?:de\s*)?paiement\s*:?\s*([^\n]+)",
                r"Paiement\s*:?\s*([^\n]+)",
                r"Payable\s*par\s*:?\s*([^\n]+)"
            ],
            "reference_paiement": [
                r"Numéro\s*de\s*compte\s*:\s*([A-Z0-9\s]+)", # Added for "Numéro de compte: 145 450 21211 3533795 5 0004 04" 
                r"Banque:\s*([^\n]+?)\nNuméro\s*de\s*compte:\s*([A-Z0-9\s]+)", # To capture bank name and account number 
                r"Référence\s*(?:de\s*)?paiement\s*:?\s*([A-Z0-9\-_\/\s]+)",
                r"Réf\.?\s*règlement\s*:?\s*([A-Z0-9\-_\/\s]+)",
                r"Code\s*paiement\s*:?\s*([A-Z0-9\-_\/\s]+)"
            ],
            "devise": [
                r"(€|EUR|Euros?)", r"(Dt|TND|Dinars?|DIRHAMS?)", r"(\$|USD|Dollars?)", r"Devise\s*:?\s*([A-Z]{3})"
            ]
        }
        
        for field, pattern_list in patterns.items():
            if invoice_data[field] is not None:
                continue
            for pattern_str in pattern_list:
                try:
                    match = re.search(pattern_str, text, re.IGNORECASE | re.MULTILINE | re.DOTALL)
                    if match:
                        if field == "reference_paiement" and len(match.groups()) > 1: # Special handling for bank and account
                            invoice_data["mode_reglement"] = f"Virement bancaire ({match.group(1).strip()})"
                            invoice_data[field] = match.group(2).strip()
                        else:
                            value = match.group(1).strip() if match.lastindex and match.lastindex >= 1 else match.group(0).strip()
                            if field in ["montant_total", "montant_ht", "montant_tva", "net_a_payer"]:
                                invoice_data[field] = clean_and_convert_amount(value)
                            elif field in ["date", "date_echeance"]:
                                try:
                                    date_clean = re.sub(r'[^\d\/\-\.]', '', value)
                                    if len(date_clean) >= 8:
                                        invoice_data[field] = date_clean
                                except Exception:
                                    logger.warning(f"Format de date invalide pour {field}: {value}")
                                    continue
                            elif field == "devise":
                                if "DIRHAM" in value.upper() or "DT" in value.upper():
                                    invoice_data[field] = "MAD" # Moroccan Dirham
                                else:
                                    invoice_data[field] = value.upper()
                            else:
                                if len(value) > 0:
                                    invoice_data[field] = value.strip()
                        break
                except Exception as e:
                    logger.warning(f"Erreur application pattern pour {field} avec '{pattern_str}': {e}")
                    continue
        
        # --- Logique d'extraction des lignes d'articles ---
        # Refined pattern for table data 
        # It's better to capture the whole table structure if possible
        # Modified the pattern to be more flexible with quantity and total_ht (allowing spaces before/after comma/dot)
        line_item_rows = re.findall(
            r"(?P<designation>(?:BAGEUTTE PORTE|MAIN D'OEUVRE PEINTURE|MAIN D'OEUVRE MECANIQUE|MAIN D'OEUVRE CARROSSERIE|INGREDIENTS DE PEINTURE|PARE CHOC AV|CALANDRE|FIXATION PARE CHOC|MASQUE|RENFORT AV|RADIATEUR EAU R|OPTIQUE AVD|OPTIQUE AVG|MAIN D'OEUVRE CARROSSERIE ET PEINTURE|INGREDIENT DE PEINTURE))\s*(?P<tva>\d+%)?\s*(?P<pu_ht>[\d\s,.]+)\s*(?P<qte>\d+)\s*(?P<type>\w+)\s*(?P<total_ht>[\d\s,.]+)",
            text, re.IGNORECASE
        )
        
        for row in line_item_rows:
            try:
                description = row[0].strip()
                pu_ht = clean_and_convert_amount(row[2]) # Use the new helper
                quantity = int(row[3])
                total_ht_line = clean_and_convert_amount(row[5]) # Use the new helper

                if pu_ht is not None and total_ht_line is not None:
                    invoice_data["lignes"].append({
                        "quantite": quantity,
                        "description": description,
                        "prix_unitaire_ht": pu_ht,
                        "total_ht_ligne": total_ht_line
                    })
            except (ValueError, TypeError) as ve:
                logger.warning(f"Impossible de parser la ligne d'article '{row}': {ve}")
        
        # Fallback for line items if the specific regex fails, try a more general one
        if not invoice_data["lignes"]:
            # This is a general pattern that might work for less structured lines
            line_item_pattern_fallback = re.compile(
                r"^\s*(\d+|\*)\s*(?:REC|MO|ORG)?\s*(.+?)\s+([\d\s,.]+)$", # Changed to be more flexible with amount
                re.IGNORECASE | re.MULTILINE
            )
            # Find a section where line items typically are
            start_lines_marker = "Désignation"
            end_lines_marker = "Règlement par virement"
            
            start_idx = text.find(start_lines_marker)
            end_idx = text.find(end_lines_marker)

            if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
                lines_section = text[start_idx + len(start_lines_marker):end_idx]
                
                for line in lines_section.split('\n'):
                    line = line.strip()
                    if not line:
                        continue
                    
                    match = line_item_pattern_fallback.search(line)
                    if match:
                        try:
                            quantity_str = match.group(1).strip()
                            description = match.group(2).strip()
                            amount_str = match.group(3).strip()
                            
                            quantity = int(quantity_str) if quantity_str.isdigit() else 1 
                            
                            amount = clean_and_convert_amount(amount_str) # Use the new helper
                            
                            if amount is not None and len(description) > 3 and not any(kw in description.lower() for kw in ["total", "ht", "tva", "net a payer"]):
                                invoice_data["lignes"].append({
                                    "quantite": quantity,
                                    "description": description,
                                    "montant": amount
                                })
                        except (ValueError, TypeError) as ve:
                            logger.warning(f"Impossible de parse fallback line item '{line}': {ve}")
                        except IndexError:
                            logger.warning(f"Fallback line item pattern not fully matched: '{line}'")

        # --- Logique de déduction du montant total si non trouvé par pattern explicite ---
        # Prioritize explicit numeric extraction from the footer
        # Reorder these checks to be more robust
        
        # 1. Try to find Total TTC directly from the footer first
        if invoice_data["montant_total"] is None:
            total_ttc_table_match = re.search(r"Total TTC\s*[:\s]*([\d\s,.]+)", text, re.IGNORECASE)
            if total_ttc_table_match:
                invoice_data["montant_total"] = clean_and_convert_amount(total_ttc_table_match.group(1))
                if invoice_data["montant_total"] is not None:
                    logger.info(f"Montant total trouvé dans la table de totaux: {invoice_data['montant_total']}")

        # 2. Extract HT and TVA explicitly
        if invoice_data["montant_ht"] is None:
            total_ht_match = re.search(r"Total\s*HT\s*[:\s]*([\d\s,.]+)", text, re.IGNORECASE)
            if total_ht_match:
                invoice_data["montant_ht"] = clean_and_convert_amount(total_ht_match.group(1))

        if invoice_data["montant_tva"] is None:
            total_tva_match = re.search(r"Total\s*TVA\s*\d*%?\s*[:\s]*([\d\s,.]+)", text, re.IGNORECASE)
            if total_tva_match:
                invoice_data["montant_tva"] = clean_and_convert_amount(total_tva_match.group(1))


        # 3. If HT and TVA are found, calculate Total
        if invoice_data["montant_total"] is None and invoice_data["montant_ht"] is not None and invoice_data["montant_tva"] is not None:
            invoice_data["montant_total"] = round(invoice_data["montant_ht"] + invoice_data["montant_tva"], 2)
            logger.info(f"Montant total calculé à partir de HT + TVA: {invoice_data['montant_total']}")
        
        # 4. If total is still not found, try from sum of line items (less reliable for final total)
        if invoice_data["montant_total"] is None and invoice_data["lignes"]:
            calculated_total_from_lines = sum(item.get("total_ht_ligne", item.get("montant", 0)) for item in invoice_data["lignes"])
            if calculated_total_from_lines > 0:
                # Add a reasonable default VAT if not extracted to make this sum useful
                if invoice_data["montant_tva"] is None:
                    # Assuming a common VAT rate like 20% or 10% for fallback if not found
                    # This is a heuristic and might need adjustment based on typical invoices
                    invoice_data["montant_tva"] = round(calculated_total_from_lines * 0.20, 2) # Default 20% VAT
                invoice_data["montant_total"] = round(calculated_total_from_lines + invoice_data["montant_tva"], 2)
                logger.info(f"Montant total déduit de la somme des lignes (avec TVA estimée): {invoice_data['montant_total']}")

        # 5. Extract "net_a_payer" (can be a standalone field often identical to Total TTC)
        if invoice_data["net_a_payer"] is None:
            net_a_payer_match = re.search(r"Net\s*à\s*payer\s*[:\s]*([\d\s,.]+)", text, re.IGNORECASE)
            if net_a_payer_match:
                invoice_data["net_a_payer"] = clean_and_convert_amount(net_a_payer_match.group(1))
        
        # Ensure net_a_payer is defined if there is a total amount
        if invoice_data["net_a_payer"] is None and invoice_data["montant_total"] is not None:
            invoice_data["net_a_payer"] = invoice_data["montant_total"]

        # 6. Fallback if montant_total is not found, but HT and TVA are
        if invoice_data["montant_total"] is None and invoice_data["montant_ht"] is not None and invoice_data["montant_tva"] is not None:
            invoice_data["montant_total"] = round(invoice_data["montant_ht"] + invoice_data["montant_tva"], 2)
            logger.info(f"Montant total recalculé: {invoice_data['montant_total']} (HT + TVA)")

        # 7. Fallback if montant_ht is missing but total and tva are present
        if invoice_data["montant_ht"] is None and invoice_data["montant_total"] is not None and invoice_data["montant_tva"] is not None:
            invoice_data["montant_ht"] = round(invoice_data["montant_total"] - invoice_data["montant_tva"], 2)
            logger.info(f"Montant HT calculé: {invoice_data['montant_ht']} (Total - TVA)")
        
        # Validation of amounts
        if (invoice_data["montant_ht"] is not None and 
            invoice_data["montant_tva"] is not None and 
            invoice_data["montant_total"] is not None):
            calculated_total = round(invoice_data["montant_ht"] + invoice_data["montant_tva"], 2)
            if abs(calculated_total - invoice_data["montant_total"]) > 0.1: # Allow a small tolerance for floating point
                logger.warning(f"Incohérence montants: HT({invoice_data['montant_ht']}) + TVA({invoice_data['montant_tva']}) ≠ Total({invoice_data['montant_total']})")
                # If inconsistency, prefer calculated total if it's more likely correct based on HT/TVA
                # Or log and keep the directly extracted total, depending on business rules.
                # For now, we'll just log the warning.

    except Exception as e:
        logger.error(f"Erreur validation ou extraction dans extract_invoice_data_with_ai: {e}", exc_info=True)

    cleaned_data = {}
    for k, v in invoice_data.items():
        if k == "lignes" and v: # Ensure lines are included
            cleaned_data[k] = v
        elif v is not None and v != "" and (not isinstance(v, (int, float)) or v != 0):
            cleaned_data[k] = v
    
    critical_fields = ["numero", "date", "montant_total", "net_a_payer", "emetteur", "client"]
    critical_found = sum(1 for field in critical_fields if field in cleaned_data and cleaned_data[field] is not None)
    cleaned_data["confiance_extraction"] = round((critical_found / len(critical_fields)) * 100, 2)
    
    logger.info(f"Données critiques extraites: {[k for k in critical_fields if k in cleaned_data and cleaned_data[k] is not None]}")
    logger.info(f"Montant principal pour rapprochement: {cleaned_data.get('net_a_payer', cleaned_data.get('montant_total', 'Non trouvé'))}")
    logger.info(f"Confiance extraction: {cleaned_data.get('confiance_extraction', 0)}%")
    
    print(f"--- Données extraites par l'IA (avant retour) ---")
    print(f"Numero: {cleaned_data.get('numero')}")
    print(f"Date: {cleaned_data.get('date')}")
    print(f"Date échéance: {cleaned_data.get('date_echeance')}")
    print(f"Emetteur: {cleaned_data.get('emetteur')}")
    print(f"Client: {cleaned_data.get('client')}")
    print(f"Montant Total: {cleaned_data.get('montant_total')}")
    print(f"Net à Payer: {cleaned_data.get('net_a_payer')}")
    print(f"Nombre de lignes: {len(cleaned_data.get('lignes', []))}")
    if cleaned_data.get('lignes'):
        for i, line in enumerate(cleaned_data['lignes'][:3]): # Display the first 3 lines for verification
            print(f"    Ligne {i+1}: Qte={line.get('quantite')}, Desc='{line.get('description')}', PU_HT={line.get('prix_unitaire_ht')}, Total_HT_Ligne={line.get('total_ht_ligne')}") # Added PU_HT and Total_HT_Ligne
    print(f"--- Fin de l'extraction IA ---")
    
    return cleaned_data

# (Inclure process_document, detect_anomalies, match_invoice_with_statement, batch_reconciliation ici)
# process_document est crucial pour bien diriger vers extract_invoice_data_with_ai


def process_document(text):
    """
    Détecte le type de document et appelle la fonction d'extraction appropriée.
    Priorise la détection des relevés bancaires.
    """
    text_lower = text.lower()

    # 1. Tenter de détecter un relevé bancaire en premier
    if is_bank_statement(text):
        print("Type détecté : bank_statement")
        return extract_bank_statement_data(text)

    # 2. Sinon, tenter de détecter une facture (votre logique actuelle)
    # Vous pouvez ajouter une fonction is_invoice(text) similaire à is_bank_statement
    # pour les factures si vous voulez une détection plus stricte.
    # Pour l'instant, si ce n'est pas un relevé, on assume que c'est une facture pour le test.
    else:
        # Ici, vous pourriez avoir une fonction is_invoice(text) plus spécifique
        # ou un modèle ML pour la classification.
        # Pour cet exemple, on appelle simplement extract_invoice_data_with_ai
        # si ce n'est pas un relevé bancaire.
        print("Type détecté : invoice (par défaut ou par détection de facture)")
        return extract_invoice_data_with_ai(text)

# --- Votre code pour la détection des anomalies et le rapprochement (inchangé) ---
# ... (incluez detect_anomalies, match_invoice_with_statement, batch_reconciliation ici)


# --- Fonction detect_anomalies (Inchangée, car l'erreur n'est pas ici) ---
def detect_anomalies(document_data, doc_type):
    """Détecte les anomalies dans les données extraites."""
    anomalies = []
    now = datetime.now() # Utilise l'heure actuelle du serveur (Tunisie)
    logging.info(f"\nDEBUG_DETECT_ANOMALIES: Début de detect_anomalies pour {doc_type}. Heure actuelle 'now': {now!r}")

    if doc_type == "invoice":
        logging.info("DEBUG_DETECT_ANOMALIES: Traitement de la facture.")
        # Vérifications de présence des champs essentiels
        if not document_data.get("montant_total"):
            anomalies.append("Facture: Montant total manquant.")
        if not document_data.get("date"):
            anomalies.append("Facture: Date de facturation manquante.")
        if not document_data.get("numero"):
            anomalies.append("Facture: Numéro de facture manquant.")
        if not document_data.get("emetteur"):
            anomalies.append("Facture: Émetteur de la facture manquant.")
        if not document_data.get("client"):
            anomalies.append("Facture: Client destinataire manquant.")

        # Vérification de cohérence du montant total vs lignes
        if document_data.get("montant_total") is not None and document_data.get("lignes"):
            total_calcule = sum(ligne.get("montant", 0) for ligne in document_data["lignes"])
            if abs(document_data["montant_total"] - total_calcule) > 0.01: # Tolérance pour les erreurs de virgule flottante
                anomalies.append(f"Facture: Montant total incohérent: {document_data['montant_total']} vs somme des lignes {total_calcule}.")

        # Vérification des doublons dans les lignes (références ou numéros)
        if document_data.get("lignes"):
            refs = [ligne.get("reference") for ligne in document_data["lignes"] if ligne.get("reference")]
            nums = [ligne.get("numero") for ligne in document_data["lignes"] if ligne.get("numero")]

            refs_count = Counter(refs)
            for ref, count in refs_count.items():
                if count > 1:
                    anomalies.append(f"Facture: Référence produit en double: '{ref}' ({count} occurrences).")

            nums_count = Counter(nums)
            for num, count in nums_count.items():
                if count > 1:
                    anomalies.append(f"Facture: Numéro de ligne en double: '{num}' ({count} occurrences).")

        # Vérification des dates de facture (dans le futur, trop anciennes)
        # La date de facture est supposée être un objet datetime ou None ici.
        date_facture = document_data.get("date")
        if date_facture: # S'il y a une date et qu'elle a été parsée avec succès
            if isinstance(date_facture, datetime):
                if date_facture > now:
                    anomalies.append(f"Facture: Date dans le futur: {date_facture.strftime('%d/%m/%Y')}.")
                # Définir une limite raisonnable pour les dates très anciennes, par exemple 10 ans
                if date_facture < now - timedelta(days=365 * 10): 
                    anomalies.append(f"Facture: Date très ancienne: {date_facture.strftime('%d/%m/%Y')}.")
            else:
                anomalies.append(f"Facture: Date de facture a un type inattendu après parsage: '{date_facture}' (Type: {type(date_facture)}).")
        else:
            anomalies.append("Facture: Date de facturation manquante ou non parsable.")


    elif doc_type == "bank_statement":
        logging.info("DEBUG_DETECT_ANOMALIES: Traitement du relevé bancaire.")
        # Vérifications de présence des champs essentiels
        if document_data.get("solde_final") is None: # Peut être 0.0 donc vérifier None
            anomalies.append("Relevé Bancaire: Solde final manquant.")
        if not document_data.get("operations"):
            anomalies.append("Relevé Bancaire: Aucune opération trouvée.")
        if not document_data.get("banque"):
            anomalies.append("Relevé Bancaire: Nom de la banque manquant.")
        if not document_data.get("numero_compte"):
            anomalies.append("Relevé Bancaire: Numéro de compte manquant.")

        # Vérification de cohérence des soldes (initial + opérations = final)
        # S'assurer que solde_initial et solde_final sont bien des nombres
        solde_initial = document_data.get("solde_initial")
        solde_final = document_data.get("solde_final")
        operations = document_data.get("operations")

        if solde_initial is not None and solde_final is not None and operations is not None:
            total_operations_net = sum(op.get("montant", 0) for op in operations)
            solde_calcule = solde_initial + total_operations_net
            if abs(solde_final - solde_calcule) > 0.1: # Tolérance de 0.1 pour d'éventuels arrondis bancaires
                anomalies.append(f"Relevé Bancaire: Solde final ({solde_final}) incohérent avec le calcul (initial {solde_initial} + opérations {total_operations_net} = {solde_calcule}).")

        # Vérification des doublons d'opérations
        if operations:
            signatures = []
            for op in operations:
                # Créer une "signature" unique pour chaque opération
                if op.get("date") and op.get("montant") is not None and op.get("libelle"):
                    signature = f"{op['date']}_{op['montant']:.2f}_{op['libelle'].strip().lower()[:50]}" # Libellé tronqué pour éviter des signatures trop longues
                    signatures.append(signature)

            sig_count = Counter(signatures)
            for sig, count in sig_count.items():
                if count > 1:
                    anomalies.append(f"Relevé Bancaire: Possible opération en double: '{sig}' ({count} occurrences).")

        # Vérification des dates d'opérations (dans le futur, ordre chronologique, dans la période du relevé)
        if operations and len(operations) > 0:
            dates_operations_parsees_avec_strings_originales = []
            for i, op in enumerate(operations):
                if op.get("date"):
                    try:
                        # Assurez-vous que op["date"] est une chaîne et la parser en datetime
                        date_op_obj = parse_date(op["date"]) 
                        if date_op_obj:
                            dates_operations_parsees_avec_strings_originales.append((date_op_obj, op["date"]))
                        else:
                            anomalies.append(f"Relevé Bancaire: Date d'opération non parsable (résultat None): '{op['date']}'. Opération n°{i+1}.")
                    except Exception as e:
                        anomalies.append(f"Relevé Bancaire: Erreur lors du parsage de la date d'opération {i+1}: '{op['date']}' - Erreur: {e}.")
                else:
                    anomalies.append(f"Relevé Bancaire: Opération {i+1}: Date manquante.")
            
            if dates_operations_parsees_avec_strings_originales:
                # Vérifier les dates d'opérations futures
                future_dates = [date_str for date_obj, date_str in dates_operations_parsees_avec_strings_originales if date_obj and date_obj > now]
                if future_dates:
                    anomalies.append(f"Relevé Bancaire: Dates d'opérations dans le futur: {', '.join(future_dates[:3])}{'...' if len(future_dates) > 3 else ''}.")
                
                # Vérifier l'ordre chronologique des opérations
                # Tri des tuples (datetime_obj, original_string) par datetime_obj
                sorted_dates_tuples = sorted(dates_operations_parsees_avec_strings_originales, key=lambda x: x[0])
                # Comparer l'ordre original des datetimes (sans les strings originales) avec l'ordre trié
                original_order_dates_only = [item[0] for item in dates_operations_parsees_avec_strings_originales]
                sorted_order_dates_only = [item[0] for item in sorted_dates_tuples]

                if original_order_dates_only != sorted_order_dates_only:
                    anomalies.append("Relevé Bancaire: Opérations non triées par ordre chronologique.")

                # Vérification des opérations en dehors de la période du relevé
                # Ces champs (date_debut, date_fin) sont supposés être des objets datetime ou None
                date_debut_releve = document_data.get("date_debut") 
                date_fin_releve = document_data.get("date_fin")     

                if date_debut_releve and date_fin_releve and isinstance(date_debut_releve, datetime) and isinstance(date_fin_releve, datetime):
                    if date_fin_releve < date_debut_releve:
                        anomalies.append(f"Relevé Bancaire: Date de fin ({date_fin_releve.strftime('%Y-%m-%d')}) antérieure à la date de début ({date_debut_releve.strftime('%Y-%m-%d')}).")
                    
                    for date_op_obj, op_original_date_str in dates_operations_parsees_avec_strings_originales:
                        if date_op_obj and not (date_debut_releve <= date_op_obj <= date_fin_releve):
                            anomalies.append(f"Relevé Bancaire: Opération avec date '{op_original_date_str}' en dehors de la période du relevé ({date_debut_releve.strftime('%Y-%m-%d')} - {date_fin_releve.strftime('%Y-%m-%d')}).")
                else:
                    # Ajouter des anomalies si les dates de début/fin du relevé sont manquantes ou invalides
                    if not date_debut_releve or not isinstance(date_debut_releve, datetime):
                        anomalies.append("Relevé Bancaire: Date de début de relevé manquante ou invalide (non datetime).")
                    if not date_fin_releve or not isinstance(date_fin_releve, datetime):
                        anomalies.append("Relevé Bancaire: Date de fin de relevé manquante ou invalide (non datetime).")
                        
    logging.info(f"DEBUG_DETECT_ANOMALIES: Fin de detect_anomalies. Anomalies détectées: {len(anomalies)}")
    return anomalies

def match_invoice_with_statement(invoice_data, statement_data):
    """
    Rapprochement hiérarchique optimisé : Date -> Montant -> Client -> Numéro de facture
    """
    verification = {
        "paiement_trouve": False,
        "montant_correspond": False,
        "date_correspond": False,
        "client_correspond": False,
        "numero_correspond": False,
        "anomalies": [],
        "paiements_potentiels": [],
        "niveau_correspondance": None,  # Niveau de matching atteint
        "score_final": 0
    }
    
    print(f"🔍 Début du rapprochement hiérarchique facture/relevé")
    
    # Extraction des données de la facture
    invoice_amount = invoice_data.get("net_a_payer") or invoice_data.get("montant_total")
    invoice_date = invoice_data.get("date") # C'est ici que le fix doit faire effet
    invoice_num = invoice_data.get("numero")
    invoice_client = invoice_data.get("client", "").lower() if invoice_data.get("client") else ""
    invoice_emetteur = invoice_data.get("emetteur", "").lower() if invoice_data.get("emetteur") else ""
    
    print(f"📋 Facture: montant={invoice_amount}, date={invoice_date}")
    print(f"    Client: {invoice_client}, Numéro: {invoice_num}")
    
    if not invoice_amount:
        verification["anomalies"].append("Montant de facture manquant")
        return verification
    
    # Phase 1: Filtrage par DATE (tolérance ±90 jours)
    date_filtered_operations = []
    if invoice_date:
        inv_date = parse_date(invoice_date)
        if inv_date:
            for op in statement_data.get("operations", []):
                op_date_obj = parse_date(op.get("date", ""))
                if op_date_obj:
                    days_diff = abs((op_date_obj - inv_date).days)
                    if days_diff <= 90:  # Tolérance de 90 jours
                        op["_days_diff"] = days_diff
                        date_filtered_operations.append(op)
            
            print(f"📅 Phase 1 - Filtrage date: {len(date_filtered_operations)} opérations dans la plage")
        else:
            # Si pas de date de facture valide parsée, prendre toutes les opérations
            date_filtered_operations = statement_data.get("operations", [])
    else:
        # Si pas de date de facture, prendre toutes les opérations
        date_filtered_operations = statement_data.get("operations", [])
    
    if not date_filtered_operations:
        verification["anomalies"].append("Aucune opération dans la plage de dates")
        return verification
    
    # Phase 2: Filtrage par MONTANT (tolérance 2%)
    amount_filtered_operations = []
    print(f"DEBUG: Montant de la facture à rechercher: {invoice_amount}") # NOUVEL AFFICHAGE DE DÉBOGAGE
    for op in date_filtered_operations:
        op_amount = op.get("montant")
        
        # NOUVEAUX AFFICHAGES DE DÉBOGAGE POUR LA PHASE 2
        print(f"DEBUG: Vérification de l'opération: Date={op.get('date')}, Montant={op_amount}, Description={op.get('description')}")
        
        if op_amount is None:
            print("DEBUG: op_amount est None, on ignore l'opération.")
            continue
        if abs(op_amount) <= 0.01: # Si le montant de l'opération est négligeable
            print(f"DEBUG: op_amount ({op_amount}) est trop petit (<= 0.01), on ignore l'opération.")
            continue

        op_amount_abs = abs(float(op_amount)) # S'assurer que c'est un flottant pour la comparaison
        difference_pct = abs((op_amount_abs - invoice_amount) / invoice_amount * 100) if invoice_amount > 0 else 100
        
        print(f"DEBUG: Montant de l'opération (abs): {op_amount_abs}, Pourcentage de différence: {difference_pct:.2f}%")
        
        if difference_pct <= 2.0:
            op["_amount_diff_pct"] = difference_pct
            amount_filtered_operations.append(op)
        else:
            print(f"DEBUG: La différence de montant ({difference_pct:.2f}%) est > 2.0%, on ignore l'opération.")
    
    print(f"💰 Phase 2 - Filtrage montant: {len(amount_filtered_operations)} opérations avec montant correspondant")
    
    if not amount_filtered_operations:
        verification["anomalies"].append("Aucune opération avec montant correspondant")
        return verification
    
    # Phase 3: Si plusieurs opérations avec même date ET même montant -> Filtrage par CLIENT
    if len(amount_filtered_operations) > 1:
        # Vérifier s'il y a des doublons de date parmi les opérations filtrées
        dates_operations = {}
        for op in amount_filtered_operations:
            op_date = op.get("date")
            if op_date not in dates_operations:
                dates_operations[op_date] = []
            dates_operations[op_date].append(op)
        
        # Rechercher les dates avec plusieurs opérations
        duplicate_dates = {date: ops for date, ops in dates_operations.items() if len(ops) > 1}
        
        if duplicate_dates:
            print(f"⚠️  Phase 3a - Doublons détectés: {len(duplicate_dates)} dates avec plusieurs opérations")
            client_filtered_operations = []
            
            # Pour chaque groupe d'opérations avec la même date
            for date, ops in duplicate_dates.items():
                best_client_match = None
                best_client_score = 0
                
                for op in ops:
                    op_desc = op.get("description", "").lower()
                    client_score = 0
                    
                    # Recherche du client dans la description
                    if invoice_client and op_desc:
                        if invoice_client in op_desc:
                            client_score += 30
                        # Recherche de mots-clés du client
                        client_words = invoice_client.split()
                        for word in client_words:
                            if len(word) > 3 and word in op_desc:
                                client_score += 10
                    
                    # Recherche de l'émetteur aussi
                    if invoice_emetteur and op_desc:
                        if invoice_emetteur in op_desc:
                            client_score += 20
                    
                    if client_score > best_client_score:
                        best_client_score = client_score
                        best_client_match = op
                
                if best_client_match:
                    best_client_match["_client_score"] = best_client_score
                    client_filtered_operations.append(best_client_match)
                else:
                    # Si aucun match client trouvé, prendre la première opération
                    ops[0]["_client_score"] = 0
                    client_filtered_operations.append(ops[0])
            
            # Ajouter les opérations qui n'avaient pas de doublons de date
            for date, ops in dates_operations.items():
                if len(ops) == 1:
                    ops[0]["_client_score"] = 0
                    client_filtered_operations.append(ops[0])
            
            amount_filtered_operations = client_filtered_operations
            print(f"👤 Phase 3b - Filtrage client: {len(client_filtered_operations)} opérations après résolution des doublons")
    
    # Phase 4: Si encore plusieurs opérations -> Filtrage par NUMÉRO DE FACTURE
    if len(amount_filtered_operations) > 1 and invoice_num:
        print(f"🔢 Phase 4 - Filtrage par numéro de facture")
        numero_filtered_operations = []
        
        for op in amount_filtered_operations:
            op_desc = op.get("description", "").lower()
            numero_score = 0
            
            if op_desc:
                # Recherche exacte du numéro
                if invoice_num.lower() in op_desc:
                    numero_score += 50
                
                # Recherche des chiffres du numéro
                digits_only = re.sub(r'\D', '', invoice_num)
                if digits_only and len(digits_only) >= 3:
                    if digits_only in re.sub(r'\D', '', op_desc):
                        numero_score += 30
            
            if numero_score > 0:
                op["_numero_score"] = numero_score
                numero_filtered_operations.append(op)
        
        if numero_filtered_operations:
            amount_filtered_operations = numero_filtered_operations
            print(f"✅ Filtrage numéro: {len(numero_filtered_operations)} opérations avec référence facture")
    
    # Phase 5: Sélection de la meilleure correspondance
    if amount_filtered_operations:
        # Calcul du score final pour chaque opération
        for op in amount_filtered_operations:
            score = 0
            
            # Score de base pour le montant (40 points)
            score += 40 - (op.get("_amount_diff_pct", 0) * 2)  # Moins l'écart est grand, plus le score est élevé
            
            # Score pour la proximité de date (30 points max)
            if "_days_diff" in op:
                days_diff = op["_days_diff"]
                score += max(0, 30 - days_diff)  # Plus c'est proche, plus le score est élevé
            
            # Score client (20 points max)
            score += op.get("_client_score", 0)
            
            # Score numéro (30 points max)
            score += op.get("_numero_score", 0)
            
            op["_final_score"] = score
        
        # Tri par score décroisant
        amount_filtered_operations.sort(key=lambda x: x.get("_final_score", 0), reverse=True)
        best_match = amount_filtered_operations[0]
        
        # Mise à jour des résultats
        verification["paiement_trouve"] = True
        verification["montant_correspond"] = True
        verification["date_correspond"] = "_days_diff" in best_match
        verification["client_correspond"] = best_match.get("_client_score", 0) > 0
        verification["numero_correspond"] = best_match.get("_numero_score", 0) > 0
        verification["score_final"] = best_match.get("_final_score", 0)
        
        # Détermination du niveau de correspondance
        if verification["numero_correspond"]:
            verification["niveau_correspondance"] = "EXACT"
        elif verification["client_correspond"]:
            verification["niveau_correspondance"] = "TRES_PROBABLE"
        elif verification["date_correspond"]:
            verification["niveau_correspondance"] = "PROBABLE"
        else:
            verification["niveau_correspondance"] = "POSSIBLE"
        
        # Stockage des paiements potentiels
        verification["paiements_potentiels"] = [
            {
                "montant": op.get("montant"),
                "date": op.get("date"),
                "description": op.get("description"),
                "score": op.get("_final_score", 0),
                "jours_ecart": op.get("_days_diff", None),
                "ecart_montant_pct": op.get("_amount_diff_pct", None)
            } for op in amount_filtered_operations[:3]
        ]
        
        # Gestion des alertes
        if len(amount_filtered_operations) > 1:
            verification["anomalies"].append(f"Plusieurs paiements potentiels ({len(amount_filtered_operations)})")
        
        if best_match.get("_amount_diff_pct", 0) > 0.1:
            verification["anomalies"].append(f"Écart de montant: {best_match['_amount_diff_pct']:.2f}%")
        
        if best_match.get("_days_diff", 0) > 30:
            verification["anomalies"].append(f"Paiement tardif: +{best_match['_days_diff']} jours")
        
        print(f"✅ Meilleure correspondance trouvée - Niveau: {verification['niveau_correspondance']}, Score: {verification['score_final']}")
    
    else:
        verification["anomalies"].append("Aucun paiement correspondant après filtrage")
    
    return verification

# Fin de la fonction match_invoice_with_statement


def batch_reconciliation(invoices_data, statement_data):
    """
    Rapprochement en lot avec gestion des conflits
    """
    results = {
        "matches": [],
        "conflicts": [],
        "unmatched_invoices": [],
        "unmatched_operations": [],
        "stats": {
            "total_invoices": len(invoices_data),
            "matched": 0,
            "exact_matches": 0,
            "probable_matches": 0,
            "conflicts": 0
        }
    }
    
    used_operations = set()  # Pour éviter qu'une opération soit utilisée plusieurs fois
    
    print(f"🚀 Début du rapprochement en lot: {len(invoices_data)} factures")
    
    for invoice in invoices_data:
        print(f"\n--- Traitement facture {invoice.get('numero', 'N/A')} ---")
        
        # Rapprochement de cette facture
        match_result = match_invoice_with_statement(invoice, statement_data)
        
        if match_result["paiement_trouve"]:
            # Vérifier si l'opération n'est pas déjà utilisée
            best_operation = match_result["paiements_potentiels"][0] if match_result["paiements_potentiels"] else None
            
            if best_operation:
                # Créer une signature unique pour l'opération
                # Assurez-vous que la date est toujours une chaîne ou un type hachable pour la signature
                op_date_str = str(best_operation['date']) if isinstance(best_operation['date'], datetime) else best_operation['date']
                op_signature = f"{op_date_str}_{best_operation['montant']}_{best_operation['description'][:20]}"
                
                if op_signature in used_operations:
                    # Conflit détecté
                    results["conflicts"].append({
                        "invoice": invoice,
                        "operation": best_operation,
                        "reason": "Opération déjà utilisée par une autre facture"
                    })
                    results["stats"]["conflicts"] += 1
                else:
                    # Match valide
                    used_operations.add(op_signature)
                    results["matches"].append({
                        "invoice": invoice,
                        "operation": best_operation,
                        "verification": match_result,
                        "niveau": match_result["niveau_correspondance"]
                    })
                    results["stats"]["matched"] += 1
                    
                    # Comptage par niveau
                    if match_result["niveau_correspondance"] == "EXACT":
                        results["stats"]["exact_matches"] += 1
                    elif match_result["niveau_correspondance"] in ["TRES_PROBABLE", "PROBABLE"]:
                        results["stats"]["probable_matches"] += 1
        else:
            results["unmatched_invoices"].append(invoice)
    
    # Identification des opérations non rapprochées
    all_operations = statement_data.get("operations", [])
    for op in all_operations:
        # Assurez-vous que la date est toujours une chaîne ou un type hachable pour la signature
        op_date_str = str(op.get('date')) if isinstance(op.get('date'), datetime) else op.get('date')
        op_signature = f"{op_date_str}_{op.get('montant')}_{op.get('description', '')[:20]}"
        if op_signature not in used_operations:
            results["unmatched_operations"].append(op)
    
    print(f"\n📊 Résultats du rapprochement:")
    print(f"    Factures rapprochées: {results['stats']['matched']}/{results['stats']['total_invoices']}")
    print(f"    Matches exacts: {results['stats']['exact_matches']}")
    print(f"    Matches probables: {results['stats']['probable_matches']}")
    print(f"    Conflits: {results['stats']['conflicts']}")
    print(f"    Opérations non rapprochées: {len(results['unmatched_operations'])}")
    
    return results


def convert_datetime_to_isoformat(obj):
    """
    Recursively converts datetime and date objects within a dictionary or list
    to their ISO 8601 string representation.
    """
    if isinstance(obj, dict):
        return {k: convert_datetime_to_isoformat(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_datetime_to_isoformat(elem) for elem in obj]
    elif isinstance(obj, (datetime, date)):
        return obj.isoformat()
    return obj

def generate_reconciliation_report(invoice_data, statement_data, verification_result, analysis, invoice_anomalies, statement_anomalies):
    """Génère un rapport de réconciliation détaillé."""
    report = {
        "facture": {
            "numero": invoice_data.get("numero"),
            "montant_total": invoice_data.get("montant_total"),
            "date": str(invoice_data.get("date")), # Convertir en string pour le rapport JSON
            "client": invoice_data.get("client"),
            "emetteur": invoice_data.get("emetteur"),
            "anomalies": invoice_anomalies
        },
        "releve_bancaire": {
            "operations_count": len(statement_data.get("operations", [])),
            "solde_final": statement_data.get("solde_final"),
            "anomalies": statement_anomalies
        },
        "resultats_rapprochement": verification_result,
        "analyse_ia": analysis,
        "date_generation": datetime.now().isoformat()
    }
    return report

# Fonction factice pour l'analyse AI (à remplacer par votre vraie logique AI)
def analyze_with_ai(invoice_text, statement_text, invoice_data, statement_data, verification_result):
    """Simule une analyse par IA."""
    return "Analyse IA : Aucune information supplémentaire significative trouvée (simulée)."

# Fonction factice pour les recommandations (à remplacer par votre vraie logique)
def generate_recommendations(verification_result):
    """Génère des recommandations basées sur le résultat de la vérification."""
    recs = []
    if not verification_result.get("paiement_trouve"):
        recs.append("Vérifiez manuellement le relevé bancaire pour un paiement correspondant à la facture.")
        recs.append("Assurez-vous que le montant et la date de la facture sont corrects.")
    if verification_result.get("anomalies"):
        recs.append("Examinez les anomalies détectées pour la facture et/ou le relevé.")
    if verification_result.get("score_final", 0) < 50 and verification_result.get("paiement_trouve"):
        recs.append("Le niveau de correspondance est faible, une vérification manuelle est recommandée.")
    return recs



@lru_cache(maxsize=32)
def extract_text_cached(filepath):
    return extract_text_from_pdf(filepath)
# Routes API
@app.route('/api/extract-document', methods=['POST'])
def extract_document():
    if 'file' not in request.files:
        return jsonify({"error": "Aucun fichier fourni"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "Nom de fichier vide"}), 400

    if not file.filename.lower().endswith('.pdf'):
        return jsonify({"error": "Seuls les fichiers PDF sont acceptés"}), 400

    filename = f"{uuid.uuid4()}_{secure_filename(file.filename)}"
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(filepath)

    try:
        text = extract_text_from_pdf(filepath)
        print("=== DÉBUT DIAGNOSTIC ===")
        print("Texte brut extrait:", text[:500] + "...")

        if len(text.strip()) < 20:
            return jsonify({
                "error": "Document vide ou non lisible",
                "debug": f"Texte extrait: {text[:200]}"
            }), 400

        # === DÉTECTION AMÉLIORÉE ===
        print("=== DÉBUT DÉTECTION TYPE ===")
        print(f"Longueur du texte: {len(text)} caractères")
        
        # Test 1: Relevé bancaire avec debugging
        is_bank = is_bank_statement(text)
        print(f"Test relevé bancaire: {is_bank}")
        
        # Test 2: Facture avec debugging  
        is_invoice_doc = is_invoice_document(text)
        print(f"Test facture: {is_invoice_doc}")
        
        if is_bank:
            doc_type = "bank_statement"
            print("✅ Type détecté : bank_statement")
            data = extract_bank_statement_data(text)
            print("Extraction data terminée")
            anomalies = detect_anomalies(data, "bank_statement")
            print("Détection anomalies terminée")
            
        elif is_invoice_doc:
            doc_type = "invoice"
            print("✅ Type détecté : invoice")
            data = extract_invoice_data_with_ai(text)
            print("Extraction data terminée")
            anomalies = detect_anomalies(data, "invoice")
            print("Détection anomalies terminée")
            
        else:
            # Type inconnu - traiter comme document générique
            doc_type = "unknown"
            print("⚠️ Type détecté : unknown")
            data = {
                "type": "unknown",
                "error": "Type de document non reconnu",
                "suggestions": []
            }
            
            # Essayer de deviner le type avec des indices
            text_lower = text.lower()
            if any(word in text_lower for word in ["facture", "devis", "invoice"]):
                data["suggestions"].append("Pourrait être une facture")
            if any(word in text_lower for word in ["contrat", "accord", "convention"]):
                data["suggestions"].append("Pourrait être un contrat")
            if any(word in text_lower for word in ["compte", "banque", "solde"]):
                data["suggestions"].append("Pourrait être un relevé bancaire")
                
            anomalies = []

        return jsonify({
            "success": True,
            "type": doc_type,
            "data": data,
            "anomalies": anomalies,
            "text_preview": text[:500],
            "debug": {
                "text_length": len(text),
                "is_bank_detected": is_bank,
                "is_invoice_detected": is_invoice_doc if 'is_invoice_doc' in locals() else False
            }
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Erreur lors du traitement: {str(e)}"}), 500

    finally:
        if os.path.exists(filepath):
            os.remove(filepath)

# === FONCTION HELPER POUR DÉTECTER LES FACTURES ===
def is_invoice_document(text):
    """
    Détecte si c'est une facture (différent de is_invoice pour éviter les conflits)
    """
    text_lower = text.lower()
    
    print(f"[DEBUG] Vérification facture sur: {text_lower[:100]}...")
    
    # Si c'est clairement un relevé bancaire, ce n'est pas une facture
    bank_strong_indicators = [
        "releve de compte", "relevé de compte", "extrait de compte",
        "compte cheques", "compte chèques", "extrait n°"
    ]
    
    for indicator in bank_strong_indicators:
        if indicator in text_lower:
            print(f"[DEBUG] Indicateur bancaire trouvé: '{indicator}' -> PAS UNE FACTURE")
            return False
    
    # Indicateurs de facture
    invoice_indicators = [
        "facture n°", "facture numero", "facture du",
        "devis n°", "bon de commande", "avoir n°",
        "montant ht", "montant ttc", "taux tva", 
        "total ht", "total ttc", "net à payer",
        "échéance", "date d'échéance"
    ]
    
    invoice_count = sum(1 for indicator in invoice_indicators if indicator in text_lower)
    
    # Mots-clés généraux de facture
    general_invoice_words = ["facture", "devis", "avoir", "tva", "ht", "ttc"]
    general_count = sum(1 for word in general_invoice_words if word in text_lower)
    
    print(f"[DEBUG] Indicateurs facture spécifiques: {invoice_count}")
    print(f"[DEBUG] Mots-clés facture généraux: {general_count}")
    
    # Au moins 2 indicateurs spécifiques OU 3 mots-clés généraux
    is_invoice = invoice_count >= 2 or general_count >= 3
    
    print(f"[DEBUG] Résultat détection facture: {is_invoice}")
    return is_invoice

@app.route('/api/compare-documents', methods=['POST'])
def compare_documents():
    """Compare une facture et un relevé bancaire via leurs IDs stockés."""
    print("\n----- DÉBUT COMPARE DOCUMENTS (par IDs) -----")
    print("Headers reçus:", request.headers)
    print("Méthode:", request.method)
    print("Données du formulaire:", request.form)

    facture_id = request.form.get('facture_id')
    banque_id = request.form.get('banque_id')

    if not facture_id:
        print("ERREUR: 'facture_id' manquant dans les données du formulaire")
        return jsonify({"error": "ID de facture requis"}), 400
    if not banque_id:
        print("ERREUR: 'banque_id' manquant dans les données du formulaire")
        return jsonify({"error": "ID de relevé bancaire requis"}), 400

    print(f"IDs reçus: Facture ID='{facture_id}', Banque ID='{banque_id}'")

    try:
        # Récupération des objets Facture et Banque depuis la base de données
        facture_obj = Facture.objects(id=facture_id).first()
        banque_obj = Banque.objects(id=banque_id).first()

        if not facture_obj:
            print(f"ERREUR: Facture avec ID {facture_id} non trouvée.")
            return jsonify({"error": f"Facture non trouvée pour l'ID: {facture_id}"}), 404
        if not banque_obj:
            print(f"ERREUR: Relevé bancaire avec ID {banque_id} non trouvé.")
            return jsonify({"error": f"Relevé bancaire non trouvé pour l'ID: {banque_id}"}), 404

        # --- Construction de invoice_data_for_matching ---
        # La date de facture est déjà correctement parsée ici.
        invoice_data_for_matching = {
            "numero": facture_obj.numero,
            "montant_total": facture_obj.montant_total,
            "montant_ht": facture_obj.montant_ht,
            "montant_tva": facture_obj.montant_tva,
            "net_a_payer": facture_obj.net_a_payer,
            "date": parse_date(facture_obj.date_emission),
            "client": facture_obj.client,
            "emetteur": facture_obj.emetteur,
            "devise": facture_obj.devise,
            "extracted_data_raw": facture_obj.extracted_data
        }

        # --- Traitement CRITIQUE pour statement_data_for_matching ---
        # On copie les données extraites pour les manipuler.
        # Note: banque_obj.extracted_data pourrait être un dictionnaire ou une chaîne JSON
        # Si c'est une chaîne JSON, il faut la désérialiser en dictionnaire ici.
        # Pour cet exemple, on suppose que c'est déjà un dictionnaire.
        statement_data_for_matching = banque_obj.extracted_data.copy()

        # Extraire les dates de début et de fin de la chaîne 'periode' du modèle Banque
        period_string = banque_obj.periode 
        date_debut_from_period, date_fin_from_period = parse_periode_to_dates(period_string)
        
        # Assigner les dates parsées (qui peuvent être None si le parsing a échoué)
        # Ces clés 'date_debut' et 'date_fin' sont attendues par detect_anomalies.
        statement_data_for_matching["date_debut"] = date_debut_from_period
        statement_data_for_matching["date_fin"] = date_fin_from_period
        
        if date_debut_from_period is None or date_fin_from_period is None:
            print(f"AVERTISSEMENT: Impossible de parser les dates de début/fin depuis la période '{period_string}'. Les dates seront considérées comme manquantes pour la détection d'anomalies du relevé bancaire.")

        # Vérifier et convertir les dates de chaque opération si elles ne sont pas déjà au bon format
        # Ceci est essentiel car les dates d'opération peuvent aussi être des chaînes.
        if "operations" in statement_data_for_matching and isinstance(statement_data_for_matching["operations"], list):
            for op in statement_data_for_matching["operations"]:
                if isinstance(op, dict) and "date" in op and not isinstance(op["date"], datetime):
                    op["date"] = parse_date(op["date"])
        else:
            print("AVERTISSEMENT: 'operations' manquant ou n'est pas une liste dans statement_data_for_matching.")

        # --- Vérifications avant le rapprochement ---
        if not statement_data_for_matching or not statement_data_for_matching.get('operations'):
            print(f"ERREUR: Aucune opération trouvée dans les données du relevé avec l'ID {banque_id}.")
            return jsonify({"error": "Les données du relevé bancaire sont incomplètes (pas d'opérations)."}), 400
        
        if not invoice_data_for_matching.get('montant_total') and not invoice_data_for_matching.get('net_a_payer'):
            print(f"ERREUR: Données de facture incomplètes (montant manquant) pour l'ID {facture_id}.")
            return jsonify({"error": "Les données de la facture sont incomplètes (montant manquant)."}), 400

        print(f"DEBUG: invoice_data_for_matching sent to matching function: {invoice_data_for_matching}")

        # Les appels aux fonctions restent les mêmes, mais les données sont maintenant préparées
        print("Début détection anomalies facture...")
        invoice_anomalies = detect_anomalies(invoice_data_for_matching, "invoice")
        print("Fin détection anomalies facture.")

        print("Début détection anomalies relevé...")
        # À ce stade, statement_data_for_matching devrait avoir 'date_debut' et 'date_fin' au format datetime.
        statement_anomalies = detect_anomalies(statement_data_for_matching, "bank_statement")
        print("Fin détection anomalies relevé.")

        print("Début rapprochement...")
        verification_result = match_invoice_with_statement(invoice_data_for_matching, statement_data_for_matching)
        print("Fin rapprochement.")

        print("Début analyse AI...")
        invoice_text_stored = facture_obj.full_text if hasattr(facture_obj, 'full_text') else ""
        statement_text_stored = banque_obj.full_text if hasattr(banque_obj, 'full_text') else ""
        analysis = analyze_with_ai(invoice_text_stored, statement_text_stored, invoice_data_for_matching, statement_data_for_matching, verification_result)
        print("Fin analyse AI.")

        print("Génération du rapport de réconciliation...")
        full_report = generate_reconciliation_report(
            invoice_data_for_matching,
            statement_data_for_matching,
            verification_result,
            analysis,
            invoice_anomalies,
            statement_anomalies
        )
        print("Rapport généré.")

        # Détermination du statut
        statut_rapport = "complet" if verification_result.get("paiement_trouve", False) else "incomplet"
        # Le rapport est en "anomalie" si des anomalies sont détectées à n'importe quelle étape.
        if (verification_result.get("anomalies") and len(verification_result["anomalies"]) > 0) or \
           invoice_anomalies or statement_anomalies:
            statut_rapport = "anomalie"

        # Création et sauvegarde du rapport
        print("Sauvegarde du rapport dans la base de données...")
        rapport = Rapport(
            facture=facture_obj,
            banque=banque_obj,
            titre=f"Rapprochement {facture_obj.numero if facture_obj else 'N/A'} - {banque_obj.nom if banque_obj else 'N/A'}",
            statut=statut_rapport,
            
            invoice_data=invoice_data_for_matching,
            statement_data=statement_data_for_matching,
            verification_result=verification_result,
            
            resume_facture={
                "emetteur": invoice_data_for_matching.get("emetteur"),
                "numero": invoice_data_for_matching.get("numero"),
                "date": invoice_data_for_matching.get("date"),
                "montant_total": invoice_data_for_matching.get("montant_total"),
                "devise": invoice_data_for_matching.get("devise", "TND")
            },
            resume_releve={
                "banque": statement_data_for_matching.get("banque"),
                "compte": statement_data_for_matching.get("numero_compte"),
                # Afficher la période sous forme JJ/MM/AAAA - JJ/MM/AAAA si les dates sont valides, sinon la chaîne brute.
                "periode": f"{statement_data_for_matching['date_debut'].strftime('%d/%m/%Y')} - {statement_data_for_matching['date_fin'].strftime('%d/%m/%Y')}" 
                           if statement_data_for_matching.get("date_debut") and statement_data_for_matching.get("date_fin") 
                           else (banque_obj.periode if banque_obj and banque_obj.periode else None), # Fallback à l'original ou None
                "solde_final": statement_data_for_matching.get("solde_final"),
                "devise": statement_data_for_matching.get("devise", "TND")
            },
            
            resultat_verification={
                "paiement_trouve": verification_result.get("paiement_trouve", False),
                "niveau_correspondance": verification_result.get("niveau_correspondance"),
                "montant_correspond": verification_result.get("montant_correspond", False),
                "date_correspond": verification_result.get("date_correspond", False),
                "operation_correspondante": verification_result.get("paiements_potentiels", [{}])[0] if verification_result.get("paiements_potentiels") else None
            },
            
            anomalies=invoice_anomalies + statement_anomalies + verification_result.get("anomalies", []),
            recommendations=generate_recommendations(verification_result),
            
            analyse_texte=analysis,
            rapport_complet=full_report,
            
            date_creation=datetime.now(),
            derniere_maj=datetime.now()
        )
        rapport.save()
        print(f"Rapport ID {rapport.id} sauvegardé avec succès.")

        response_data = {
            "status": "success",
            "rapport_id": str(rapport.id),
            "statut": statut_rapport,
            "paiement_trouve": verification_result.get("paiement_trouve", False),
            "anomalies_count": len(rapport.anomalies),
            "resume": {
                "facture": rapport.resume_facture,
                "releve": rapport.resume_releve
            }
        }
        print("----- FIN COMPARE DOCUMENTS SUCCÈS -----")
        return jsonify(response_data)

    except Exception as e:
        print(f"ERREUR GÉNÉRALE DANS COMPARE DOCUMENTS: {str(e)}")
        import traceback
        traceback.print_exc() # Cela affichera la pile d'appels pour le débogage
        return jsonify({"error": f"Erreur lors du traitement des documents: {str(e)}"}), 500

# Fonction generate_reconciliation_report (si elle n'est pas déjà définie)

@app.route('/api/fichiers-importes', methods=['GET'])
def get_imported_files():
    file_type = request.args.get('type')
    if file_type not in ['invoice', 'statement']:
        return jsonify({"error": "Le paramètre 'type' doit être 'invoice' ou 'statement'"}), 400

    imported_files = ImportedFile.objects(file_type=file_type).all()
    files_list = []
    for file in imported_files:
        files_list.append({
            'id': str(file.id),
            'nom_fichier': file.filename,
            'date_upload': file.upload_date.isoformat()
            # Ajoutez d'autres informations que vous souhaitez afficher
        })
    return jsonify(files_list)

import uuid

def find_anomalies_in_report(report_data):
    """Extrait les anomalies du rapport et leur assigne un ID."""
    anomalies = []
    if report_data and isinstance(report_data, dict):
        rapprochement = report_data.get('rapprochement')
        if rapprochement and isinstance(rapprochement, dict):
            if not rapprochement.get('paiement_trouve'):
                anomalies.append({
                    'id': str(uuid.uuid4()),  # Générer un ID unique
                    'message': "Aucune opération correspondante trouvée...",
                    'type': 'rapprochement',
                    'field': 'paiement_trouve',
                    'originalValue': False,
                    'expectedValue': True,
                    'statut': rapprochement.get('statut_paiement_trouve', 'non_corrigé'), # Ajouter le statut
                })
            if not rapprochement.get('montant_correspond'):
                anomalies.append({
                    'id': str(uuid.uuid4()),  # Générer un ID unique
                    'message': "Le montant de la facture ne correspond pas...",
                    'type': 'rapprochement',
                    'field': 'montant_correspond',
                    'originalValue': False,
                    'expectedValue': True,
                    'statut': rapprochement.get('statut_montant_correspond', 'non_corrigé'), # Ajouter le statut
                })
            if not rapprochement.get('date_correspond'):
                anomalies.append({
                    'id': str(uuid.uuid4()),  # Générer un ID unique
                    'message': "La date de la facture ne correspond pas...",
                    'type': 'rapprochement',
                    'field': 'date_correspond',
                    'originalValue': False,
                    'expectedValue': True,
                    'statut': rapprochement.get('statut_date_correspond', 'non_corrigé'), # Ajouter le statut
                })
        # ... autres logiques de détection d'anomalies ...
    return [a for a in anomalies if isinstance(a, dict) and a.get('statut') != 'corrigé']

@app.route('/api/reconciliations', methods=['GET'])
def get_reconciliations():
    """Endpoint pour récupérer les rapprochements avec filtres"""
    try:
        # 1. Récupération des paramètres
        date_range = request.args.get('dateRange', 'last30days')
        status_filter = request.args.get('status', 'all')

        # 2. Construction de la requête de base
        query = Reconciliation.objects.order_by('-created_at')

        # 3. Application des filtres de date
        date_limits = {
            'last7days': timedelta(days=7),
            'last30days': timedelta(days=30),
            'last90days': timedelta(days=90)
        }

        if date_range in date_limits:
            date_limit = datetime.now() - date_limits[date_range]
            query = query.filter(created_at__gte=date_limit)

        # 4. Formatage des résultats
        results = []
        for recon in query:
            try:
                # Fonction helper pour accès sécurisé aux attributs
                def get_attr(obj, attr_path, default=None):
                    if not hasattr(recon, 'banque') or not recon.banque:
                        return default
                    try:
                        for attr in attr_path.split('.'):
                            obj = getattr(obj, attr) if hasattr(obj, attr) else obj.get(attr, {})
                        return obj if obj != {} else default
                    except:
                        return default

                # Récupération des données
                banque_nom = get_attr(recon.banque, 'nom') or \
                             get_attr(recon.banque, 'metadata.emetteur', "Inconnu")

                facture_numero = get_attr(recon.facture, 'numero') or \
                                 get_attr(recon.facture, 'metadata.numero_facture', "N/A")

                # Traitement du rapport
                report_data = recon.report  # Accéder directement au dictionnaire report
                if isinstance(report_data, str):
                    try:
                        report_data = json.loads(report_data)
                    except json.JSONDecodeError:
                        report_data = {"error": "Invalid report format"}

                # Extraction des anomalies en utilisant la nouvelle fonction
                anomalies = find_anomalies_in_report(report_data)

                # Construction du résultat
                result = {
                    "id": str(recon.id),
                    "date": recon.created_at.strftime("%Y-%m-%d %H:%M"),
                    "facture": {
                        "id": str(get_attr(recon.facture, 'id')),
                        "numero": facture_numero
                    } if hasattr(recon, 'facture') and recon.facture else None,
                    "banque": {
                        "id": str(get_attr(recon.banque, 'id')),
                        "nom": banque_nom
                    } if hasattr(recon, 'banque') and recon.banque else None,
                    "statut": get_attr(report_data, 'metadata.statut', "inconnu"),
                    "anomalies": anomalies,
                    "has_anomalies": len(anomalies) > 0
                }

                # Filtrage par statut (si besoin)
                if status_filter != 'all' and result["statut"] != status_filter:
                    continue

                results.append(result)

            except Exception as e:
                print(f"Erreur de formatage pour {getattr(recon, 'id', 'unknown')}: {str(e)}")
                import traceback
                traceback.print_exc()
                continue

        return jsonify({
            "success": True,
            "count": len(results),
            "data": results,
            "filters_applied": {
                "dateRange": date_range,
                "status": status_filter
            }
        })

    except Exception as e:
        print(f"ERREUR SERVEUR: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "success": False,
            "error": "Erreur interne du serveur",
            "details": str(e)
        }), 500

@app.route('/api/reconciliations/<reconciliation_id>', methods=['PATCH'])
def update_reconciliation(reconciliation_id):
    """Endpoint pour mettre à jour un rapprochement (validation ou corrections)"""
    try:
        # 1. Vérification de l'existence du rapprochement
        reconciliation = Reconciliation.objects.get(id=reconciliation_id)

        # 2. Récupération des données de la requête
        update_data = request.get_json()
        print(f"Données de mise à jour reçues pour {reconciliation_id}: {update_data}") # Ajout du log

        if not update_data or 'report' not in update_data:
            return jsonify({
                "success": False,
                "error": "Données de mise à jour manquantes"
            }), 400

        # 3. Mise à jour du rapport
        report = reconciliation.report or {}
        print(f"Statut AVANT mise à jour: {report.get('metadata', {}).get('statut')}") # Ajout du log

        # Fusion des métadonnées
        if 'metadata' in update_data['report']:
            report['metadata'] = {
                **report.get('metadata', {}),
                **update_data['report']['metadata'],
                # Forcer la date de mise à jour
                'date_mise_a_jour': datetime.now().isoformat()
            }

            # Si on valide le rapprochement
            if update_data['report']['metadata'].get('statut') == 'Validé':
                report['metadata']['date_validation'] = datetime.now().isoformat()
                print("Statut mis à jour à Validé") # Ajout du log
            else:
                print(f"Statut PAS mis à jour à Validé, statut actuel: {update_data['report']['metadata'].get('statut')}") # Ajout du log

        # Fusion des autres parties du rapport si nécessaire
        if 'rapprochement' in update_data['report']:
            report['rapprochement'] = {
                **report.get('rapprochement', {}),
                **update_data['report']['rapprochement']
            }

        # 4. Sauvegarde des modifications
        reconciliation.report = report
        reconciliation.updated_at = datetime.now()
        reconciliation.save()
        print(f"Statut APRÈS sauvegarde: {reconciliation.report.get('metadata', {}).get('statut')}") # Ajout du log

        # 5. Préparation de la réponse
        response_data = {
            "success": True,
            "message": "Rapprochement mis à jour avec succès",
            "data": {
                "id": str(reconciliation.id),
                "statut": report['metadata'].get('statut'),
                "date_mise_a_jour": report['metadata'].get('date_mise_a_jour')
            }
        }

        # Ajout des infos supplémentaires si validation
        if report['metadata'].get('statut') == 'Validé':
            response_data['data']['date_validation'] = report['metadata'].get('date_validation')

        return jsonify(response_data)

    except DoesNotExist:
        return jsonify({
            "success": False,
            "error": f"Rapprochement {reconciliation_id} introuvable"
        }), 404

    except Exception as e:
        print(f"ERREUR SERVEUR lors de la mise à jour: {str(e)}")
        return jsonify({
            "success": False,
            "error": "Erreur interne du serveur",
            "details": str(e)
        }), 500

@app.route('/api/reconciliations/<reconciliation_id>/correct', methods=['POST'])
def correct_reconciliation(reconciliation_id):
    """Endpoint pour appliquer des corrections aux anomalies d'un rapprochement"""
    try:
        # 1. Vérification de l'existence du rapprochement
        reconciliation = Reconciliation.objects.get(id=reconciliation_id)

        # 2. Récupération des données de la requête
        data = request.get_json()
        print(f"Données de correction reçues pour {reconciliation_id}: {data}")

        if not data:
            return jsonify({
                "success": False,
                "error": "Données de correction manquantes"
            }), 400

        # 3. Vérification des données requises
        if 'corrections' not in data:
            return jsonify({
                "success": False,
                "error": "Le champ 'corrections' est requis"
            }), 400

        # 4. Initialisation du rapport s'il n'existe pas
        if not reconciliation.report:
            reconciliation.report = {
                "metadata": {},
                "rapprochement": {
                    "anomalies": [],
                    "correspondances": []
                }
            }

        # 5. Application des corrections
        report = reconciliation.report
        rapprochement_data = report.get('rapprochement', {})
        anomalies = rapprochement_data.get('anomalies', [])
        print(f"Structure des anomalies AVANT la boucle de correction pour {reconciliation_id}: {anomalies}")
        anomalies_modifiees = []  # Nouvelle liste pour stocker les anomalies modifiées

        for correction in data['corrections']:
            anomaly_id_to_correct = correction.get('anomalyId')
            correction_value = correction.get('value')
            correction_type = correction.get('type')
            correction_field = correction.get('field')
            print(f"Correction actuelle: {correction}")

            for anomaly in anomalies:
                print(f"Type de anomaly: {type(anomaly)}")
                print(f"Contenu de anomaly: {anomaly}")

                if isinstance(anomaly, dict):
                    anomaly_id = anomaly.get('id')
                    if anomaly_id and anomaly_id_to_correct and str(anomaly_id) == str(anomaly_id_to_correct):
                        anomaly['correction'] = {
                            'valeur': correction_value,
                            'date_correction': datetime.now().isoformat(),
                            'auteur': request.remote_user or 'system'
                        }
                        anomaly['statut'] = 'corrigé'
                        anomalies_modifiees.append(anomaly)
                    elif not anomaly_id and anomaly.get('type') == correction_type and anomaly.get('field') == correction_field:
                        anomaly['correction'] = {
                            'valeur': correction_value,
                            'date_correction': datetime.now().isoformat(),
                            'auteur': request.remote_user or 'system'
                        }
                        anomaly['statut'] = 'corrigé'
                        anomalies_modifiees.append(anomaly)
                    else:
                        anomalies_modifiees.append(anomaly)
                elif isinstance(anomaly, str):
                    # Gérer l'ancienne structure d'anomalie (chaîne de caractères)
                    if correction_type == 'rapprochement' and correction_field in anomaly and correction.get('message') in anomaly:
                        # Si l'ancienne anomalie correspond aux informations de la correction
                        anomalie_dict = {'message': anomaly, 'type': correction_type, 'field': correction_field, 'statut': 'corrigé', 'correction': {
                            'valeur': correction_value,
                            'date_correction': datetime.now().isoformat(),
                            'auteur': request.remote_user or 'system'
                        }}
                        anomalies_modifiees.append(anomalie_dict)
                    else:
                        anomalies_modifiees.append(anomaly)
                else:
                    anomalies_modifiees.append(anomaly)

        # 6. Mise à jour du rapport avec les anomalies potentiellement modifiées
        rapprochement_data['anomalies'] = [
            a for a in anomalies_modifiees if isinstance(a, dict) or (isinstance(a, str) and 'corrigé' in a)
        ] # Filtrer pour ne garder que les corrections ou les anciennes anomalies corrigées
        report['rapprochement'] = rapprochement_data

        # 7. Mise à jour des métadonnées
        report['metadata'] = {
            **report.get('metadata', {}),
            'statut': 'Ajusté',
            'commentaires': data.get('comments', ''),
            'date_ajustement': datetime.now().isoformat(),
            'corrections_appliquees': True,
            'derniere_mise_a_jour': datetime.now().isoformat()
        }

        # 8. Sauvegarde
        reconciliation.report = report
        reconciliation.updated_at = datetime.now()
        reconciliation.save()

        return jsonify({
            "success": True,
            "message": "Corrections appliquées avec succès",
            "data": {
                "id": str(reconciliation.id),
                "anomalies_corrigees": len([corr for corr in anomalies_modifiees if isinstance(corr, dict) and 'correction' in corr or (isinstance(corr, str) and 'corrigé' in corr)]),
                "statut": "Ajusté"
            }
        })

    except DoesNotExist:
        return jsonify({
            "success": False,
            "error": f"Rapprochement {reconciliation_id} introuvable"
        }), 404

    except Exception as e:
        print(f"ERREUR SERVEUR lors de la correction: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "success": False,
            "error": "Erreur interne du serveur",
            "details": str(e)
        }), 500

@app.route('/api/rapports/<rapport_id>', methods=['GET'])
def get_rapport(rapport_id):
    """Récupère un rapport spécifique par son ID avec tous les détails."""
    try:
        if not rapport_id:
            return jsonify({"success": False, "error": "ID de rapport manquant"}), 400

        try:
            object_id = ObjectId(rapport_id)
        except Exception:
            return jsonify({"success": False, "error": "ID de rapport invalide. Doit être un ObjectId valide."}), 400

        rapport = Rapport.objects(id=object_id).first()

        if not rapport:
            return jsonify({"success": False, "error": f"Rapport non trouvé avec l'ID: {rapport_id}"}), 404

        # --- Données de la facture ---
        facture_display_data = {
            "id": str(rapport.facture.id) if rapport.facture else None,
            "numero": getattr(rapport.facture, 'numero', "N/A") if rapport.facture else "N/A",
            "emetteur": getattr(rapport.facture, 'emetteur', "N/A") if rapport.facture else "N/A",
            "client": getattr(rapport.facture, 'client', "N/A") if rapport.facture else "N/A",
            # Traiter les dates: appeler parse_date, puis formater pour JSON ou "N/A"
            "date_emission": (parse_date(getattr(rapport.facture, 'date_emission', None)).isoformat()
                              if rapport.facture and parse_date(getattr(rapport.facture, 'date_emission', None)) else "N/A"),
            "montant_total": getattr(rapport.facture, 'montant_total', "N/A") if rapport.facture else "N/A",
            "devise": getattr(rapport.facture, 'devise', "N/A") if rapport.facture else "N/A",
            "statut_paiement": "N/A",
            "montant_ht": getattr(rapport.facture, 'montant_ht', "N/A") if rapport.facture else "N/A",
            "montant_tva": getattr(rapport.facture, 'montant_tva', "N/A") if rapport.facture else "N/A",
            "montant_ttc": getattr(rapport.facture, 'montant_ttc', "N/A") if rapport.facture else "N/A",
            "net_a_payer": getattr(rapport.facture, 'net_a_payer', "N/A") if rapport.facture else "N/A",
            "date_echeance": (parse_date(getattr(rapport.facture, 'date_echeance', None)).isoformat()
                               if rapport.facture and parse_date(getattr(rapport.facture, 'date_echeance', None)) else "N/A"),
            "reference_paiement": getattr(rapport.facture, 'reference_paiement', "N/A") if rapport.facture else "N/A",
            "mode_reglement": getattr(rapport.facture, 'mode_reglement', "N/A") if rapport.facture else "N/A",
            "ligne_details": getattr(rapport.facture, 'ligne_details', []) if rapport.facture else [],
        }

        if rapport.resume_facture:
            # Pour les dates du resume_facture, récupérer la valeur, la parser, puis la formater
            date_emission_resume = parse_date(rapport.resume_facture.get("date_emission"))
            date_echeance_resume = parse_date(rapport.resume_facture.get("date_echeance"))

            facture_display_data.update({
                "numero": rapport.resume_facture.get("numero", facture_display_data["numero"]),
                "emetteur": rapport.resume_facture.get("emetteur", facture_display_data["emetteur"]),
                "client": rapport.resume_facture.get("client", facture_display_data["client"]),
                "date_emission": date_emission_resume.isoformat() if date_emission_resume else facture_display_data["date_emission"],
                "montant_total": rapport.resume_facture.get("montant_total", facture_display_data["montant_total"]),
                "devise": rapport.resume_facture.get("devise", facture_display_data["devise"]),
                "montant_ht": rapport.resume_facture.get("montant_ht", facture_display_data["montant_ht"]),
                "montant_tva": rapport.resume_facture.get("montant_tva", facture_display_data["montant_tva"]),
                "montant_ttc": rapport.resume_facture.get("montant_ttc", facture_display_data["montant_ttc"]),
                "net_a_payer": rapport.resume_facture.get("net_a_payer", facture_display_data["net_a_payer"]),
                "date_echeance": date_echeance_resume.isoformat() if date_echeance_resume else facture_display_data["date_echeance"],
                "reference_paiement": rapport.resume_facture.get("reference_paiement", facture_display_data["reference_paiement"]),
                "mode_reglement": rapport.resume_facture.get("mode_reglement", facture_display_data["mode_reglement"]),
                "ligne_details": rapport.resume_facture.get("ligne_details", facture_display_data["ligne_details"]),
            })


        # --- Données du relevé bancaire (Banque) ---
        banque_display_data = {
            "id": str(rapport.banque.id) if rapport.banque else None,
            "nom_banque": getattr(rapport.banque, 'nom', "N/A") if rapport.banque else "N/A",
            "numero_compte": getattr(rapport.banque, 'numero_compte', "N/A") if rapport.banque else "N/A",
            "titulaire": getattr(rapport.banque, 'titulaire', "N/A") if rapport.banque else "N/A",
            "bic": getattr(rapport.banque, 'bic', "N/A") if rapport.banque else "N/A",
            "iban": getattr(rapport.banque, 'iban', "N/A") if rapport.banque else "N/A",
            "numero_releve": getattr(rapport.banque, 'numero', "N/A") if rapport.banque else "N/A",
            "periode": getattr(rapport.banque, 'periode', "N/A") if rapport.banque else "N/A",
            # Traiter les dates de relevé
            "date_debut": (parse_date(getattr(rapport.banque, 'date_debut', None)).isoformat()
                           if rapport.banque and parse_date(getattr(rapport.banque, 'date_debut', None)) else "N/A"),
            "date_fin": (parse_date(getattr(rapport.banque, 'date_fin', None)).isoformat()
                         if rapport.banque and parse_date(getattr(rapport.banque, 'date_fin', None)) else "N/A"),
            "solde_initial": getattr(rapport.banque, 'solde_initial', "N/A") if rapport.banque else "N/A",
            "solde_final": getattr(rapport.banque, 'solde_final', "N/A") if rapport.banque else "N/A",
            "total_credits": getattr(rapport.banque, 'total_credits', "N/A") if rapport.banque else "N/A",
            "total_debits": getattr(rapport.banque, 'total_debits', "N/A") if rapport.banque else "N/A",
            "operations": [],
        }

        if rapport.resume_releve:
            date_debut_resume = parse_date(rapport.resume_releve.get("date_debut"))
            date_fin_resume = parse_date(rapport.resume_releve.get("date_fin"))

            banque_display_data.update({
                "nom_banque": rapport.resume_releve.get("nom", banque_display_data["nom_banque"]),
                "numero_compte": rapport.resume_releve.get("numero_compte", banque_display_data["numero_compte"]),
                "titulaire": rapport.resume_releve.get("titulaire", banque_display_data["titulaire"]),
                "bic": rapport.resume_releve.get("bic", banque_display_data["bic"]),
                "iban": rapport.resume_releve.get("iban", banque_display_data["iban"]),
                "numero_releve": rapport.resume_releve.get("numero", banque_display_data["numero_releve"]),
                "periode": rapport.resume_releve.get("periode", banque_display_data["periode"]),
                "date_debut": date_debut_resume.isoformat() if date_debut_resume else banque_display_data["date_debut"],
                "date_fin": date_fin_resume.isoformat() if date_fin_resume else banque_display_data["date_fin"],
                "solde_initial": rapport.resume_releve.get("solde_initial", banque_display_data["solde_initial"]),
                "solde_final": rapport.resume_releve.get("solde_final", banque_display_data["solde_final"]),
                "total_credits": rapport.resume_releve.get("total_credits", banque_display_data["total_credits"]),
                "total_debits": rapport.resume_releve.get("total_debits", banque_display_data["total_debits"]),
            })

        if rapport.banque and rapport.banque.operations:
            banque_display_data["operations"] = [
                {
                    "date": parse_date(op.date).isoformat() if parse_date(op.date) else "N/A", # Formatage direct ici
                    "libelle": op.libelle,
                    "debit": op.debit,
                    "credit": op.credit,
                    "solde": op.solde,
                    "montant": op.montant,
                    "ref_facture": op.ref_facture,
                    "reference": op.reference,
                    "numero_piece": op.numero_piece,
                    "type_operation": op.type_operation,
                } for op in rapport.banque.operations
            ]

        # --- Construction de la réponse complète pour le rapport ---
        response_data = {
            "id": str(rapport.id),
            "titre": rapport.titre,
            "date_generation": rapport.date_generation.isoformat() if rapport.date_generation else None,
            "date_creation": rapport.date_creation.isoformat() if rapport.date_creation else None,
            "derniere_maj": rapport.derniere_maj.isoformat() if rapport.derniere_maj else None,
            "statut": rapport.statut,
            "facture": facture_display_data,
            "banque": banque_display_data,
            "resume_facture": rapport.resume_facture,
            "resume_releve": rapport.resume_releve,
            "resultat_verification": rapport.resultat_verification,
            "invoice_data": rapport.invoice_data,
            "statement_data": rapport.statement_data,
            "verification_result": rapport.verification_result,
            "anomalies": rapport.anomalies,
            "recommendations": rapport.recommendations,
            "analyse_texte": rapport.analyse_texte,
            "rapport_complet": rapport.rapport_complet,
        }

        return jsonify(response_data), 200

    except Exception as e:
        print(f"Erreur lors de la récupération du rapport: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"success": False, "error": f"Erreur serveur: {str(e)}"}), 500


# --- VOTRE FONCTION get_rapports CORRIGÉE ---
@app.route('/api/rapports', methods=['GET'])
def get_rapports():
    """Récupère la liste des rapports avec filtres"""
    try:
        statut = request.args.get('statut')
        facture_id = request.args.get('facture_id')
        banque_id = request.args.get('banque_id')
        client_name = request.args.get('client_name')
        emetteur_name = request.args.get('emetteur_name')
        banque_name = request.args.get('banque_name')
        
        query = Q()

        if statut:
            query = query & Q(statut=statut)
        
        if facture_id:
            try:
                query = query & Q(facture=ObjectId(facture_id))
            except Exception:
                return jsonify({"success": False, "error": "ID facture invalide"}), 400
        
        if banque_id:
            try:
                query = query & Q(banque=ObjectId(banque_id))
            except Exception:
                return jsonify({"success": False, "error": "ID relevé bancaire (Banque) invalide"}), 400

        if client_name:
            query = query & (Q(facture__client__icontains=client_name) | Q(resume_facture__client__icontains=client_name))
        
        if emetteur_name:
            query = query & (Q(facture__emetteur__icontains=emetteur_name) | Q(resume_facture__emetteur__icontains=emetteur_name))

        if banque_name:
            query = query & (Q(banque__nom__icontains=banque_name) | Q(resume_releve__nom__icontains=banque_name))


        rapports = Rapport.objects(query).order_by('-date_generation')

        results = []
        for rapport in rapports:
            try:
                facture_data = None
                if rapport.facture:
                    # Traiter les dates de facture pour get_rapports
                    parsed_date_emission_facture = parse_date(getattr(rapport.facture, 'date_emission', None))
                    facture_data = {
                        "id": str(rapport.facture.id),
                        "numero": getattr(rapport.facture, 'numero', 'N/A'),
                        "emetteur": getattr(rapport.facture, 'emetteur', 'N/A'),
                        "client": getattr(rapport.facture, 'client', 'N/A'),
                        "montant_total": getattr(rapport.facture, 'montant_total', 'N/A'),
                        "date_emission": parsed_date_emission_facture.isoformat() if parsed_date_emission_facture else "N/A",
                    }
                elif rapport.resume_facture:
                    parsed_date_emission_resume_facture = parse_date(rapport.resume_facture.get("date_emission"))
                    facture_data = {
                        "id": rapport.resume_facture.get("id"),
                        "numero": rapport.resume_facture.get("numero", 'N/A'),
                        "emetteur": rapport.resume_facture.get("emetteur", 'N/A'),
                        "client": rapport.resume_facture.get("client", 'N/A'),
                        "montant_total": rapport.resume_facture.get("montant_total", 'N/A'),
                        "date_emission": parsed_date_emission_resume_facture.isoformat() if parsed_date_emission_resume_facture else "N/A",
                    }


                banque_data = None
                if rapport.banque:
                    # Traiter les dates de relevé bancaire pour get_rapports
                    parsed_date_fin_banque = parse_date(getattr(rapport.banque, 'date_fin', None))
                    banque_data = {
                        "id": str(rapport.banque.id),
                        "nom_banque": getattr(rapport.banque, 'nom', 'N/A'),
                        "numero_compte": getattr(rapport.banque, 'numero_compte', 'N/A'),
                        "titulaire": getattr(rapport.banque, 'titulaire', 'N/A'),
                        "periode": getattr(rapport.banque, 'periode', 'N/A'),
                        "solde_final": getattr(rapport.banque, 'solde_final', 'N/A'),
                        "date_fin": parsed_date_fin_banque.isoformat() if parsed_date_fin_banque else "N/A",
                    }
                elif rapport.resume_releve:
                    parsed_date_fin_resume_releve = parse_date(rapport.resume_releve.get("date_fin"))
                    banque_data = {
                        "id": rapport.resume_releve.get("id"),
                        "nom_banque": rapport.resume_releve.get("nom", 'N/A'),
                        "numero_compte": rapport.resume_releve.get("numero_compte", 'N/A'),
                        "titulaire": rapport.resume_releve.get("titulaire", 'N/A'),
                        "periode": rapport.resume_releve.get("periode", 'N/A'),
                        "solde_final": rapport.resume_releve.get("solde_final", 'N/A'),
                        "date_fin": parsed_date_fin_resume_releve.isoformat() if parsed_date_fin_resume_releve else "N/A",
                    }

                results.append({
                    "id": str(rapport.id),
                    "titre": rapport.titre,
                    "date_generation": rapport.date_generation.isoformat() if rapport.date_generation else None,
                    "statut": rapport.statut,
                    "facture": facture_data,
                    "banque": banque_data,
                    "anomalies": rapport.anomalies, # <-- Nouvelle ligne, directement
                    "anomalies_count": len(rapport.anomalies),
                    "has_anomalies": len(rapport.anomalies) > 0
                })

            except Exception as e:
                print(f"Erreur de formatage pour le rapport {str(rapport.id)}: {str(e)}")
                import traceback
                traceback.print_exc()
                continue

        return jsonify({
            "success": True,
            "count": len(results),
            "data": results
        }), 200

    except Exception as e:
        print(f"Erreur dans get_rapports: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "success": False,
            "error": "Erreur serveur",
            "message": str(e),
            "data": []
        }), 500


@app.route('/api/rapports/<rapport_id>/pdf', methods=['GET'])
def generate_rapport_pdf(rapport_id):
    """Génère un PDF pour un rapport spécifique"""
    try:
        # Validation de l'ID
        if not rapport_id:
            return jsonify({"error": "ID de rapport manquant"}), 400
            
        # Récupération du rapport
        rapport = Rapport.objects(id=rapport_id).first()
        
        if not rapport:
            return jsonify({"error": f"Rapport non trouvé avec l'ID: {rapport_id}"}), 404
        
        # Utilisation de la librairie WeasyPrint pour générer le PDF
        # Vous devez installer WeasyPrint: pip install weasyprint
        import weasyprint
        from flask import render_template
        
        # Créer le contexte pour le template HTML
        context = {
            "rapport": rapport,
            "facture": rapport.facture,
            "banque": rapport.banque,
            "date_generation": rapport.date_generation.strftime("%d/%m/%Y %H:%M"),
            "statut": rapport.statut,
            "resume_facture": rapport.resume_facture,
            "resume_releve": rapport.resume_releve,
            "resultat_verification": rapport.resultat_verification,
            "anomalies": rapport.anomalies,
            "recommendations": rapport.recommendations,
            "analyse_texte": rapport.analyse_texte
        }
        
        # Générer le HTML à partir d'un template
        html_content = render_template('rapport_pdf.html', **context)
        
        # Convertir le HTML en PDF
        pdf = weasyprint.HTML(string=html_content).write_pdf()
        
        # Préparer la réponse avec le bon type MIME
        response = make_response(pdf)
        response.headers['Content-Type'] = 'application/pdf'
        response.headers['Content-Disposition'] = f'attachment; filename=rapport-{rapport_id}.pdf'
        
        return response
        
    except Exception as e:
        print(f"Erreur lors de la génération du PDF: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Erreur lors de la génération du PDF: {str(e)}"}), 500 
@app.route('/api/rapports/<rapport_id>/excel', methods=['GET']) # Ou @api_bp.route
def generate_rapport_excel(rapport_id):
    """
    Génère un fichier Excel pour un rapport spécifique,
    avec des améliorations de formatage (hauteur de ligne et largeur de colonne).
    """
    try:
        rapport = Rapport.objects(id=rapport_id).first()
        if not rapport:
            return jsonify({"error": f"Rapport non trouvé avec l'ID: {rapport_id}"}), 404

        data = {
            'Titre du Rapport': [rapport.titre],
            'Date de Génération': [rapport.date_generation.strftime("%Y-%m-%d %H:%M:%S")],
            'Statut': [rapport.statut],
            'Facture Numéro': [rapport.facture.numero if rapport.facture else 'N/A'],
            'Facture Émetteur': [rapport.facture.emetteur if rapport.facture and hasattr(rapport.facture, 'emetteur') else 'N/A'],
            'Banque Numéro': [rapport.banque.numero if rapport.banque else 'N/A'],
            'Résumé Facture': [rapport.resume_facture if rapport.resume_facture else 'N/A'],
            'Résumé Relevé': [rapport.resume_releve if rapport.resume_releve else 'N/A'],
            'Résultat Vérification': [rapport.resultat_verification if rapport.resultat_verification else 'N/A'],
            'Anomalies': ['\n'.join(rapport.anomalies) if rapport.anomalies else 'Aucune'],
            'Recommandations': ['\n'.join(rapport.recommendations) if rapport.recommendations else 'Aucune'],
            'Analyse Texte': [rapport.analyse_texte if rapport.analyse_texte else 'N/A'],
            'Rapport Complet': [rapport.rapport_complet if rapport.rapport_complet else 'N/A']
        }

        df = pd.DataFrame(data)

        output = BytesIO()
        
        # Utilisez pandas.ExcelWriter pour manipuler la feuille de calcul
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='Rapport')
            
            # Accéder à la feuille de calcul pour le formatage
            worksheet = writer.sheets['Rapport']

            # 1. Ajuster la hauteur des lignes
            # Parcourez toutes les lignes et définissez une hauteur minimale.
            # Ou vous pouvez itérer sur les cellules si vous voulez une hauteur dynamique basée sur le contenu.
            # Pour une hauteur fixe pour toutes les lignes de données:
            # Note: La ligne d'en-tête est la ligne 1 (index 1 dans openpyxl)
            for row_idx in range(1, len(df) + 2): # +1 pour les en-têtes, +1 pour le range
                worksheet.row_dimensions[row_idx].height = 50 # Définir une hauteur de 50 points (ajustez selon le besoin)

            # 2. Ajuster la largeur des colonnes
            # Vous pouvez définir une largeur fixe pour chaque colonne.
            # Pour une largeur "auto-ajustée" (approximative) basée sur le contenu :
            for column in worksheet.columns:
                max_length = 0
                column_name = column[0].column_letter # 'A', 'B', 'C', etc.
                
                # Calcule la longueur maximale du contenu dans la colonne
                for cell in column:
                    try: # Évite les erreurs si la cellule est vide
                        if len(str(cell.value)) > max_length:
                            max_length = len(cell.value)
                    except:
                        pass
                
                adjusted_width = (max_length + 2) * 1.2 # Un facteur d'ajustement pour un meilleur rendu
                if adjusted_width > 75: # Limiter la largeur maximale pour éviter des colonnes trop larges
                    adjusted_width = 75
                elif adjusted_width < 15: # Largeur minimale pour la lisibilité
                    adjusted_width = 15
                
                worksheet.column_dimensions[column_name].width = adjusted_width

            # Cas spécifique pour les colonnes 'Anomalies' et 'Recommandations'
            # Puisqu'elles contiennent des sauts de ligne ('\n'), la largeur automatique ne suffit pas toujours.
            # Vous devrez peut-être envelopper le texte ou augmenter la hauteur des lignes.
            # Pour l'habillage du texte (wrap text):
            from openpyxl.styles import Alignment
            for col_idx, col_header in enumerate(df.columns):
                if col_header in ['Anomalies', 'Recommandations']:
                    # Obtient la lettre de la colonne (ex: 'J' pour la 10ème colonne)
                    col_letter = openpyxl.utils.get_column_letter(col_idx + 1)
                    for row in worksheet.iter_rows(min_row=1, min_col=col_idx + 1, max_col=col_idx + 1):
                        for cell in row:
                            cell.alignment = Alignment(wrap_text=True, vertical='top') # Habiller le texte et aligner en haut
                    
                    # Augmenter spécifiquement la largeur de ces colonnes si nécessaire
                    worksheet.column_dimensions[col_letter].width = 60 # Ajustez cette valeur
                    
                    # Vous pouvez également augmenter la hauteur de ligne pour ces lignes spécifiques
                    # si le contenu est très long et les sauts de ligne sont fréquents.
                    # Cependant, mettre une hauteur de ligne fixe pour toutes les lignes (comme fait plus haut)
                    # ou une hauteur dynamique basée sur le contenu serait plus robuste.
                    # Pour une hauteur dynamique basée sur les retours à la ligne:
                    # Il faudrait parcourir chaque cellule, compter les '\n' et ajuster la hauteur de la ligne.
                    # C'est plus complexe, la hauteur fixe et le wrap text sont un bon début.


        # IMPORTANT: output.seek(0) doit être APRES la fermeture de l'ExcelWriter
        # pour s'assurer que toutes les écritures sont terminées dans le buffer.
        output.seek(0)

        # Préparer la réponse HTTP
        response = make_response(output.getvalue())
        response.headers['Content-Type'] = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        response.headers['Content-Disposition'] = f'attachment; filename=rapport-{rapport_id}.xlsx'

        return response

    except Exception as e:
        # current_app.logger.error(f"Erreur lors de la génération de l'Excel pour le rapport {rapport_id}: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Erreur lors de la génération de l'Excel: {str(e)}"}), 500

@app.route('/api/rapports/<rapport_id>', methods=['DELETE'])
def delete_rapport(rapport_id):
    """Supprime un rapport spécifique de la base de données."""
    try:
        rapport = Rapport.objects.get(id=rapport_id)
        rapport.delete()
        return jsonify({"message": f"Rapport avec l'ID {rapport_id} supprimé avec succès."}), 200
    except DoesNotExist:
        return jsonify({"error": f"Rapport non trouvé avec l'ID: {rapport_id}"}), 404
    except Exception as e:
        print(f"Erreur lors de la suppression du rapport: {str(e)}")
        return jsonify({"error": f"Erreur lors de la suppression du rapport: {str(e)}"}), 500 
@app.route('/api/rapports/<rapport_id>', methods=['PUT'])
def update_rapport(rapport_id):
    """
    Met à jour les informations modifiables d'un rapport spécifique par son ID.
    Permet la mise à jour partielle des champs du rapport, en se concentrant
    sur les données qui peuvent être logiquement éditées manuellement.
    """
    try:
        if not rapport_id:
            return jsonify({"success": False, "error": "ID de rapport manquant"}), 400

        try:
            object_id = ObjectId(rapport_id)
        except Exception:
            return jsonify({"success": False, "error": "ID de rapport invalide. Doit être un ObjectId valide."}), 400

        rapport = Rapport.objects(id=object_id).first()

        if not rapport:
            return jsonify({"success": False, "error": f"Rapport non trouvé avec l'ID: {rapport_id}"}), 404

        data = request.get_json()
        if not data:
            return jsonify({"success": False, "error": "Données JSON manquantes dans la requête"}), 400

        # Champs autorisés pour une mise à jour directe et logique
        # Exclure les champs générés automatiquement ou dérivés
        # 'statut' est inclus car il peut être modifié manuellement (ex: marqué comme résolu)
        allowed_fields_for_manual_update = [
            'titre',
            'statut', # Le statut peut être modifié manuellement (ex: passer de 'anomalie' à 'complet' après correction)
            'recommendations',
            'rapport_complet', # Si c'est un flag de finalisation
            # 'analyse_texte' - à inclure si vous avez un cas d'usage réel pour la modification manuelle
        ]

        updated_fields = []
        for field, value in data.items():
            if field in allowed_fields_for_manual_update:
                try:
                    # Traitement spécifique pour le statut si nécessaire (validation des valeurs)
                    if field == 'statut':
                        # Optionnel: valider la valeur du statut contre une liste prédéfinie
                        # Par exemple, si vos statuts possibles sont "complet", "incomplet", "anomalie", "en_revue"
                        valid_statuts = ["complet", "incomplet", "anomalie", "en_revue"]
                        if value not in valid_statuts:
                            return jsonify({
                                "success": False,
                                "error": f"Valeur de statut '{value}' invalide. Doit être l'une des suivantes : {', '.join(valid_statuts)}."
                            }), 400
                    
                    setattr(rapport, field, value)
                    updated_fields.append(field)
                except ValidationError as ve:
                    # Erreur de validation de MongoEngine (ex: type de données incorrect)
                    return jsonify({"success": False, "error": f"Erreur de validation pour le champ '{field}': {str(ve)}"}), 400
            else:
                # Log ou ignorer les champs non autorisés pour la mise à jour directe
                print(f"Avertissement: Tentative de mise à jour du champ '{field}' non autorisé ou non logique. Champ ignoré.")
                # Ou si vous voulez être strict, décommentez la ligne suivante:
                # return jsonify({"success": False, "error": f"Le champ '{field}' ne peut pas être mis à jour directement."}), 400

        # Mettre à jour le champ 'derniere_maj' à l'heure actuelle
        rapport.derniere_maj = datetime.now()

        rapport.save()

        if not updated_fields:
            return jsonify({
                "success": True,
                "message": f"Rapport avec l'ID {rapport_id} trouvé, mais aucune mise à jour pertinente n'a été appliquée (aucun champ valide et modifiable fourni).",
                "updated_fields": []
            }), 200

        return jsonify({
            "success": True,
            "message": f"Rapport avec l'ID {rapport_id} mis à jour avec succès.",
            "updated_fields": updated_fields
        }), 200

    except DoesNotExist:
        return jsonify({"success": False, "error": f"Rapport non trouvé avec l'ID: {rapport_id}"}), 404
    except ValidationError as e:
        # Attraper les erreurs de validation de MongoEngine qui pourraient survenir lors de l'enregistrement
        return jsonify({"success": False, "error": f"Erreur de validation des données lors de l'enregistrement: {str(e)}"}), 400
    except Exception as e:
        print(f"Erreur inattendue lors de la mise à jour du rapport: {str(e)}")
        import traceback
        traceback.print_exc() # Pour le débogage détaillé sur le serveur
        return jsonify({"success": False, "error": f"Erreur serveur inattendue: {str(e)}"}), 500

@app.route('/api/rapports/<rapport_id>/validate', methods=['POST'])
def validate_rapport(rapport_id):
    """
    Valide un rapport s'il ne contient pas d'anomalies non corrigées
    et met à jour son statut à 'validé'.
    """
    try:
        if not rapport_id:
            return jsonify({"success": False, "error": "ID de rapport manquant"}), 400

        try:
            object_id = ObjectId(rapport_id)
        except Exception:
            return jsonify({"success": False, "error": "ID de rapport invalide. Doit être un ObjectId valide."}), 400

        rapport = Rapport.objects(id=object_id).first()

        if not rapport:
            return jsonify({"success": False, "error": f"Rapport non trouvé avec l'ID: {rapport_id}"}), 404

        # Vérifier si le rapport est déjà validé
        if rapport.statut and rapport.statut.lower() == "validé":
            return jsonify({"success": False, "error": "Ce rapport est déjà validé."}), 400

        # Vérifier si le rapport contient des anomalies avant de valider
        if hasattr(rapport, 'anomalies') and rapport.anomalies and len(rapport.anomalies) > 0:
            return jsonify({
                "success": False, 
                "error": "Impossible de valider un rapport contenant des anomalies non corrigées. Veuillez l'ajuster d'abord."
            }), 400

        # Mettre à jour le statut du rapport à 'validé' (standardisé)
        rapport.statut = "Validé"  # Toujours en minuscules
        rapport.derniere_maj = datetime.now(timezone.utc)
        rapport.save()

        # IMPORTANT: Recharger l'objet depuis la base pour s'assurer de la cohérence
        rapport.reload()

        # Construction de la réponse
        response_data = {
            "id": str(rapport.id),
            "titre": rapport.titre,
            "date_generation": rapport.date_generation.isoformat() if rapport.date_generation else None,
            "date_creation": rapport.date_creation.isoformat() if rapport.date_creation else None,
            "derniere_maj": rapport.derniere_maj.isoformat(),
            "statut": rapport.statut,  # Retourner exactement ce qui est en base
            "anomalies": getattr(rapport, 'anomalies', []),
            "anomalies_count": len(getattr(rapport, 'anomalies', [])),
            "has_anomalies": len(getattr(rapport, 'anomalies', [])) > 0,
            "facture": {
                "id": str(rapport.facture.id) if rapport.facture else None,
                "numero": getattr(rapport.facture, 'numero', 'N/A') if rapport.facture else getattr(rapport, 'resume_facture', {}).get('numero', 'N/A'),
                "emetteur": getattr(rapport.facture, 'emetteur', 'N/A') if rapport.facture else getattr(rapport, 'resume_facture', {}).get('emetteur', 'N/A'),
            },
            "banque": {
                "id": str(rapport.banque.id) if rapport.banque else None,
                "nom_banque": getattr(rapport.banque, 'nom', 'N/A') if rapport.banque else getattr(rapport, 'resume_releve', {}).get('nom', 'N/A'),
                "numero_compte": getattr(rapport.banque, 'numero_compte', 'N/A') if rapport.banque else getattr(rapport, 'resume_releve', {}).get('numero_compte', 'N/A'),
            }
        }

        # Log pour debug
        current_app.logger.info(f"Rapport {rapport_id} validé avec succès. Statut final: {rapport.statut}")

        return jsonify({"success": True, "data": response_data}), 200

    except DoesNotExist:
        return jsonify({"success": False, "error": "Rapport non trouvé"}), 404
    except ValidationError as e:
        return jsonify({"success": False, "error": f"Données de rapport invalides: {str(e)}"}), 400
    except Exception as e:
        current_app.logger.error(f"Erreur lors de la validation du rapport {rapport_id}: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"success": False, "error": f"Erreur interne du serveur lors de la validation: {str(e)}"}), 500
# --- Route pour Ajuster (Corriger) un Rapport ---
# Cette route recevra les modifications du frontend pour les anomalies.
# Le frontend devra envoyer un tableau mis à jour d'anomalies, ou d'autres champs du rapport.
@app.route('/api/rapports/<rapport_id>/adjust', methods=['PUT'])
def adjust_rapport(rapport_id):
    """
    Ajuste (corrige) un rapport, par exemple en vidant les anomalies
    ou en mettant à jour d'autres champs suite à une correction manuelle.
    Le statut du rapport est mis à 'Ajusté'.
    """
    try:
        if not rapport_id:
            return jsonify({"success": False, "error": "ID de rapport manquant"}), 400

        try:
            object_id = ObjectId(rapport_id)
        except Exception:
            return jsonify({"success": False, "error": "ID de rapport invalide. Doit être un ObjectId valide."}), 400

        rapport = Rapport.objects(id=object_id).first()

        if not rapport:
            return jsonify({"success": False, "error": f"Rapport non trouvé avec l'ID: {rapport_id}"}), 404

        # Empêcher l'ajustement si le rapport est déjà validé
        if rapport.statut == "Validé":
            return jsonify({"success": False, "error": "Impossible d'ajuster un rapport déjà validé."}), 400

        data = request.get_json()
        if not data:
            return jsonify({"success": False, "error": "Aucune donnée fournie pour l'ajustement."}), 400

        # --- DEBUGGING START (keep for now, remove after successful fix) ---
        print(f"DEBUG: Type of rapport.anomalies before update: {type(rapport.anomalies)}")
        if hasattr(Rapport, '_fields') and 'anomalies' in Rapport._fields:
            field_type = Rapport._fields['anomalies'].__class__.__name__
            print(f"DEBUG: Declared type of 'anomalies' in Rapport model: {field_type}")
            if isinstance(Rapport._fields['anomalies'], ListField):
                print(f"DEBUG: Inner field type of 'anomalies' (if ListField): {Rapport._fields['anomalies'].field.__class__.__name__}")
        else:
            print("DEBUG: 'anomalies' field definition not found or _fields not accessible.")

        new_anomalies = data.get('anomalies', [])
        print(f"DEBUG: Type of 'new_anomalies' from request: {type(new_anomalies)}")
        print(f"DEBUG: Value of 'new_anomalies' from request: {new_anomalies}")
        # --- DEBUGGING END ---

        # Exemple de correction: Vider les anomalies ou les remplacer par des anomalies corrigées
        # Le frontend enverra le nouveau tableau d'anomalies (qui est maintenant une liste de chaînes)
        rapport.anomalies = new_anomalies

        # Vous pourriez aussi permettre la modification d'autres champs si nécessaire
        # rapport.resume_facture = data.get('resume_facture', rapport.resume_facture)
        # rapport.resume_releve = data.get('resume_releve', rapport.resume_releve)
        # rapport.resultat_verification = data.get('resultat_verification', rapport.resultat_verification)

        # Mettre à jour le statut à 'Ajusté'
        rapport.statut = "Ajusté"
        rapport.derniere_maj = datetime.now(timezone.utc)
        rapport.save() # This is where the save happens

        # --- RESPONSE DATA DEFINITION - THIS WAS MISSING OR MISPLACED ---
        # Retourner les données mises à jour du rapport (simplifié pour la table)
        response_data = {
            "id": str(rapport.id),
            "titre": rapport.titre,
            "date_generation": rapport.date_generation.isoformat() if rapport.date_generation else None,
            "date_creation": rapport.date_creation.isoformat() if rapport.date_creation else None,
            "derniere_maj": rapport.derniere_maj.isoformat() if rapport.derniere_maj else None,
            "statut": rapport.statut,
            "anomalies": rapport.anomalies, # This will now be the list of strings
            "anomalies_count": len(rapport.anomalies),
            "has_anomalies": len(rapport.anomalies) > 0,
            "facture": { # Pour la table, renvoyer les infos facture/banque nécessaires
                "id": str(rapport.facture.id) if rapport.facture else None,
                "numero": getattr(rapport.facture, 'numero', 'N/A') if rapport.facture else getattr(rapport.resume_facture, 'numero', 'N/A'),
                "emetteur": getattr(rapport.facture, 'emetteur', 'N/A') if rapport.facture else getattr(rapport.resume_facture, 'emetteur', 'N/A'),
            },
            "banque": {
                "id": str(rapport.banque.id) if rapport.banque else None,
                "nom_banque": getattr(rapport.banque, 'nom', 'N/A') if rapport.banque else getattr(rapport.resume_releve, 'nom', 'N/A'),
                "numero_compte": getattr(rapport.banque, 'numero_compte', 'N/A') if rapport.banque else getattr(rapport.resume_releve, 'numero_compte', 'N/A'),
            }
        }
        # --- END RESPONSE DATA DEFINITION ---

        return jsonify({"success": True, "data": response_data}), 200

    except DoesNotExist:
        # This DoesNotExist specifically refers to the rapport not being found by its ID
        # or a dereference error if a linked document (Facture/Banque) is missing.
        current_app.logger.error(f"Rapport ou document lié non trouvé pour l'ID: {rapport_id}")
        return jsonify({"success": False, "error": "Rapport non trouvé ou document lié manquant."}), 404
    except ValidationError as e:
        print(f"DEBUG: Caught ValidationError: {str(e)}")
        current_app.logger.error(f"Données de rapport invalides pour l'ajustement: {str(e)}")
        return jsonify({"success": False, "error": f"Données de rapport invalides: {str(e)}"}), 400
    except Exception as e:
        current_app.logger.error(f"Erreur interne du serveur lors de l'ajustement du rapport {rapport_id}: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"success": False, "error": f"Erreur interne du serveur lors de l'ajustement: {str(e)}"}), 500

@app.route('/api/dashboard/finance', methods=['GET'])
def financial_dashboard():
    """Endpoint pour les tableaux de bord financiers avec données agrégées"""
    try:
        # 1. Récupérer les paramètres
        date_range = request.args.get('dateRange', 'last30days')
        banque_id = request.args.get('banque_id', 'all')

        # 2. Déterminer la plage de dates
        end_date = datetime.now()
        if date_range == 'last7days':
            start_date = end_date - timedelta(days=7)
        elif date_range == 'last30days':
            start_date = end_date - timedelta(days=30)
        elif date_range == 'last90days':
            start_date = end_date - timedelta(days=90)
        else:
            # Par défaut, aller très loin en arrière si le dateRange n'est pas reconnu
            start_date = datetime(2000, 1, 1)

        # 3. Construire les filtres basés sur votre modèle
        filters = {'created_at__gte': start_date, 'created_at__lte': end_date}
        
        if banque_id != 'all':
            try:
                filters['banque'] = ObjectId(banque_id)
            except Exception as e:
                return jsonify({"error": "ID banque invalide", "details": str(e)}), 400

        # 4. Requêtes de base
        # CHANGEMENT ICI : Utilisation de Rapport.objects
        rapports = Rapport.objects(**filters)
        total_rapports = rapports.count()

        # 5. Compter les statuts selon votre modèle
        # CHANGEMENT ICI : Utilisation de Rapport.objects
        rapports_complets = Rapport.objects(
            **{**filters, 'statut': 'complet'}
        ).count()
        
        # CHANGEMENT ICI : Utilisation de Rapport.objects
        rapports_anomalies = Rapport.objects(
            **{**filters, 'statut': 'anomalie'}
        ).count()

        # 6. Données pour graphiques
        # a. Répartition par statut
        statut_distribution = {
            'complet': rapports_complets,
            'anomalie': rapports_anomalies,
            'incomplet': total_rapports - rapports_complets - rapports_anomalies
        }

        # b. Évolution mensuelle
        monthly_stats = []
        # Assurez-vous que start_date est au début du mois pour un calcul correct
        current_month = start_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        while current_month <= end_date:
            # Calculer le début du mois suivant
            year = current_month.year
            month = current_month.month
            if month == 12:
                next_month = datetime(year + 1, 1, 1)
            else:
                next_month = datetime(year, month + 1, 1)

            month_filter = {
                'created_at__gte': current_month,
                'created_at__lt': next_month # Important: utiliser < pour exclure le début du mois suivant
            }
            if banque_id != 'all':
                month_filter['banque'] = ObjectId(banque_id)
                
            # CHANGEMENT ICI : Utilisation de Rapport.objects
            total = Rapport.objects(**month_filter).count()
            # CHANGEMENT ICI : Utilisation de Rapport.objects
            complet = Rapport.objects(**{**month_filter, 'statut': 'complet'}).count()
            # CHANGEMENT ICI : Utilisation de Rapport.objects
            anomalie = Rapport.objects(**{**month_filter, 'statut': 'anomalie'}).count()
            
            monthly_stats.append({
                'label': f"{current_month.month}/{current_month.year}",
                'total': total,
                'complet': complet,
                'anomalie': anomalie
            })
            current_month = next_month

        # c. Top anomalies depuis verification_result
        top_anomalies = []
        try:
            anomaly_counter = Counter()
            # CHANGEMENT ICI : Itération sur rapports
            for rap in rapports:
                # Assurez-vous que 'verification_result' et 'anomalies' existent dans votre modèle Rapport
                anomalies = rap.verification_result.get('anomalies', [])
                anomaly_counter.update(anomalies)
            
            top_anomalies = [{'anomalie': a, 'count': c} 
                             for a, c in anomaly_counter.most_common(5)]
        except Exception as e:
            print(f"Erreur calcul anomalies: {str(e)}")
            top_anomalies = [{"anomalie": "Données indisponibles", "count": 0}]

        # 7. Préparer la réponse selon votre modèle
        response_data = {
            "metadata": {
                "date_range": date_range,
                "periode": f"{start_date.strftime('%Y-%m-%d')} à {end_date.strftime('%Y-%m-%d')}",
                "banque_id": banque_id,
                "total_reconciliations": total_rapports # Le nom de la clé peut rester 'total_reconciliations' si votre frontend l'attend
            },
            "metrics": {
                "taux_completude": (rapports_complets / total_rapports * 100) if total_rapports > 0 else 0,
                "taux_anomalies": (rapports_anomalies / total_rapports * 100) if total_rapports > 0 else 0,
                "avg_processing_time": "N/A" # Vous devrez calculer cela si vous avez une métrique de temps de traitement dans Rapport
            },
            "charts": {
                "statut_distribution": statut_distribution,
                "monthly_trends": {
                    "labels": [m['label'] for m in monthly_stats],
                    "datasets": [
                        {"label": "Total", "data": [m['total'] for m in monthly_stats]},
                        {"label": "Complets", "data": [m['complet'] for m in monthly_stats]},
                        {"label": "Anomalies", "data": [m['anomalie'] for m in monthly_stats]}
                    ]
                },
                "top_anomalies": top_anomalies
            },
            "recent_activity": [
                {
                    "id": str(r.id),
                    "date": r.created_at.strftime("%Y-%m-%d"),
                    "facture": r.invoice_data.get("numero", "N/A"), # Assurez-vous que 'invoice_data' et 'numero' existent
                    "banque": r.statement_data.get("banque", "N/A"), # Assurez-vous que 'statement_data' et 'banque' existent
                    "statut": r.statut,
                    "montant": r.invoice_data.get("montant_total", 0) # Assurez-vous que 'invoice_data' et 'montant_total' existent
                }
                for r in rapports.order_by("-created_at").limit(5)
            ]
        }

        return jsonify(response_data)

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({
            "error": "Erreur lors de la génération du dashboard",
            "details": str(e)
        }), 500  
if __name__ == '__main__':
    print("Démarrage de l'application...")
    app.run(host='0.0.0.0', port=5000, debug=True)