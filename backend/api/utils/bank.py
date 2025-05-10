import re

def extract_bank_statement_data(text):
    """Extrait les données structurées d'un relevé bancaire"""
    data = {
        "numero_compte": None,
        "date_releve": None,
        "solde_initial": None,
        "solde_final": None,
        "nom_titulaire": None,
        "transactions": []
    }
    
    # Détection du numéro de compte
    account_patterns = [
        r"(?i)compte\s*n°\s*:?\s*(\w+\s*\d+)",
        r"(?i)compte\s*:?\s*(\w+\s*\d+)",
        r"(?i)iban\s*:?\s*([A-Z0-9\s]+)",
        r"(?i)numéro\s*de\s*compte\s*:?\s*(\w+\s*\d+)"
    ]
    
    for pattern in account_patterns:
        match = re.search(pattern, text)
        if match:
            data["numero_compte"] = match.group(1).strip()
            break
    
    # Détection de la date du relevé
    date_patterns = [
        r"(?i)relevé\s*du\s*(\d{1,2}[/.]\d{1,2}[/.]\d{2,4})",
        r"(?i)date\s*:?\s*(\d{1,2}[/.]\d{1,2}[/.]\d{2,4})",
        r"(?i)édité\s*le\s*:?\s*(\d{1,2}[/.]\d{1,2}[/.]\d{2,4})"
    ]
    
    for pattern in date_patterns:
        match = re.search(pattern, text)
        if match:
            data["date_releve"] = match.group(1).strip()
            break
    
    # Détection du solde initial et final
    balance_patterns = [
        r"(?i)solde\s*(?:précédent|initial|ancien)\s*:?\s*[€$]?\s*(-?\d+[.,]\d{2})",
        r"(?i)solde\s*au\s*\d{1,2}[/.]\d{1,2}[/.]\d{2,4}\s*:?\s*[€$]?\s*(-?\d+[.,]\d{2})",
        r"(?i)solde\s*(?:nouveau|actuel|final)\s*:?\s*[€$]?\s*(-?\d+[.,]\d{2})",
        r"(?i)nouveau\s*solde\s*:?\s*[€$]?\s*(-?\d+[.,]\d{2})"
    ]
    
    # Pour le solde initial
    for i in range(0, 2):
        pattern = balance_patterns[i]
        match = re.search(pattern, text)
        if match:
            data["solde_initial"] = match.group(1).replace(",", ".").strip()
            break
    
    # Pour le solde final
    for i in range(2, 4):
        pattern = balance_patterns[i]
        match = re.search(pattern, text)
        if match:
            data["solde_final"] = match.group(1).replace(",", ".").strip()
            break
    
    # Essayer d'extraire les transactions (lignes avec dates et montants)
    transaction_pattern = r"(\d{1,2}[/.]\d{1,2})?\s+([A-Za-z0-9\s]{5,30}?)\s+(-?\d+[,.]\d{2})"
    
    # Chercher toutes les correspondances
    matches = re.findall(transaction_pattern, text)
    
    for match in matches:
        date, desc, amount = match
        if date and desc and amount:
            data["transactions"].append({
                "date": date.strip(),
                "description": desc.strip(),
                "montant": amount.replace(",", ".").strip()
            })
    
    # Limiter à 10 transactions pour la lisibilité
    data["transactions"] = data["transactions"][:10]
    
    return data