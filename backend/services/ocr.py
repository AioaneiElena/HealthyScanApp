import base64
import json
import re
import requests

API_KEY = "AIzaSyC3YVbeQ9S4u29Mc1fjcBp5T41VblE7j2E"  # cheia de la Google Vision API

# Liste de cuvinte ignorate în query (stopwords)
STOP_WORDS = {
    'apa', 'minerala', 'naturala', 'bautura', 'răcoritoare', 'eticheta', 'zero',
    'cu', 'fara', 'gust', 'calorii', 'plata', 'carbogazoasa', 'necarbogazoasa',
    'gramaj', 'produs', 'alimentar', 'litri', 'buc', 'gram', 'ml', 'l'
}

# Liste de branduri cunoscute 
BRANDURI = [
    "coca cola", "pepsi", "fanta", "sprite", "milka", "napolact", "dorna",
    "borsec", "ciucas", "carlsberg", "lays", "tide", "ariel", "heineken", "tuc"
]


def extract_query_from_image(image_bytes: bytes) -> str:
    # Codifică imaginea în base64
    base64_image = base64.b64encode(image_bytes).decode("utf-8")

    # Construiește cererea către Google Vision
    url = f"https://vision.googleapis.com/v1/images:annotate?key={API_KEY}"
    headers = {"Content-Type": "application/json"}
    body = {
        "requests": [
            {
                "image": {"content": base64_image},
                "features": [{"type": "TEXT_DETECTION"}]
            }
        ]
    }

    # Trimite requestul la Vision API
    response = requests.post(url, headers=headers, json=body)
    if response.status_code != 200:
        print("Eroare Google Vision:", response.text)
        return "produs necunoscut"

    # Extrage textul detectat
    data = response.json()
    try:
        text = data["responses"][0]["fullTextAnnotation"]["text"]
    except:
        text = data["responses"][0].get("textAnnotations", [{}])[0].get("description", "")

    # Curățare text
    text = text.lower()
    text = re.sub(r"[^\w\s]", "", text)  # elimină semne de punctuație
    cuvinte = text.split()

    # Eliminăm cuvinte scurte, cifre și stopwords
    relevante = [w for w in cuvinte if len(w) > 2 and not w.isdigit() and w not in STOP_WORDS]

    # Căutăm brandul dacă e în listă
    brand_detectat = ""
    for brand in BRANDURI:
        if brand in " ".join(relevante):
            brand_detectat = brand
            break

    # Căutăm gramaje
    cantitati = [w for w in cuvinte if re.match(r"^\d{1,4}(ml|l|g|kg)$", w)]

    # Formăm query-ul final
    query_parts = []
    if brand_detectat:
        query_parts.append(brand_detectat)
    query_parts += relevante[:3]  # luăm maxim 3 cuvinte relevante
    query_parts += cantitati[:1]  # și maxim o cantitate

    query = " ".join(query_parts).strip()
    return query if query else "produs necunoscut"
