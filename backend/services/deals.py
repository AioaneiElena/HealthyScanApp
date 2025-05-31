from bs4 import BeautifulSoup
import requests

def get_kaufland_deals(limit=10):
    url = "https://www.kaufland.ro/oferte/actual.html"
    headers = {"User-Agent": "Mozilla/5.0"}
    r = requests.get(url, headers=headers)
    soup = BeautifulSoup(r.content, "html.parser")

    produse = []
    for item in soup.select(".kaufland_o-OfferTile__content")[:limit]:
        titlu = item.select_one(".kaufland_o-OfferTile__title")
        pret = item.select_one(".kaufland_o-OfferTile__price")
        img = item.select_one("img")
        if titlu and pret and img:
            produse.append({
                "titlu": titlu.get_text(strip=True),
                "pret": pret.get_text(strip=True),
                "imagine": img.get("src"),
                "magazin": "Kaufland"
            })
    return produse
