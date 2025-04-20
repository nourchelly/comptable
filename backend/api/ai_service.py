# api/ai_service.py
import os
import google.generativeai as genai
from django.conf import settings

class GeminiAI:
    def __init__(self):
        genai.configure(api_key=settings.GOOGLE_AI_API_KEY)
        self.model = genai.GenerativeModel(
            model_name="gemini-1.5-pro-latest",
            generation_config=self._get_generation_config(),
            safety_settings=self._get_safety_settings()
        )
    
    def _get_generation_config(self):
        return {
            "temperature": 1,
            "top_p": 0.95,
            "top_k": 0,
            "max_output_tokens": 8192,
        }
    
    def _get_safety_settings(self):
        return [
            {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
            {
        "category": "HARM_CATEGORY_HATE_SPEECH",
        "threshold": "BLOCK_MEDIUM_AND_ABOVE"
    },
    {
        "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
        "threshold": "BLOCK_MEDIUM_AND_ABOVE"
    },
    {
        "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
        "threshold": "BLOCK_MEDIUM_AND_ABOVE"
    },
            # ... autres paramètres de sécurité
        ]
    
    def generate_response(self, prompt):
        convo = self.model.start_chat(history=[])
        response = convo.send_message(prompt)
        return response.text