
from flask import Flask, request, jsonify,make_response
import google.generativeai as genai
from flask_mongoengine import MongoEngine
from mongoengine import connect
import sys
import traceback
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
from datetime import datetime, timedelta  # Ajout de l'import manquant
import pytesseract  # Pour l'OCR
from pdf2image import convert_from_path  # Pour convertir PDF en images
from PIL import Image  # Pour manipuler les images
import io

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
    # Conversion en niveaux de gris
    gray = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2GRAY)
    
    # Débruitage
    denoised = cv2.fastNlMeansDenoising(gray, h=30, templateWindowSize=7, searchWindowSize=21)
    
    # Seuillage adaptatif
    thresh = cv2.adaptiveThreshold(denoised, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
                                 cv2.THRESH_BINARY, 11, 2)
    
    # Amélioration de la netteté
    kernel = np.array([[-1,-1,-1], [-1,9,-1], [-1,-1,-1]])
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



def extract_invoice_data_with_ai(text):
    """Prompt amélioré pour documents non standard"""
    prompt = f"""
Analyse ce document commercial et essaie d'en extraire les informations. Ce document pourrait être:
1. Une facture classique
2. Un relevé bancaire
3. Un bon de commande
4. Un document administratif

Pour les factures, cherche ces informations:
- Numéro (N° facture, Invoice No)
- Dates (facture, échéance)
- Montants (HT, TVA, TTC)
- Noms (fournisseur, client)
- Lignes de produits

Même si les informations sont incomplètes, renvoie TOUT ce que tu trouves sous forme JSON.

Format de réponse REQUIS:
{{
    "type": "facture|releve|inconnu",
    "emetteur": "nom ou null",
    "client": "nom ou null",
    "numero": "numéro ou null",
    "date": "JJ/MM/AAAA ou null",
    "montant_total": "nombre ou null",
    "montant_ht": "nombre ou null",
    "contenu_analyse": "résumé texte de ce que tu as identifié"
}}

Texte à analyser (500 premiers caractères):
{text[:500]}

Attention:
- Ne renvoie QUE du JSON valide
- Si vraiment rien n'est identifiable, renvoie au moins le type de document
"""

    try:
        print("Envoi du texte de la facture à Gemini pour extraction structurée")
        print(f"Longueur du texte envoyé: {len(text)} caractères")
        response = model.generate_content(prompt)
        print(f"Réponse reçue de Gemini: {len(response.text)} caractères")
        
        # Extraction du JSON depuis la réponse (peut inclure des backticks en Markdown)
        json_text = response.text.strip()
        if json_text.startswith("```json"):
            json_text = json_text.replace("```json", "").replace("```", "").strip()
        elif json_text.startswith("```"):
            json_text = json_text.replace("```", "").strip()
        
        # Afficher le JSON brut pour diagnostic
        print(f"JSON brut extrait: {json_text[:200]}...")
        
        # Charger et valider le JSON
        try:
            invoice_data = json.loads(json_text)
            print(f"Données structurées extraites avec succès: {list(invoice_data.keys())}")
            return invoice_data
        except json.JSONDecodeError as je:
            print(f"Erreur JSON: {str(je)}")
            print(f"JSON problématique: {json_text}")
            # En cas d'échec JSON, utiliser l'extraction par regex
            print("Repli sur extraction regex")
            return extract_invoice_data(text)
    except Exception as e:
        print(f"Erreur d'extraction AI: {str(e)}")
        import traceback
        traceback.print_exc()
        # En cas d'échec, utiliser l'extraction par regex comme solution de secours
        return extract_invoice_data(text)

def extract_invoice_data(text):
    """Extrait les données structurées d'une facture (méthode regex de secours)"""
    # Utilisation d'expressions régulières pour extraire les informations clés
    invoice_data = {
        "emetteur": None,
        "client": None,
        "numero": None,
        "date": None,
        "montant_ht": None,
        "tva": None,
        "montant_total": None,
        "mode_paiement": None,
        "echeance": None,
        "lignes": []
    }
    
    # Extraction des informations de base
    emetteur_match = re.search(r"(?:Émetteur|Fournisseur|Vendeur)[:\s]*(.*?)(?:\n|$)", text, re.IGNORECASE)
    if emetteur_match:
        invoice_data["emetteur"] = emetteur_match.group(1).strip()
    
    client_match = re.search(r"(?:Client|Acheteur|Destinataire|Facturer à)[:\s]*(.*?)(?:\n|$)", text, re.IGNORECASE)
    if client_match:
        invoice_data["client"] = client_match.group(1).strip()
    
    num_match = re.search(r"(?:Facture\s*N°|N°\s*Facture|Numéro)[:\s]*([A-Z0-9\-_\/]+)", text, re.IGNORECASE)
    if num_match:
        invoice_data["numero"] = num_match.group(1).strip()
    
    date_match = re.search(r"(?:Date\s*de\s*facturation|Date\s*facture|Date)[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})", text)
    if date_match:
        invoice_data["date"] = date_match.group(1).strip()
    
    # Montants
    montant_ht_match = re.search(r"(?:Total\s*HT|Montant\s*HT)[:\s]*([\d\s,\.]+)\s*[€$]", text, re.IGNORECASE)
    if montant_ht_match:
        invoice_data["montant_ht"] = float(montant_ht_match.group(1).replace(',', '.').replace(' ', ''))
    
    tva_match = re.search(r"(?:Total\s*TVA|TVA|Montant\s*TVA)[:\s]*([\d\s,\.]+)\s*[€$]", text, re.IGNORECASE)
    if tva_match:
        invoice_data["tva"] = float(tva_match.group(1).replace(',', '.').replace(' ', ''))
    
    montant_match = re.search(r"(?:Total\s*TTC|Montant\s*Total|Total\s*à\s*payer|TOTAL)[:\s]*([\d\s,\.]+)\s*[€$]", text, re.IGNORECASE)
    if montant_match:
        invoice_data["montant_total"] = float(montant_match.group(1).replace(',', '.').replace(' ', ''))
    
    # Mode de paiement et échéance
    paiement_match = re.search(r"(?:Mode\s*de\s*paiement|Paiement)[:\s]*(.*?)(?:\n|$)", text, re.IGNORECASE)
    if paiement_match:
        invoice_data["mode_paiement"] = paiement_match.group(1).strip()
    
    echeance_match = re.search(r"(?:Date\s*d['']échéance|Échéance|À\s*payer\s*avant\s*le)[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})", text, re.IGNORECASE)
    if echeance_match:
        invoice_data["echeance"] = echeance_match.group(1).strip()
    
    # Tentative d'extraction des lignes de facture (simplifiée)
    pattern = r"(\d+)\s+([^\n]+?)\s+([\d,\.]+)\s*(?:€|EUR)?\s*([\d,\.]+)%?\s*([\d,\.]+)\s*(?:€|EUR)"
    lines = re.findall(pattern, text)
    for line in lines:
        try:
            invoice_data["lignes"].append({
                "description": line[1].strip(),
                "quantite": int(line[0]),
                "prix_unitaire": float(line[2].replace(',', '.')),
                "montant": float(line[4].replace(',', '.'))
            })
        except (ValueError, IndexError):
            pass
    
    return invoice_data

def detect_bank_statement_data(text):
    """Détecte si le document est un relevé bancaire et extrait ses données"""
    # Mots clés typiques d'un relevé bancaire
    bank_keywords = ["relevé de compte", "relevé bancaire", "opérations", "solde", "crédit", "débit"]
    is_statement = any(keyword in text.lower() for keyword in bank_keywords)
    
    if is_statement:
        return extract_bank_statement_data(text)
    else:
        return None

def extract_bank_statement_data(text):
    """Version optimisée pour l'extraction des relevés bancaires"""
    # Nouveau pattern plus robuste pour les opérations
    operation_pattern = re.compile(
        r"(?P<date>\d{2}/\d{2}/\d{4})\s+"  # Date
        r"(?P<libelle>.+?)\s+"             # Libellé
        r"(?P<debit>[\d\s,]+\.\d{2})?\s*"  # Débit (optionnel)
        r"(?P<credit>[\d\s,]+\.\d{2})?\s*" # Crédit (optionnel)
    )

    data = {
        "type": "bank_statement",
        "banque": extract_field(text, r"Banque\s*:\s*(.*)"),
        "compte": extract_field(text, r"Compte\s*:\s*(.*)"),
        "titulaire": extract_field(text, r"Titulaire\s*:\s*(.*)"),
        "periode": extract_period(text),
        "solde_initial": extract_amount(text, r"Solde initial\s*:\s*([\d\s,]+\.\d{2})"),
        "solde_final": extract_amount(text, r"Solde final\s*:\s*([\d\s,]+\.\d{2})"),
        "devise": "TND",  # Par défaut
        "operations": []
    }

    # Extraction des opérations
    for match in operation_pattern.finditer(text):
        debit = match.group("debit")
        credit = match.group("credit")
        
        operation = {
            "date": match.group("date"),
            "libelle": match.group("libelle").strip(),
            "debit": float(debit.replace(" ", "").replace(",", "")) if debit else 0.0,
            "credit": float(credit.replace(" ", "").replace(",", "")) if credit else 0.0
        }
        operation["montant"] = operation["credit"] or -operation["debit"]
        
        data["operations"].append(operation)

    return data

def extract_field(text, pattern):
    """Helper pour extraire un champ simple"""
    match = re.search(pattern, text, re.IGNORECASE)
    return match.group(1).strip() if match else None

def extract_amount(text, pattern):
    """Helper pour extraire un montant"""
    match = re.search(pattern, text)
    if not match:
        return None
    return float(match.group(1).replace(" ", "").replace(",", ""))

def extract_period(text):
    """Helper pour extraire la période"""
    match = re.search(r"Période\s*:\s*(\d{2}/\d{2}/\d{4})\s*au\s*(\d{2}/\d{2}/\d{4})", text)
    return f"{match.group(1)} au {match.group(2)}" if match else None
def is_bank_statement(text):
    """Détection plus précise des relevés bancaires"""
    required_keywords = [
        "relevé bancaire",
        "titulaire",
        "banque",
        "période",
        "solde final",
        "date",
        "libellé",
        ("débit", "crédit")  # Au moins un des deux
    ]
    
    text_lower = text.lower()
    
    # Vérification des mots-clés obligatoires
    checks = [
        any(kw in text_lower for kw in keywords) 
        if isinstance(keywords, tuple)
        else keywords in text_lower
        for keywords in required_keywords
    ]
    
    return all(checks)

def detect_anomalies(document_data, doc_type):
    """Détecte les anomalies dans les données extraites"""
    anomalies = []
    
    if doc_type == "invoice":
        # Vérifications de base (champs manquants)
        if not document_data.get("montant_total"):
            anomalies.append("Montant total manquant")
        if not document_data.get("date"):
            anomalies.append("Date de facturation manquante")
        if not document_data.get("numero"):
            anomalies.append("Numéro de facture manquant")
        if not document_data.get("emetteur"):
            anomalies.append("Émetteur de la facture manquant")
        if not document_data.get("client"):
            anomalies.append("Client destinataire manquant")
        
        # Vérification des montants incohérents
        if document_data.get("montant_total") and document_data.get("lignes"):
            total_calculé = sum(ligne.get("montant", 0) for ligne in document_data["lignes"])
            if abs(document_data["montant_total"] - total_calculé) > 0.01:  # Tolérance de 0.01
                anomalies.append(f"Montant total incohérent: {document_data['montant_total']} vs somme des lignes {total_calculé}")
        
        # Vérification des doublons dans les numéros de ligne/référence
        if document_data.get("lignes"):
            refs = [ligne.get("reference") for ligne in document_data["lignes"] if ligne.get("reference")]
            nums = [ligne.get("numero") for ligne in document_data["lignes"] if ligne.get("numero")]
            
            # Vérification des références en double
            refs_count = Counter(refs)
            for ref, count in refs_count.items():
                if count > 1:
                    anomalies.append(f"Référence produit en double: {ref} ({count} occurrences)")
            
            # Vérification des numéros de ligne en double
            nums_count = Counter(nums)
            for num, count in nums_count.items():
                if count > 1:
                    anomalies.append(f"Numéro de ligne en double: {num} ({count} occurrences)")
        
        # Vérification de date incohérente (date dans le futur ou trop ancienne)
        if document_data.get("date"):
            try:
                date_facture = parse_date(document_data["date"])
                if date_facture:
                    now = datetime.now()
                    if date_facture > now:
                        anomalies.append(f"Date de facture dans le futur: {document_data['date']}")
                    if date_facture < now - timedelta(days=365*2):  # Plus de 2 ans
                        anomalies.append(f"Date de facture très ancienne: {document_data['date']}")
            except Exception:
                pass  # Erreur de parsing déjà traitée ailleurs
    
    elif doc_type == "bank_statement":
        # Vérifications de base
        if not document_data.get("solde_final"):
            anomalies.append("Solde final manquant")
        if not document_data.get("operations"):
            anomalies.append("Aucune opération trouvée")
        
        # Vérification des soldes incohérents
        if document_data.get("solde_initial") is not None and document_data.get("solde_final") is not None and document_data.get("operations"):
            total_operations = sum(op.get("montant", 0) for op in document_data["operations"])
            solde_calculé = document_data.get("solde_initial", 0) + total_operations
            if abs(document_data["solde_final"] - solde_calculé) > 0.1:  # Tolérance plus large pour les écarts bancaires
                anomalies.append(f"Solde final incohérent: {document_data['solde_final']} vs calculé {solde_calculé}")
        
        # Vérification des opérations en double
        if document_data.get("operations"):
            # On crée une signature pour chaque opération (date + montant + début de la description)
            signatures = []
            for op in document_data["operations"]:
                if op.get("date") and op.get("montant") and op.get("description"):
                    # Signature simplifiée pour détecter les doublons potentiels
                    signature = f"{op['date']}_{op['montant']}_{op['description'][:20]}"
                    signatures.append(signature)
            
            # Vérification des signatures en double
            sig_count = Counter(signatures)
            for sig, count in sig_count.items():
                if count > 1:
                    anomalies.append(f"Possible opération en double: {sig} ({count} occurrences)")
        
        # Vérification des dates incohérentes ou non chronologiques
        if document_data.get("operations") and len(document_data["operations"]) > 0:
            dates = []
            for op in document_data["operations"]:
                if op.get("date"):
                    date_op = parse_date(op["date"])
                    if date_op:
                        dates.append((date_op, op["date"]))
            
            if dates:
                # Vérification des dates dans le futur
                now = datetime.now()
                future_dates = [date_str for date_obj, date_str in dates if date_obj > now]
                if future_dates:
                    anomalies.append(f"Dates d'opérations dans le futur: {', '.join(future_dates[:3])}")
                
                # Vérification de l'ordre chronologique
                sorted_dates = sorted(dates, key=lambda x: x[0])
                if sorted_dates != dates:
                    anomalies.append("Opérations non triées par ordre chronologique")
    
    return anomalies

def match_invoice_with_statement(invoice_data, statement_data):
    """Effectue le rapprochement entre facture et relevé bancaire"""
    verification = {
        "paiement_trouve": False,
        "montant_correspond": False,
        "date_correspond": False,
        "anomalies": [],
        "paiements_potentiels": [],  # Pour stocker les paiements qui pourraient correspondre
        "doublons_detection": False   # Pour indiquer si des doublons ont été détectés
    }
    
    print(f"Début du rapprochement facture/relevé")
    
    invoice_amount = invoice_data.get("montant_total")
    invoice_date = invoice_data.get("date")
    invoice_num = invoice_data.get("numero")
    invoice_emetteur = invoice_data.get("emetteur", "").lower() if invoice_data.get("emetteur") else ""
    
    print(f"Facture: montant={invoice_amount}, date={invoice_date}, numéro={invoice_num}, émetteur={invoice_emetteur}")
    print(f"Relevé: {len(statement_data.get('operations', []))} opérations à comparer")
    
    if not invoice_amount:
        verification["anomalies"].append("Montant de facture manquant")
        print("ÉCHEC: Montant de facture manquant")
        return verification
    
    # Préparation pour la détection de doublons potentiels
    matching_operations = []
    date_comparison_anomalies = set()  # Utiliser un set pour éviter les doublons
    
    # Recherche du paiement dans les opérations du relevé
    for i, operation in enumerate(statement_data.get("operations", [])):
        op_desc = operation.get("description", "").lower() if operation.get("description") else ""
        op_amount = operation.get("montant")
        op_date = operation.get("date")
        
        print(f"Opération {i+1}: montant={op_amount}, date={op_date}, desc={op_desc[:30]}...")
        
        match_score = 0  # Score de correspondance pour cette opération
        match_details = {}  # Détails de la correspondance
        
        # Vérification du montant avec tolérance augmentée (2%)
        if op_amount is not None and invoice_amount:  # Vérifier que la valeur n'est pas None
            # Éviter les montants nuls ou quasi-nuls
            if abs(op_amount) < 0.01:
                continue
                
            # Le paiement sera négatif dans le relevé bancaire (débit)
            op_amount_abs = abs(op_amount)
            
            # Calcul de la différence en pourcentage, avec protection contre la division par zéro
            if invoice_amount > 0:
                difference_pct = abs((op_amount_abs - invoice_amount) / invoice_amount * 100)
            else:
                difference_pct = 100  # Si le montant de facture est 0, la différence est de 100%
            
            if difference_pct < 2.0:  # Tolérance de 2%
                print(f"✓ Montant correspond (différence: {difference_pct:.2f}%)")
                match_score += 40  # Forte pondération pour le montant
                match_details["montant"] = True
                match_details["difference_pct"] = difference_pct
                
                # Pour les anomalies d'écart
                if difference_pct > 0.1:  # Un écart existe mais acceptable
                    match_details["ecart"] = True
                    match_details["ecart_valeur"] = op_amount_abs - invoice_amount
                    # Stocker l'anomalie dans match_details pour l'ajouter uniquement si ce paiement est retenu
                    match_details["ecart_message"] = f"Écart de paiement: {match_details['ecart_valeur']:.2f} ({difference_pct:.2f}%)"
            elif difference_pct < 10.0:  # Écart important mais potentiellement lié (augmenté à 10%)
                print(f"? Montant proche (différence: {difference_pct:.2f}%)")
                match_score += 10
                match_details["montant_proche"] = True
                match_details["difference_pct"] = difference_pct
        
        # Vérification de l'émetteur dans la description
        if invoice_emetteur and op_desc:
            # Recherche de l'émetteur dans la description
            if invoice_emetteur in op_desc:
                print(f"✓ Nom émetteur trouvé dans la description")
                match_score += 20
                match_details["emetteur"] = True
        
        # Vérification du numéro de facture dans la description
        if invoice_num and op_desc:
            # Recherche du numéro de facture, même partielle
            digits_only = re.sub(r'\D', '', invoice_num)
            if (invoice_num.lower() in op_desc or 
                (digits_only and len(digits_only) >= 3 and digits_only in re.sub(r'\D', '', op_desc))):
                print(f"✓ Référence facture trouvée dans la description")
                match_score += 30  # Forte pondération pour le numéro
                match_details["reference"] = True
        
        # Vérification de la date
        if invoice_date and op_date:
            try:
                inv_date = parse_date(invoice_date)
                op_date_obj = parse_date(op_date)
                
                if inv_date and op_date_obj:
                    # Accepter le paiement jusqu'à 90 jours après la facture
                    if op_date_obj >= inv_date and op_date_obj <= inv_date + timedelta(days=90):
                        print(f"✓ Date cohérente: facture {inv_date.date()} <= paiement {op_date_obj.date()}")
                        match_score += 20
                        match_details["date"] = True
                    # Paiement avant facture = anomalie potentielle, mais moins grave
                    elif op_date_obj < inv_date:
                        print(f"? Date potentiellement incohérente: paiement {op_date_obj.date()} avant facture {inv_date.date()}")
                        match_details["date_avant_facture"] = True
                        # Ne stocke cette anomalie que si on n'a pas d'autres matches
                        date_comparison_anomalies.add(f"Possible paiement avant émission de la facture le {op_date_obj.date()}")
                    # Paiement très tardif = possible erreur
                    elif op_date_obj > inv_date + timedelta(days=90):
                        print(f"! Paiement tardif: {(op_date_obj - inv_date).days} jours après facture")
                        match_details["paiement_tardif"] = True
                        match_details["tardif_message"] = f"Paiement effectué {(op_date_obj - inv_date).days} jours après émission"
            except Exception as e:
                print(f"Erreur lors de la comparaison des dates: {str(e)}")
        
        # Augmenter le score pour les opérations plus proches de la date de facture
        if "date" in match_details and inv_date and op_date_obj:
            days_diff = abs((op_date_obj - inv_date).days)
            if days_diff <= 30:  # Bonus pour les paiements dans les 30 jours
                bonus = max(0, 10 - days_diff // 3)  # Maximum 10 points pour un paiement immédiat
                match_score += bonus
                match_details["proximity_bonus"] = bonus
        
        # Si cette opération a un score de correspondance suffisant OU si le montant correspond exactement
        if match_score >= 30 or match_details.get("montant", False):  # Seuil abaissé et exception pour les montants exacts
            matching_operations.append({
                "operation": operation,
                "score": match_score,
                "details": match_details
            })
    
    # Analyse des résultats
    if matching_operations:
        # Tri par score de correspondance (descendant)
        matching_operations.sort(key=lambda x: x["score"], reverse=True)
        
        # Vérification des doublons potentiels (plusieurs paiements pour la même facture)
        if len(matching_operations) > 1:
            verification["doublons_detection"] = True
            verification["anomalies"].append(f"Plusieurs paiements potentiels trouvés pour cette facture ({len(matching_operations)})")
            print(f"! ALERTE: {len(matching_operations)} paiements potentiels trouvés")
        
        # On prend le meilleur match
        best_match = matching_operations[0]
        verification["paiements_potentiels"] = [
            {
                "montant": m["operation"].get("montant"),
                "date": m["operation"].get("date"),
                "description": m["operation"].get("description"),
                "score": m["score"]
            } for m in matching_operations[:3]  # Limiter aux 3 meilleurs matches
        ]
        
        # Ajouter les anomalies spécifiques au meilleur match
        if "ecart_message" in best_match["details"]:
            verification["anomalies"].append(best_match["details"]["ecart_message"])
        if "tardif_message" in best_match["details"]:
            verification["anomalies"].append(best_match["details"]["tardif_message"])
            
        # Mise à jour du résultat de vérification
        verification["paiement_trouve"] = True
        verification["montant_correspond"] = best_match["details"].get("montant", False)
        verification["montant_proche"] = best_match["details"].get("montant_proche", False)
        verification["date_correspond"] = best_match["details"].get("date", False)
        verification["meilleur_score"] = best_match["score"]
    else:
        # Si aucun match, inclure les anomalies de dates seulement si pertinentes
        if date_comparison_anomalies and len(date_comparison_anomalies) <= 2:  # Limiter le nombre
            verification["anomalies"].extend(date_comparison_anomalies)
        verification["anomalies"].append("Aucun paiement correspondant trouvé")
    
    print(f"Résultat du rapprochement: {verification}")
    return verification

def parse_date(date_str):
    """Tente de parser une date dans différents formats courants"""
    formats = [
        "%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y", "%d.%m.%Y",
        "%d/%m/%y", "%Y/%m/%d", "%m/%d/%Y", "%d %b %Y",
        "%d %B %Y", "%d-%b-%Y", "%d-%B-%Y"
    ]
    
    for fmt in formats:
        try:
            return datetime.strptime(date_str, fmt)
        except ValueError:
            continue
    
    return None
def analyze_with_ai(invoice_text, statement_text, invoice_data, statement_data, verification_result):
    """Utilise l'IA pour analyser la comparaison entre facture et relevé"""
    
    structured_data = {
        "facture": invoice_data,
        "releve": statement_data,
        "verification": verification_result
    }
    
    prompt = f"""Analyse la comparaison entre cette facture et ce relevé bancaire:

DONNÉES STRUCTURÉES EXTRAITES:
{json.dumps(structured_data, indent=2, ensure_ascii=False)}

TEXTE ORIGINAL DE LA FACTURE:
{invoice_text[:1500]}

TEXTE ORIGINAL DU RELEVÉ BANCAIRE:
{statement_text[:1500]}

Fais une analyse détaillée en 4 parties:
1. Résumé de la facture (émetteur, montant, date)
2. Vérification du paiement dans le relevé bancaire
3. Anomalies éventuelles (écarts,doublons,montants différents, dates incohérentes)
4. Conclusion: La facture est-elle correctement payée? Faut-il faire une action?

Formate ta réponse en sections clairement délimitées et reste factuel.
"""

    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"Erreur lors de l'analyse AI: {str(e)}"
def generate_reconciliation_report(invoice_data, statement_data, verification_result, analysis, invoice_anomalies=None, statement_anomalies=None):
    """Génère un rapport structuré de rapprochement"""
    report = {
        "metadata": {
            "date_generation": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "statut": "complet" if not verification_result.get("anomalies") and not invoice_anomalies and not statement_anomalies else "incomplet"
        },
        "facture": {
            "emetteur": invoice_data.get("emetteur"),
            "client": invoice_data.get("client"),
            "numero": invoice_data.get("numero"),
            "date": invoice_data.get("date"),
            "montant_total": invoice_data.get("montant_total"),
            "echeance": invoice_data.get("echeance"),
            "anomalies": invoice_anomalies if invoice_anomalies else []
        },
        "releve": {
            "banque": statement_data.get("banque"),
            "compte": statement_data.get("compte"),
            "periode": statement_data.get("periode"),
            "solde_final": statement_data.get("solde_final"),
            "anomalies": statement_anomalies if statement_anomalies else []
        },
        "rapprochement": {
            "paiement_trouve": verification_result.get("paiement_trouve", False),
            "montant_correspond": verification_result.get("montant_correspond", False),
            "date_correspond": verification_result.get("date_correspond", False),
            "operation_correspondante": find_matching_operation(invoice_data, statement_data),
            "anomalies": verification_result.get("anomalies", [])
        },
        "analyse_ia": analysis,
        "recommandations": generate_recommendations(verification_result)
    }
    return report

def find_matching_operation(invoice_data, statement_data):
    """Trouve l'opération correspondante dans le relevé"""
    if not statement_data.get("operations"):
        return None
    
    for op in statement_data["operations"]:
        # Vérification par numéro de facture
        if invoice_data.get("numero"):
            invoice_num_clean = re.sub(r'\W+', '', invoice_data["numero"]).lower()
            op_desc_clean = re.sub(r'\W+', '', op.get("libelle", "")).lower()
            if invoice_num_clean in op_desc_clean:
                return op
        
        # Vérification par montant (avec tolérance de 2%)
        if invoice_data.get("montant_total") and op.get("montant"):
            amount_diff = abs(abs(op["montant"]) - invoice_data["montant_total"])
            if amount_diff / invoice_data["montant_total"] < 0.02:
                return op
    
    return None

def generate_recommendations(verification_result):
    """Génère des recommandations basées sur les anomalies"""
    recommendations = []
    
    if not verification_result["paiement_trouve"]:
        recommendations.append("Vérifier manuellement le relevé bancaire - le paiement n'a pas été trouvé")
    
    if verification_result["montant_correspond"] and not verification_result["paiement_trouve"]:
        recommendations.append("Un montant correspondant a été trouvé mais sans référence à la facture - vérifier la description de l'opération")
    
    if not verification_result["date_correspond"]:
        recommendations.append("La date de paiement semble antérieure à la date de facture - vérifier les dates")
    
    if not recommendations:
        recommendations.append("Aucune action requise - le paiement est confirmé")
    
    return recommendations

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
    # Validation du type de fichier
    if not file.filename.lower().endswith('.pdf'):
        return jsonify({"error": "Seuls les fichiers PDF sont acceptés"}), 400
    
    filename = secure_filename(file.filename)
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(filepath)
    
    try:
        text = extract_text_from_pdf(filepath)
        print("Texte brut extrait:", text[:500] + "...")  # Debug

        # Validation minimale du texte
        if len(text.strip()) < 20:
            return jsonify({
                "error": "Document vide ou non lisible",
                "debug": f"Texte extrait: {text[:200]}"
            }), 400
        
        # Détection automatique améliorée
        if is_bank_statement(text):
            doc_type = "bank_statement"
            data = extract_bank_statement_data(text)
            anomalies = detect_anomalies(data, "bank_statement")
        else:
            doc_type = "invoice"
            data = extract_invoice_data_with_ai(text)
            anomalies = detect_anomalies(data, "invoice")
        
        return jsonify({
            "success": True,
            "type": doc_type,
            "data": data,
            "anomalies": anomalies,
            "text_preview": text[:500] + "..."
        })
    
    except Exception as e:
        return jsonify({"error": f"Erreur lors du traitement: {str(e)}"}), 500
    finally:
        if os.path.exists(filepath):
            os.remove(filepath)  # Nettoyage du fichier temporaire

@app.route('/api/compare-documents', methods=['POST'])
def compare_documents():
    """Compare une facture et un relevé bancaire"""
    print("\n----- DÉBUT COMPARE DOCUMENTS -----")
    print("Headers reçus:", request.headers)
    print("Méthode:", request.method)
    print("Clés des fichiers:", list(request.files.keys()) if request.files else "Aucun fichier")

    # Vérifier si les fichiers sont présents
    if 'invoice' not in request.files:
        print("ERREUR: Fichier 'invoice' manquant")
        return jsonify({"error": "Fichier facture manquant"}), 400

    if 'statement' not in request.files:
        print("ERREUR: Fichier 'statement' manquant")
        return jsonify({"error": "Fichier relevé bancaire manquant"}), 400

    invoice_file = request.files['invoice']
    statement_file = request.files['statement']

    # Vérifier si les noms de fichiers sont valides
    print(f"Nom facture: {invoice_file.filename}, Type: {invoice_file.content_type}")
    print(f"Nom relevé: {statement_file.filename}, Type: {statement_file.content_type}")

    if invoice_file.filename == '':
        print("ERREUR: Nom de facture vide")
        return jsonify({"error": "Nom de facture vide"}), 400

    if statement_file.filename == '':
        print("ERREUR: Nom de relevé vide")
        return jsonify({"error": "Nom de relevé vide"}), 400

    # Sauvegarder les fichiers
    try:
        invoice_path = os.path.join(app.config['UPLOAD_FOLDER'], secure_filename(invoice_file.filename))
        statement_path = os.path.join(app.config['UPLOAD_FOLDER'], secure_filename(statement_file.filename))

        print(f"Chemin sauvegarde facture: {invoice_path}")
        print(f"Chemin sauvegarde relevé: {statement_path}")

        invoice_file.save(invoice_path)
        print("Facture sauvegardée avec succès")

        statement_file.save(statement_path)
        print("Relevé sauvegardé avec succès")

        # Vérifier que les fichiers existent bien
        if not os.path.exists(invoice_path):
            print(f"ERREUR: Fichier facture non trouvé après sauvegarde: {invoice_path}")
            return jsonify({"error": "Erreur lors de la sauvegarde de la facture"}), 500

        if not os.path.exists(statement_path):
            print(f"ERREUR: Fichier relevé non trouvé après sauvegarde: {statement_path}")
            return jsonify({"error": "Erreur lors de la sauvegarde du relevé"}), 500

        print("Tous les fichiers sauvegardés et vérifiés")

        # Suite du traitement
        try:
            print("Début extraction texte facture")
            invoice_text = extract_text_from_pdf(invoice_path)
            print(f"Texte facture extrait ({len(invoice_text)} caractères)")

            print("Début extraction texte relevé")
            statement_text = extract_text_from_pdf(statement_path)
            print(f"Texte relevé extrait ({len(statement_text)} caractères)")

            print("Début extraction données structurées facture avec AI")
            invoice_data = extract_invoice_data_with_ai(invoice_text)
            print("Données facture extraites:", invoice_data.keys() if invoice_data else "ÉCHEC")

            print("Début extraction données structurées relevé")
            statement_data = extract_bank_statement_data(statement_text)
            print("Données relevé extraites:", statement_data.keys() if statement_data else "ÉCHEC")

            print("Début détection d'anomalies facture")
            invoice_anomalies = detect_anomalies(invoice_data, "invoice")
            print(f"Anomalies facture: {invoice_anomalies}")

            print("Début détection d'anomalies relevé")
            statement_anomalies = detect_anomalies(statement_data, "bank_statement")
            print(f"Anomalies relevé: {statement_anomalies}")

            print("Début rapprochement automatique")
            verification_result = match_invoice_with_statement(invoice_data, statement_data)
            print(f"Résultat rapprochement: {verification_result}")

            print("Début analyse AI")
            analysis = analyze_with_ai(invoice_text, statement_text, invoice_data, statement_data, verification_result)
            print("Analyse AI terminée")

            # Génération du rapport complet
            print("Début génération du rapport")
            full_report = generate_reconciliation_report(
                invoice_data,
                statement_data,
                verification_result,
                analysis,
                invoice_anomalies=invoice_anomalies,  # Inclure les anomalies de la facture
                statement_anomalies=statement_anomalies # Inclure les anomalies du relevé
            )
            

            # Récupérer les IDs de la facture et de la banque depuis la requête
            facture_id = request.form.get('facture_id')
            banque_id = request.form.get('banque_id')

            if not facture_id or not banque_id:
                print("ERREUR: IDs de facture ou de banque manquants dans la requête")
                return jsonify({"error": "IDs de facture et de banque requis"}), 400

            # Récupérer les objets Facture et Banque depuis la base de données
            facture_obj = Facture.objects(id=facture_id).first()
            banque_obj = Banque.objects(id=banque_id).first()

            if not facture_obj or not banque_obj:
                print("ERREUR: Facture ou banque non trouvée avec les IDs fournis")
                return jsonify({"error": "Facture ou banque non trouvée"}), 404

            # Sauvegarde de l'objet Reconciliation
            reconciliation = Reconciliation(
                facture=facture_obj,
                banque=banque_obj,
                invoice_data=invoice_data,
                statement_data=statement_data,
                verification_result=verification_result,
                analysis=analysis,
                report=full_report,
                created_at=datetime.now()
            )
            reconciliation.save()
            titre_rapport = f"Rapprochement {facture_obj.numero} - {banque_obj.numero}"
            statut_rapport = "complet" if verification_result["paiement_trouve"] else "incomplet"
            
            if verification_result.get("anomalies") and len(verification_result["anomalies"]) > 0:
                statut_rapport = "anomalie"
            
            rapport = Rapport(
                facture=facture_obj,
                banque=banque_obj,
                reconciliation=reconciliation,
                titre=titre_rapport,
                statut=statut_rapport,
                resume_facture={
                    "emetteur": invoice_data.get("emetteur"),
                    "numero": invoice_data.get("numero"),
                    "date": invoice_data.get("date"),
                    "montant_total": invoice_data.get("montant_total")
                },
                resume_releve={
                    "banque": statement_data.get("banque"),
                    "compte": statement_data.get("compte"),
                    "periode": statement_data.get("periode")
                },
                resultat_verification={
                    "paiement_trouve": verification_result.get("paiement_trouve", False),
                    "montant_correspond": verification_result.get("montant_correspond", False),
                    "date_correspond": verification_result.get("date_correspond", False)
                },
                anomalies=verification_result.get("anomalies", []),
                recommendations=generate_recommendations(verification_result),
                analyse_texte=analysis,
                rapport_complet=full_report
            )
            rapport.save()
            print(f"Rapport sauvegardé avec ID: {rapport.id}")
        
            # Construction de la réponse finale
            response_data = {
                "invoice_data": invoice_data,
                "statement_data": statement_data,
                "invoice_anomalies": invoice_anomalies,
                "statement_anomalies": statement_anomalies,
                "verification": verification_result,
                "analysis": analysis,
                "full_report": full_report,
                "reconciliation_id": str(reconciliation.id),
                "rapport_id": str(rapport.id)
            }

            print("Rapport généré et reconciliation sauvegardée avec succès")
            return jsonify(response_data)

        except Exception as e:
            print(f"ERREUR pendant le traitement: {str(e)}")
            import traceback
            traceback.print_exc()
            return jsonify({"error": f"Erreur lors du traitement: {str(e)}"}), 500

    except Exception as e:
        print(f"ERREUR lors de la préparation des fichiers: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

    finally:
        print("Nettoyage des fichiers")
        # Supprimer les fichiers temporaires
        if 'invoice_path' in locals() and os.path.exists(invoice_path):
            os.remove(invoice_path)
            print(f"Fichier facture supprimé: {invoice_path}")

        if 'statement_path' in locals() and os.path.exists(statement_path):
            os.remove(statement_path)
            print(f"Fichier relevé supprimé: {statement_path}")

        print("----- FIN COMPARE DOCUMENTS -----\n")
# Route pour l'interface utilisateur

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
    """Récupère un rapport spécifique par son ID"""
    try:
        # Validation de l'ID
        if not rapport_id:
            return jsonify({"error": "ID de rapport manquant"}), 400
            
        # Récupération du rapport
        rapport = Rapport.objects(id=rapport_id).first()
        
        if not rapport:
            return jsonify({"error": f"Rapport non trouvé avec l'ID: {rapport_id}"}), 404
        
        # Construction de la réponse
        response_data = {
            "id": str(rapport.id),
            "titre": rapport.titre,
            "date_generation": rapport.date_generation.strftime("%Y-%m-%d %H:%M:%S"),
            "statut": rapport.statut,
            "facture": {
                "id": str(rapport.facture.id),
                "numero": rapport.facture.numero,
                "emetteur": rapport.facture.emetteur if hasattr(rapport.facture, 'emetteur') else "Non spécifié"
            },
            "banque": {
                "id": str(rapport.banque.id),
                "numero": rapport.banque.numero
            },
            "resume_facture": rapport.resume_facture,
            "resume_releve": rapport.resume_releve,
            "resultat_verification": rapport.resultat_verification,
            "anomalies": rapport.anomalies,
            "recommendations": rapport.recommendations,
            "analyse_texte": rapport.analyse_texte,
            "rapport_complet": rapport.rapport_complet
        }
        
        return jsonify(response_data)
        
    except Exception as e:
        print(f"Erreur lors de la récupération du rapport: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Erreur lors de la récupération du rapport: {str(e)}"}), 500


@app.route('/api/rapports', methods=['GET'])
def get_rapports():
    """Récupère la liste des rapports avec filtres"""
    try:
        # Paramètres de filtrage
        statut = request.args.get('statut')
        facture_id = request.args.get('facture_id')
        banque_id = request.args.get('banque_id')
        
        # Construction de la requête de base
        query = {}
        
        if statut:
            query['statut'] = statut
        if facture_id:
            try:
                query['facture'] = ObjectId(facture_id)
            except:
                return jsonify({"success": False, "error": "ID facture invalide"}), 400
        if banque_id:
            try:
                query['banque'] = ObjectId(banque_id)
            except:
                return jsonify({"success": False, "error": "ID banque invalide"}), 400

        # Récupération des rapports avec gestion des références
        rapports = Rapport.objects(**query).order_by('-date_generation')
        
        # Formatage des résultats
        results = []
        for rapport in rapports:
            try:
                # Récupération des données liées
                facture_data = {
                    "id": str(rapport.facture.id),
                    "numero": rapport.facture.numero,
                    "emetteur": getattr(rapport.facture, 'emetteur', 'Inconnu')
                } if rapport.facture else None
                
                banque_data = {
                    "id": str(rapport.banque.id),
                    "numero": rapport.banque.numero,
                    "nom": getattr(rapport.banque, 'nom', 'Inconnu')
                } if rapport.banque else None
                
                results.append({
                    "id": str(rapport.id),
                    "titre": rapport.titre,
                    "date_generation": rapport.date_generation.isoformat(),
                    "statut": rapport.statut,
                    "facture": facture_data,
                    "banque": banque_data,
                    "anomalies_count": len(rapport.anomalies),
                    "has_anomalies": len(rapport.anomalies) > 0
                })
                
            except Exception as e:
                print(f"Erreur de formatage pour le rapport {str(rapport.id)}: {str(e)}")
                continue
        
        return jsonify({
            "success": True,
            "count": len(results),
            "data": results
        })
        
    except Exception as e:
        print(f"Erreur dans get_rapports: {str(e)}")
        return jsonify({
            "success": False,
            "error": "Erreur serveur",
            "message": str(e),
            "data": []  # Retourne un tableau vide en cas d'erreur

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
@app.route('/api/rapports/<rapport_id>/excel', methods=['GET'])
def generate_rapport_excel(rapport_id):
    """Génère un fichier Excel pour un rapport spécifique"""
    try:
        # Récupérer le rapport depuis la base de données
        rapport = Rapport.objects(id=rapport_id).first()
        if not rapport:
            return jsonify({"error": f"Rapport non trouvé avec l'ID: {rapport_id}"}), 404

        # Préparer les données pour le DataFrame pandas
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

        # Créer un buffer pour stocker le fichier Excel en mémoire
        output = BytesIO()
        df.to_excel(output, index=False, sheet_name='Rapport')
        output.seek(0)

        # Préparer la réponse avec le bon type MIME
        response = make_response(output.getvalue())
        response.headers['Content-Type'] = 'application/vnd.ms-excel'
        response.headers['Content-Disposition'] = f'attachment; filename=rapport-{rapport_id}.xlsx'

        return response

    except Exception as e:
        print(f"Erreur lors de la génération de l'Excel: {str(e)}")
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
    """Met à jour les informations d'un rapport spécifique."""
    try:
        rapport = Rapport.objects.get(id=rapport_id)
        data = request.get_json()

        # Valider et mettre à jour les champs du rapport en fonction des données reçues
        if 'titre' in data:
            rapport.titre = data['titre']
        if 'statut' in data:
            rapport.statut = data['statut']
        if 'resume_facture' in data:
            rapport.resume_facture = data['resume_facture']
        if 'resume_releve' in data:
            rapport.resume_releve = data['resume_releve']
        if 'anomalies' in data:
            rapport.anomalies = data['anomalies']
        if 'recommendations' in data:
            rapport.recommendations = data['recommendations']
        if 'analyse_texte' in data:
            rapport.analyse_texte = data['analyse_texte']
        if 'rapport_complet' in data:
            rapport.rapport_complet = data['rapport_complet']
        # Vous pouvez ajouter ici la logique pour mettre à jour d'autres champs
        # y compris potentiellement les objets liés comme 'facture' et 'banque'

        rapport.save()
        return jsonify({"message": f"Rapport avec l'ID {rapport_id} mis à jour avec succès."}), 200
    except DoesNotExist:
        return jsonify({"error": f"Rapport non trouvé avec l'ID: {rapport_id}"}), 404
    except Exception as e:
        print(f"Erreur lors de la mise à jour du rapport: {str(e)}")
        return jsonify({"error": f"Erreur lors de la mise à jour du rapport: {str(e)}"}), 500  

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
            start_date = datetime(2000, 1, 1)

        # 3. Construire les filtres basés sur votre modèle
        filters = {'created_at__gte': start_date, 'created_at__lte': end_date}
        
        if banque_id != 'all':
            try:
                filters['banque'] = ObjectId(banque_id)
            except:
                return jsonify({"error": "ID banque invalide"}), 400

        # 4. Requêtes de base
        reconciliations = Reconciliation.objects(**filters)
        total_reconciliations = reconciliations.count()

        # 5. Compter les statuts selon votre modèle
        rapprochements_complets = Reconciliation.objects(
            **{**filters, 'statut': 'complet'}
        ).count()
        
        rapprochements_anomalies = Reconciliation.objects(
            **{**filters, 'statut': 'anomalie'}
        ).count()

        # 6. Données pour graphiques
        # a. Répartition par statut
        statut_distribution = {
            'complet': rapprochements_complets,
            'anomalie': rapprochements_anomalies,
            'incomplet': total_reconciliations - rapprochements_complets - rapprochements_anomalies
        }

        # b. Évolution mensuelle
        monthly_stats = []
        current_month = start_date.replace(day=1)
        while current_month <= end_date:
            next_month = (current_month + timedelta(days=32)).replace(day=1)
            month_filter = {
                'created_at__gte': current_month,
                'created_at__lt': next_month
            }
            if banque_id != 'all':
                month_filter['banque'] = ObjectId(banque_id)
                
            total = Reconciliation.objects(**month_filter).count()
            complet = Reconciliation.objects(**{**month_filter, 'statut': 'complet'}).count()
            anomalie = Reconciliation.objects(**{**month_filter, 'statut': 'anomalie'}).count()
            
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
            for rec in Reconciliation.objects(**filters):
                anomalies = rec.verification_result.get('anomalies', [])
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
                "total_reconciliations": total_reconciliations
            },
            "metrics": {
                "taux_completude": (rapprochements_complets / total_reconciliations * 100) if total_reconciliations > 0 else 0,
                "taux_anomalies": (rapprochements_anomalies / total_reconciliations * 100) if total_reconciliations > 0 else 0,
                "avg_processing_time": "N/A"
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
                    "facture": r.invoice_data.get("numero", "N/A"),
                    "banque": r.statement_data.get("banque", "N/A"),
                    "statut": r.statut,
                    "montant": r.invoice_data.get("montant_total", 0)
                }
                for r in reconciliations.order_by("-created_at").limit(5)
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