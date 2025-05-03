# test_gemini.py
import google.generativeai as genai

# Configuration
genai.configure(api_key="AIzaSyBqm2z_pcTDCU0ubeEMidJRohRkXDvlIsg")

model = genai.GenerativeModel(
    model_name="gemini-1.5-pro-latest",
    generation_config={
        "temperature": 0.9,
        "top_p": 0.95,
        "max_output_tokens": 8192,
    },
    safety_settings=[
        {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_ONLY_HIGH"},
        {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_ONLY_HIGH"},
    ]
)

def test_prompt(prompt):
    try:
        response = model.generate_content(prompt)
        print("=== Réponse ===")
        print(response.text)
        print("\n=== Métadonnées ===")
        print(f"Tokens utilisés: {response.usage_metadata}")
        return response
    except Exception as e:
        print(f"Erreur: {e}")
        return None

# Testez avec différents prompts
test_prompt("Résume l'œuvre 'Les Misérables' de Victor Hugo en 5 lignes")
test_prompt("Écris un poème de 4 vers sur l'intelligence artificielle en alexandrins")