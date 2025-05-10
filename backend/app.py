
from flask import Flask, request, jsonify
import google.generativeai as genai
from flask_mongoengine import MongoEngine
from mongoengine import connect
from mongoengine.connection import get_db
import json
import os
from werkzeug.utils import secure_filename
from api.models import Facture, Banque 
import threading
import time
import PyPDF2
import re
from datetime import datetime
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
CORS(app)  # Autorise toutes les origines (à restreindre en prod)
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
    """Extrait le texte brut d'un fichier PDF avec OCR si nécessaire"""
    try:
        # D'abord essayer d'extraire le texte normalement
        with open(filepath, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            text = ""
            for page in reader.pages:
                page_text = page.extract_text() or ""
                text += page_text
            
            # Si peu ou pas de texte extrait, tenter l'OCR
            if len(text.strip()) < 100:  # Seuil arbitraire, à ajuster
                return extract_text_with_ocr(filepath)
            return text
    except Exception as e:
        print(f"Erreur extraction PDF standard: {str(e)}")
        # En cas d'échec, utiliser l'OCR
        return extract_text_with_ocr(filepath)

def extract_text_with_ocr(filepath):
    """Utilise OCR pour extraire le texte d'un PDF scanné"""
    try:
        text = ""
        # Convertir le PDF en images
        images = convert_from_path(filepath)
        
        for i, image in enumerate(images):
            # Traitement OCR sur chaque page
            page_text = pytesseract.image_to_string(image, lang='fra+eng')
            text += f"\n--- Page {i+1} ---\n{page_text}"
        
        return text
    except Exception as e:
        print(f"Erreur OCR: {str(e)}")
        return f"Erreur d'extraction OCR: {str(e)}"

def extract_invoice_data_with_ai(text):
    """Utilise Gemini pour extraire les données structurées de la facture"""
    prompt = f"""
Extrait les informations principales de cette facture et renvoie uniquement un objet JSON avec les champs suivants:
- emetteur: nom de l'entreprise qui émet la facture
- client: nom du client facturé
- numero: numéro de facture (obligatoire)
- date: date de facturation (format DD/MM/YYYY)
- montant_ht: montant hors taxes (nombre décimal)
- tva: montant de la TVA (nombre décimal)
- montant_total: montant TTC (nombre décimal)
- mode_paiement: mode de paiement indiqué
- echeance: date d'échéance (format DD/MM/YYYY)
- lignes: tableau des lignes de facturation, chacune avec:
    - description: description de l'article/service
    - quantite: quantité (nombre)
    - prix_unitaire: prix unitaire HT (nombre décimal)
    - montant: montant total de la ligne (nombre décimal)

Si certaines informations sont manquantes, laisse les champs correspondants à null.
Voici le texte de la facture:

{text}

Format de réponse: JSON uniquement, sans texte avant ou après.
"""

    
    try:
        response = model.generate_content(prompt)
        # Extraction du JSON depuis la réponse (peut inclure des backticks en Markdown)
        json_text = response.text.strip()
        if json_text.startswith("```json"):
            json_text = json_text.replace("```json", "").replace("```", "").strip()
        elif json_text.startswith("```"):
            json_text = json_text.replace("```", "").strip()
        
        # Charger et valider le JSON
        invoice_data = json.loads(json_text)
        return invoice_data
    except Exception as e:
        print(f"Erreur d'extraction AI: {str(e)}")
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
    """Extrait les données structurées d'un relevé bancaire"""
    statement_data = {
        "banque": None,
        "compte": None,
        "periode": None,
        "solde_initial": None,
        "solde_final": None,
        "operations": []
    }
    
    # Extraction des informations de base
    banque_match = re.search(r"(?:Banque|Établissement)[:\s]*(.*?)(?:\n|$)", text, re.IGNORECASE)
    if banque_match:
        statement_data["banque"] = banque_match.group(1).strip()
    
    compte_match = re.search(r"(?:Compte\s*N°|N°\s*Compte|Numéro\s*de\s*compte)[:\s]*([A-Z0-9\s\-]+)", text, re.IGNORECASE)
    if compte_match:
        statement_data["compte"] = compte_match.group(1).strip()
    
    periode_match = re.search(r"(?:Période|Du)\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\s*(?:au|à)\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})", text)
    if periode_match:
        statement_data["periode"] = f"{periode_match.group(1)} au {periode_match.group(2)}"
    
    solde_init_match = re.search(r"(?:Solde\s*initial|Ancien\s*solde)[:\s]*([\d\s,\.]+)\s*[€$]", text, re.IGNORECASE)
    if solde_init_match:
        statement_data["solde_initial"] = float(solde_init_match.group(1).replace(',', '.').replace(' ', ''))
    
    solde_final_match = re.search(r"(?:Solde\s*final|Nouveau\s*solde)[:\s]*([\d\s,\.]+)\s*[€$]", text, re.IGNORECASE)
    if solde_final_match:
        statement_data["solde_final"] = float(solde_final_match.group(1).replace(',', '.').replace(' ', ''))
    
    # Extraction des opérations (simplifiée)
    operations = re.finditer(r"(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\s+(.*?)\s+([\d\s,\.]+)\s*[€$]", text)
    for op in operations:
        statement_data["operations"].append({
            "date": op.group(1),
            "description": op.group(2).strip(),
            "montant": float(op.group(3).replace(',', '.').replace(' ', ''))
        })
    
    return statement_data

def detect_anomalies(document_data, doc_type):
    """Détecte les anomalies dans les données extraites"""
    anomalies = []
    
    if doc_type == "invoice":
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
    
    elif doc_type == "bank_statement":
        if not document_data.get("solde_final"):
            anomalies.append("Solde final manquant")
        if not document_data.get("operations"):
            anomalies.append("Aucune opération trouvée")
    
    return anomalies

def match_invoice_with_statement(invoice_data, statement_data):
    """Effectue le rapprochement entre facture et relevé bancaire"""
    verification = {
        "paiement_trouve": False,
        "montant_correspond": False,
        "date_correspond": False,
        "anomalies": []
    }
    
    invoice_amount = invoice_data.get("montant_total")
    invoice_date = invoice_data.get("date")
    invoice_num = invoice_data.get("numero")
    
    if not invoice_amount:
        verification["anomalies"].append("Montant de facture manquant")
        return verification
    
    # Recherche du paiement dans les opérations du relevé
    for operation in statement_data.get("operations", []):
        op_desc = operation["description"].lower()
        op_amount = operation["montant"]
        
        # Vérification du montant et de la référence à la facture
        if abs(abs(op_amount) - invoice_amount) < 0.01:  # Tolérance pour les arrondis
            verification["montant_correspond"] = True
            
            # Vérification de la référence à la facture dans la description
            if invoice_num and invoice_num.lower() in op_desc:
                verification["paiement_trouve"] = True
            
            # Vérification de la date (si disponible)
            if invoice_date:
                try:
                    inv_date = datetime.strptime(invoice_date, "%d/%m/%Y")
                    op_date = datetime.strptime(operation["date"], "%d/%m/%Y")
                    if op_date >= inv_date:  # Paiement après émission
                        verification["date_correspond"] = True
                except ValueError:
                    pass
    
    if not verification["paiement_trouve"]:
        verification["anomalies"].append("Aucun paiement correspondant trouvé")
    if not verification["montant_correspond"]:
        verification["anomalies"].append("Aucun montant correspondant trouvé")
    
    return verification

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
3. Anomalies éventuelles (montants différents, dates incohérentes)
4. Conclusion: La facture est-elle correctement payée? Faut-il faire une action?

Formate ta réponse en sections clairement délimitées et reste factuel.
"""

    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"Erreur lors de l'analyse AI: {str(e)}"

# Routes API
@app.route('/api/extract-document', methods=['POST'])
def extract_document():
    print("Requête reçue sur /api/extract-document")  # Debug
    print("Headers:", request.headers)  # Debug
    print("Fichiers:", request.files) 

    """Extrait les données d'un document (facture ou relevé)"""
    if 'file' not in request.files:
        return jsonify({"error": "Aucun fichier fourni"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "Nom de fichier vide"}), 400
    
    # Sauvegarde temporaire
    filename = secure_filename(file.filename)
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(filepath)
    
    try:
        text = extract_text_from_pdf(filepath)
        doc_type = request.form.get('type', 'auto')
        
        # Détection automatique du type
        if doc_type == "auto":
            if "facture" in text.lower() or "invoice" in text.lower():
                doc_type = "invoice"
            elif "releve" in text.lower() or "statement" in text.lower():
                doc_type = "bank_statement"
            else:
                doc_type = "unknown"
        
        # Extraction des données (sans sauvegarde en base)
        if doc_type == "invoice":
            data = extract_invoice_data_with_ai(text)
            anomalies = detect_anomalies(data, "invoice")
        elif doc_type == "bank_statement":
            data = extract_bank_statement_data(text)
            anomalies = detect_anomalies(data, "bank_statement")
        else:
            return jsonify({"error": "Type de document non reconnu"}), 400
        
        return jsonify({
            "type": doc_type,
            "data": data,
            "anomalies": anomalies,
            "text_preview": text[:500] + "..."
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500
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
            
            # Construction de la réponse
            response_data = {
                "invoice_data": invoice_data,
                "statement_data": statement_data,
                "invoice_anomalies": invoice_anomalies,
                "statement_anomalies": statement_anomalies,
                "verification": verification_result,
                "analysis": analysis
            }
            
            print("Réponse construite, envoi...")
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
@app.route('/')
def home():
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Comparaison Factures/Relevés</title>
        <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            h1 { color: #333; }
            .form-group { margin-bottom: 15px; }
            label { display: block; margin-bottom: 5px; }
            button { background: #4CAF50; color: white; padding: 10px 15px; border: none; cursor: pointer; }
            #result { margin-top: 20px; white-space: pre-wrap; background: #f5f5f5; padding: 15px; border-radius: 5px; }
            .section { margin-bottom: 20px; border-bottom: 1px solid #ddd; padding-bottom: 15px; }
            .anomaly { color: #d32f2f; font-weight: bold; }
        </style>
    </head>
    <body>
        <h1>Analyse de Factures et Relevés Bancaires</h1>
        
        <div class="form-group">
            <h2>Extraction d'un seul document</h2>
            <form id="extractForm" enctype="multipart/form-data">
                <div class="form-group">
                    <label>Fichier PDF:</label>
                    <input type="file" name="file" accept=".pdf" required>
                </div>
                <div class="form-group">
                    <label>Type de document:</label>
                    <select name="type">
                        <option value="auto">Détection automatique</option>
                        <option value="invoice">Facture</option>
                        <option value="bank">Relevé bancaire</option>
                    </select>
                </div>
                <button type="button" onclick="extractDocument()">Extraire les données</button>
            </form>
        </div>
        
        <div class="form-group">
            <h2>Comparaison Facture/Relevé</h2>
            <form id="compareForm" enctype="multipart/form-data">
                <div class="form-group">
                    <label>Facture (PDF):</label>
                    <input type="file" name="invoice" accept=".pdf" required>
                </div>
                <div class="form-group">
                    <label>Relevé bancaire (PDF):</label>
                    <input type="file" name="statement" accept=".pdf" required>
                </div>
                <button type="button" onclick="compareDocuments()">Comparer les documents</button>
            </form>
        </div>
        
        <div id="result"></div>
        
        <script>
            function extractDocument() {
                const form = document.getElementById('extractForm');
                const formData = new FormData(form);
                
                document.getElementById('result').innerHTML = 'Traitement en cours...';
                
                fetch('/api/extract-document', {
                    method: 'POST',
                    body: formData
                })
                .then(response => response.json())
                .then(data => {
                    let resultHTML = '<div class="section">';
                    
                    if (data.error) {
                        resultHTML += `<p class="anomaly">Erreur: ${data.error}</p>`;
                    } else {
                        resultHTML += `<h3>Résultat d'extraction (${data.type})</h3>`;
                        resultHTML += `<pre>${JSON.stringify(data.data, null, 2)}</pre>`;
                        
                        if (data.anomalies && data.anomalies.length > 0) {
                            resultHTML += '<h4>Anomalies détectées:</h4><ul>';
                            data.anomalies.forEach(anomaly => {
                                resultHTML += `<li class="anomaly">${anomaly}</li>`;
                            });
                            resultHTML += '</ul>';
                        }
                    }
                    
                    resultHTML += '</div>';
                    document.getElementById('result').innerHTML = resultHTML;
                })
                .catch(error => {
                    document.getElementById('result').innerHTML = `<p class="anomaly">Erreur: ${error}</p>`;
                });
            }
            
            function compareDocuments() {
                const form = document.getElementById('compareForm');
                const formData = new FormData(form);
                
                document.getElementById('result').innerHTML = 'Traitement en cours...';
                
                fetch('/api/compare-documents', {
                    method: 'POST',
                    body: formData
                })
                .then(response => response.json())
                .then(data => {
                    let resultHTML = '<div class="section">';
                    
                    if (data.error) {
                        resultHTML += `<p class="anomaly">Erreur: ${data.error}</p>`;
                    } else {
                        // Affichage des données extraites
                        resultHTML += '<h3>Données de la facture</h3>';
                        resultHTML += `<pre>${JSON.stringify(data.invoice_data, null, 2)}</pre>`;
                        
                        if (data.invoice_anomalies && data.invoice_anomalies.length > 0) {
                            resultHTML += '<h4>Anomalies dans la facture:</h4><ul>';
                            data.invoice_anomalies.forEach(anomaly => {
                                resultHTML += `<li class="anomaly">${anomaly}</li>`;
                            });
                            resultHTML += '</ul>';
                        }
                        
                        resultHTML += '<h3>Données du relevé bancaire</h3>';
                        resultHTML += `<pre>${JSON.stringify(data.statement_data, null, 2)}</pre>`;
                        
                        if (data.statement_anomalies && data.statement_anomalies.length > 0) {
                            resultHTML += '<h4>Anomalies dans le relevé:</h4><ul>';
                            data.statement_anomalies.forEach(anomaly => {
                                resultHTML += `<li class="anomaly">${anomaly}</li>`;
                            });
                            resultHTML += '</ul>';
                        }
                        
                        resultHTML += '<h3>Résultat du rapprochement</h3>';
                        resultHTML += `<pre>${JSON.stringify(data.verification, null, 2)}</pre>`;
                        
                        resultHTML += '<h3>Analyse détaillée</h3>';
                        resultHTML += `<div style="white-space: pre-line">${data.analysis}</div>`;
                    }
                    
                    resultHTML += '</div>';
                    document.getElementById('result').innerHTML = resultHTML;
                })
                .catch(error => {
                    document.getElementById('result').innerHTML = `<p class="anomaly">Erreur: ${error}</p>`;
                });
            }
        </script>
    </body>
    </html>
    """

if __name__ == '__main__':
    print("Démarrage de l'application...")
    app.run(host='0.0.0.0', port=5000, debug=True)