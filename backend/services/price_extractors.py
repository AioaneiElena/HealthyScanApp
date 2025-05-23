# services/price_extractors.py
import re
import json
from bs4 import BeautifulSoup
import requests

def extrage_pret_din_link(link: str) -> float | None:
    try:
        headers = {"User-Agent": "Mozilla/5.0"}
        response = requests.get(link, headers=headers, timeout=10)
        html = response.text
        if "emag.ro" in link:
            return parse_emag(html)
        elif "carrefour.ro" in link:
            return parse_carrefour(html)
        elif "mega-image.ro" in link:
            return parse_mega_image(html)
        elif "auchan.ro" in link:
            return parse_auchan(html)
        else:
            return None
    except Exception as e:
        print(f"Eroare la {link}: {e}")
        return None


def parse_emag(html: str) -> float | None:
    soup = BeautifulSoup(html, "html.parser")
    pret_tag = soup.find("p", {"class": "product-new-price"})
    if pret_tag:
        pret_text = pret_tag.get_text(strip=True).replace(".", "").replace("Lei", "").strip()
        try:
            return float(pret_text) / 100
        except:
            pass
    # Backup: JSON-LD
    for script in soup.find_all("script", type="application/ld+json"):
        try:
            data = json.loads(script.text)
            if isinstance(data, dict) and "offers" in data and "price" in data["offers"]:
                return float(data["offers"]["price"])
        except:
            continue
    return None

def parse_carrefour(html: str) -> float | None:
    soup = BeautifulSoup(html, "html.parser")
    for script in soup.find_all("script", type="application/ld+json"):
        try:
            data = json.loads(script.text)
            if isinstance(data, dict) and "offers" in data and "price" in data["offers"]:
                return float(data["offers"]["price"])
        except:
            continue
    pret_tag = soup.find("span", {"class": "product-price"})
    if pret_tag:
        pret_text = pret_tag.get_text(strip=True).replace("Lei", "").replace(",", ".")
        try:
            return float(re.findall(r"[\d.]+", pret_text)[0])
        except:
            pass
    return None

def parse_mega_image(html: str) -> float | None:
    soup = BeautifulSoup(html, "html.parser")
    for script in soup.find_all("script", type="application/ld+json"):
        try:
            data = json.loads(script.text)
            if isinstance(data, dict) and "offers" in data and "price" in data["offers"]:
                return float(data["offers"]["price"])
        except:
            continue
    pret_tag = soup.find("span", {"class": "price"})
    if pret_tag:
        pret_text = pret_tag.get_text(strip=True).replace("Lei", "").replace(",", ".")
        try:
            return float(re.findall(r"[\d.]+", pret_text)[0])
        except:
            pass
    return None

def parse_auchan(html: str) -> float | None:
    soup = BeautifulSoup(html, "html.parser")
    for script in soup.find_all("script", type="application/ld+json"):
        try:
            data = json.loads(script.text)
            if isinstance(data, dict) and "offers" in data and "price" in data["offers"]:
                return float(data["offers"]["price"])
        except:
            continue
    pret_tag = soup.find("span", {"class": "product-price-value"})
    if pret_tag:
        pret_text = pret_tag.get_text(strip=True).replace("Lei", "").replace(",", ".")
        try:
            return float(re.findall(r"[\d.]+", pret_text)[0])
        except:
            pass
    return None
