import requests
import re

API_KEY = "AIzaSyC3YVbeQ9S4u29Mc1fjcBp5T41VblE7j2E"           # cheia ta de la Google Cloud
CX_ID = "b2cff23a6d5a64c3e"     # ID-ul motorului de căutare, nu linkul

def extrage_pret(text: str) -> float | None:
    pret_exp = re.compile(r'(\d{1,4}[.,]\d{1,2})\s?(lei|ron)?', flags=re.IGNORECASE)
    fragmente = text.lower().splitlines() + text.lower().split('. ')
    candidate_prices = []

    for frag in fragmente:
        if "garanție" in frag or "garantie" in frag:
            continue  # ignorăm frazele care menționează garanția

        matches = pret_exp.findall(frag)
        for match in matches:
            try:
                valoare = float(match[0].replace(",", "."))
                if valoare > 0.8:  # totuși ignorăm prețuri absurde de tip 0.3, 0.5
                    candidate_prices.append(valoare)
            except:
                continue

    return min(candidate_prices) if candidate_prices else None


def adauga_pret_si_sorteaza(rezultate: list[dict]) -> list[dict]:
    for produs in rezultate:
        text = f"{produs.get('titlu', '')} {produs.get('descriere', '')}"
        produs['pret'] = extrage_pret(text)

    rezultate_filtrate = [p for p in rezultate if p['pret'] is not None]
    return sorted(rezultate_filtrate, key=lambda p: p['pret'])


def search_google_cse(query: str):
    url = "https://www.googleapis.com/customsearch/v1"
    params = {
        "key": API_KEY,
        "cx": CX_ID,
        "q": query
    }

    response = requests.get(url, params=params)
    if response.status_code != 200:
        print("Eroare CSE:", response.text)
        return []

    data = response.json()
    print("📡 CSE URL:", response.url)
    print("📄 Răspuns JSON:", response.json())

    return [
        {
            "titlu": item.get("title"),
            "link": item.get("link"),
            "descriere": item.get("snippet"),
            "imagine": item.get("pagemap", {}).get("cse_image", [{}])[0].get("src")
        }
        for item in data.get("items", [])
    ]
