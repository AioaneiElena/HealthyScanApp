import requests
import re
import time
from services.price_extractors import extrage_pret_din_link  # pentru scraping

API_KEY = "AIzaSyC3YVbeQ9S4u29Mc1fjcBp5T41VblE7j2E"
CX_ID = "b2cff23a6d5a64c3e"

def adauga_pret_si_sorteaza(rezultate: list[dict]) -> list[dict]:
    rezultate_filtrate = []
    for prod in rezultate:
        # Filtrează doar rezultatele care conțin "borsec" în titlu/link
        if 'borsec' in prod['titlu'].lower() or 'borsec' in prod['link'].lower():
            rezultate_filtrate.append(prod)

    for i, produs in enumerate(rezultate):
        link = produs.get("link")
        if not link:
            continue

        try:
            pret = extrage_pret_din_link(link)
        except Exception as e:
            print(f"❌ Eroare la extragere preț pentru {link}: {e}")
            pret = None

        produs["pret"] = pret

        if pret is not None:
            rezultate_filtrate.append(produs)

        # 🛡️ Protecție anti-blocking
        time.sleep(1)  # Poți reduce la 0.5 sau crește la 2 dacă primești blocări

    print(f"🔍 Din {len(rezultate)} produse, {len(rezultate_filtrate)} au preț real extras.")
    return sorted(rezultate_filtrate, key=lambda p: p["pret"])

def search_google_cse(query: str):
    url = "https://www.googleapis.com/customsearch/v1"
    params = {
        "key": API_KEY,
        "cx": CX_ID,
        "q": query
    }

    response = requests.get(url, params=params)
    if response.status_code != 200:
        print("❌ Eroare CSE:", response.text)
        return []

    data = response.json()
    print("📡 CSE URL:", response.url)
    print("📄 Total rezultate brute:", len(data.get("items", [])))

    return [
        {
            "titlu": item.get("title"),
            "link": item.get("link"),
            "descriere": item.get("snippet"),
            "imagine": item.get("pagemap", {}).get("cse_image", [{}])[0].get("src")
        }
        for item in data.get("items", [])
    ]
