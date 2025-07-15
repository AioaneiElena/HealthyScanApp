import requests
from urllib.parse import urlparse

API_KEY = "***"
CX_ID = "**"

MAGAZINE = [
    "kaufland.ro",
    "emag.ro",
    "carrefour.ro",
    "auchan.ro",
    "mega-image.ro",
    "selgros.ro",
    "metro.ro",
    "penny.ro",
    "profi.ro",
]

def search_google_cse(query: str, site: str = "") -> list[dict]:
    url = "https://www.googleapis.com/customsearch/v1"
    full_query = f"{query} site:{site}" if site else query

    params = {
        "key": API_KEY,
        "cx": CX_ID,
        "q": full_query
        
    }

    response = requests.get(url, params=params)
    if response.status_code != 200:
        print(f"Eroare CSE pentru {site}:", response.text)
        return []

    data = response.json()
    return [
        {
            "titlu": item.get("title"),
            "link": item.get("link"),
            "descriere": item.get("snippet"),
            "imagine": item.get("pagemap", {}).get("cse_image", [{}])[0].get("src"),
            "magazin": site.split(".")[0].capitalize(),
            "search_link": f"https://www.google.com/search?q={query}+site:{site}"
        }
        for item in data.get("items", []) 
    ]

def cauta_pe_magazine(query: str) -> dict:
    rezultate = {}
    for site in MAGAZINE:
        rezultate[site.split(".")[0].capitalize()] = search_google_cse(query, site)
    return rezultate


def grupeaza_rezultate_dupa_magazin(rezultate: list[dict], query: str) -> dict:
    grupate = {}

    for produs in rezultate:
        domeniu = urlparse(produs["link"]).netloc.replace("www.", "")
        nume = domeniu.split(".")[0]
        magazin = nume.lower()

        produs["magazin"] = magazin  
        if "titlu" not in produs or not produs["titlu"]:
            produs["titlu"] = "Produs necunoscut"

        produs["search_link"] = f"https://www.google.com/search?q={query}+site:{domeniu}"
        grupate.setdefault(magazin, []).append(produs)

    return grupate
