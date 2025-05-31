import requests
import re
import time
from services.price_extractors import extrage_pret_din_link  

API_KEY = "AIzaSyC3YVbeQ9S4u29Mc1fjcBp5T41VblE7j2E"
CX_ID = "b2cff23a6d5a64c3e"

def adauga_pret_si_sorteaza(rezultate: list[dict]) -> list[dict]:
    for produs in rezultate:
        link = produs.get("link")
        if not link:
            produs["pret"] = None
            continue

        try:
            pret = extrage_pret_din_link(link)
        except Exception as e:
            print(f"❌ Eroare la extragere preț pentru {link}: {e}")
            pret = None

        produs["pret"] = pret

        time.sleep(1)  

    rezultate_sortate = sorted(
        rezultate,
        key=lambda p: p["pret"] if p["pret"] is not None else float("inf")
    )

    total_extrase = sum(1 for p in rezultate if p["pret"] is not None)
    print(f"🔍 Din {len(rezultate)} produse, {total_extrase} au preț real extras.")
    return rezultate_sortate


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
