import re

def extract_invoice_data(text):
    """Extrait les données structurées d'une facture"""
    data = {
        "numero_facture": None,
        "date_facture": None,
        "montant_total": None,
        "montant_ht": None,
        "tva": None,
        "fournisseur": None,
        "references_client": None,
        "lignes_facture": []
    }
    
    # Détection du numéro de facture
    invoice_patterns = [
        r"(?i)facture\s*[n°no]*[.:]*\s*([A-Z0-9\-/_]+)",
        r"(?i)invoice\s*[n°no]*[.:]*\s*([A-Z0-9\-/_]+)",
        r"(?i)n°\s*facture\s*:?\s*([A-Z0-9\-/_]+)",
        r"(?i)N°\s*([A-Z0-9\-/_]+)"
    ]
    
    for pattern in invoice_patterns:
        match = re.search(pattern, text)
        if match:
            data["numero_facture"] = match.group(1).strip()
            break
    
    # Détection de la date
    date_patterns = [
        r"(?i)date\s*d[e']?[^:]*\s*facture\s*:?\s*(\d{1,2}[/.]\d{1,2}[/.]\d{2,4})",
        r"(?i)date\s*:?\s*(\d{1,2}[/.]\d{1,2}[/.]\d{2,4})",
        r"(?i)émise le\s*:?\s*(\d{1,2}[/.]\d{1,2}[/.]\d{2,4})",
        r"(\d{1,2}[/.]\d{1,2}[/.]\d{2,4})"
    ]
    
    for pattern in date_patterns:
        match = re.search(pattern, text)
        if match:
            data["date_facture"] = match.group(1).strip()
            break
    
    # Détection du montant total
    total_patterns = [
        r"(?i)montant\s*total\s*(?:ttc)?:?\s*[€$]?\s*(\d+[.,]\d{2})",
        r"(?i)total\s*(?:ttc)?:?\s*[€$]?\s*(\d+[.,]\d{2})",
        r"(?i)à\s*payer\s*:?\s*[€$]?\s*(\d+[.,]\d{2})",
        r"(?i)net\s*à\s*payer\s*:?\s*[€$]?\s*(\d+[.,]\d{2})"
    ]
    
    for pattern in total_patterns:
        match = re.search(pattern, text)
        if match:
            data["montant_total"] = match.group(1).replace(",", ".").strip()
            break
    
    # Détection du montant HT
    ht_patterns = [
        r"(?i)total\s*ht\s*:?\s*[€$]?\s*(\d+[.,]\d{2})",
        r"(?i)montant\s*ht\s*:?\s*[€$]?\s*(\d+[.,]\d{2})",
        r"(?i)sous-total\s*:?\s*[€$]?\s*(\d+[.,]\d{2})"
    ]
    
    for pattern in ht_patterns:
        match = re.search(pattern, text)
        if match:
            data["montant_ht"] = match.group(1).replace(",", ".").strip()
            break
    
    # Détection de la TVA
    tva_patterns = [
        r"(?i)tva\s*(?:\d+[,.]\d+%)?(?:\s*:)?\s*[€$]?\s*(\d+[.,]\d{2})",
        r"(?i)montant\s*tva\s*:?\s*[€$]?\s*(\d+[.,]\d{2})"
    ]
    
    for pattern in tva_patterns:
        match = re.search(pattern, text)
        if match:
            data["tva"] = match.group(1).replace(",", ".").strip()
            break
    
    # Détection du fournisseur (premiers mots du document, souvent)
    lines = text.split('\n')
    for i in range(min(5, len(lines))):
        if len(lines[i].strip()) > 3 and not re.match(r"^\s*$", lines[i]):
            data["fournisseur"] = lines[i].strip()
            break
    
    return data
