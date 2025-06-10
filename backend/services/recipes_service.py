import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()

API_KEY = "AIzaSyAgjC5Xw5HQyb9n71Yg5eRv-m2t-PTn9l4"  # 👈 direct în cod

genai.configure(api_key=API_KEY)
model = genai.GenerativeModel("gemini-1.5-flash")

def construieste_prompt(cos: list[str], dieta: str = "", scop: str = "", timp: str = "", context: str = ""):
    prompt = f"Am următoarele ingrediente: {', '.join(cos)}.\n"

    if dieta:
        prompt += f"Utilizatorul urmează o dietă {dieta}. "
    if scop:
        prompt += f"Scopul este: {scop}. "
    if timp:
        prompt += f"Timpul maxim de preparare dorit este: {timp}. "
    if context:
        prompt += f"Context: {context}. "

    prompt += """
Te rog să generezi o rețetă sănătoasă în formatul de mai jos (în română), fără a adăuga explicații în plus.

FORMAT:
Nume rețetă: ...
Timp: ... minute
Porții: ... persoane

Ingrediente:
- ...
- ...
- ...

Instrucțiuni:
1. ...
2. ...
3. ...

Sfaturi nutriționale:
* ...
* ...
"""
    return prompt


def genereaza_reteta(cos, dieta="", scop="", timp="", context=""):
    prompt = construieste_prompt(cos, dieta, scop, timp, context)
    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"Eroare la generare: {str(e)}"
