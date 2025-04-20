# services/validation_service.py
class AccountingValidator:
    def __init__(self):
        self.ai = GeminiHelper()
    
    def validate_entry(self, entry):
        prompt = f"""
        Vérifie cette écriture comptable et signale les anomalies:
        - Incohérences numériques
        - Format de date invalide
        - Comptes incorrects
        ---
        Compte Débit: {entry['debit_account']}
        Compte Crédit: {entry['credit_account']}
        Montant: {entry['amount']}
        Date: {entry['date']}
        Description: {entry['description']}
        """
        return self.ai.generate_response(prompt)