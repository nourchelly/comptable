
def verify_payment(invoice_data, bank_data):
    """Vérifie si le paiement de la facture figure dans le relevé bancaire"""
    result = {
        "correspondance_trouvee": False,
        "details": []
    }
    
    if not invoice_data.get("montant_total") or not bank_data.get("transactions"):
        result["details"].append("Données insuffisantes pour vérifier")
        return result
    
    invoice_amount = float(invoice_data["montant_total"])
    
    # Chercher des transactions avec le même montant
    matching_transactions = []
    for transaction in bank_data["transactions"]:
        try:
            transaction_amount = abs(float(transaction["montant"]))
            if abs(transaction_amount - invoice_amount) < 0.01:  # Arrondi possible
                matching_transactions.append(transaction)
        except ValueError:
            continue
    
    if matching_transactions:
        result["correspondance_trouvee"] = True
        result["details"].append(f"Paiement(s) identifié(s) de {invoice_amount} euros")
        for tx in matching_transactions:
            result["details"].append(f"Transaction du {tx['date']} - {tx['description']}")
    else:
        # Chercher des transactions similaires (à 5% près)
        similar_transactions = []
        for transaction in bank_data["transactions"]:
            try:
                transaction_amount = abs(float(transaction["montant"]))
                if abs(transaction_amount - invoice_amount) / invoice_amount < 0.05:
                    similar_transactions.append({
                        "transaction": transaction,
                        "ecart": abs(transaction_amount - invoice_amount)
                    })
            except (ValueError, ZeroDivisionError):
                continue
        
        if similar_transactions:
            result["details"].append("Transactions similaires trouvées (écart < 5%):")
            for item in similar_transactions:
                tx = item["transaction"]
                result["details"].append(f"Transaction du {tx['date']} - {tx['description']} - Montant: {tx['montant']} (écart: {item['ecart']:.2f})")
        else:
            result["details"].append(f"Aucun paiement correspondant au montant de {invoice_amount} euros trouvé dans le relevé")
    
    return result