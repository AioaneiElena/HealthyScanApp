from fastapi import APIRouter, HTTPException
import requests
from services.search import search_google_cse
from urllib.parse import urlparse
router = APIRouter()

@router.get("/barcode/{code}")
def lookup_barcode(code: str):
    url = f"https://world.openfoodfacts.org/api/v2/product/{code}.json"
    response = requests.get(url)

    if response.status_code != 200:
        raise HTTPException(status_code=500, detail="Eroare la OpenFoodFacts")

    data = response.json()
    if data.get("status") != 1:
        raise HTTPException(status_code=404, detail="Produs negăsit")

    produs = data["product"]
    brand = produs.get("brands", "necunoscut")
    nume = produs.get("product_name", "necunoscut")
    cantitate = produs.get("quantity", "")
    nutriscore = produs.get("nutriscore_grade", "necunoscut").upper()
    nova = str(produs.get("nova_group", "necunoscut"))
    ecoscore = produs.get("ecoscore_grade", "necunoscut").upper()
    categorie = produs.get("categories", "necunoscut")
    generic_name = produs.get("generic_name", "")
    ambalaj = produs.get("packaging", "")
    origine = produs.get("ingredients_origin", "")
    etichete = produs.get("labels_tags", [])
    alergeni = produs.get("allergens_tags", [])
    aditivi = produs.get("additives_tags", [])

    nutrienti = produs.get("nutriments", {})
    nutrienti100g = ", ".join([
        f"{k}: {v}" for k, v in nutrienti.items()
        if not k.endswith("_unit") and "_100g" in k
    ]) or "—"
    nutrientiPortie = ", ".join([
        f"{k}: {v}" for k, v in nutrienti.items()
        if not k.endswith("_unit") and "_serving" in k
    ]) or "—"
    
    # Extrage toate valorile nutriționale importante
    # Creează un dicționar complet cu toate valorile disponibile
    nutrienti_completi = {}
    
    # Lista de nutrienți importanți de extras
    nutrienti_cheie = [
        "energy-kcal", "energy", "salt", "sugars", "fat", "proteins", "fiber", 
        "saturated-fat", "sodium", "carbohydrates", "cholesterol", "trans-fat",
        "calcium", "iron", "potassium", "magnesium", "vitamin-a", "vitamin-c",
        "vitamin-d", "vitamin-e", "omega-3-fat", "omega-6-fat"
    ]
    
    # Extrage toate valorile pentru fiecare nutrient (bază, _100g, _serving)
    for nutrient in nutrienti_cheie:
        # Valoare de bază
        if nutrient in nutrienti:
            nutrienti_completi[nutrient] = nutrienti.get(nutrient, 0)
        
        # Valoare per 100g
        key_100g = f"{nutrient}_100g"
        if key_100g in nutrienti:
            nutrienti_completi[key_100g] = nutrienti.get(key_100g, 0)
        
        # Valoare per porție
        key_serving = f"{nutrient}_serving"
        if key_serving in nutrienti:
            nutrienti_completi[key_serving] = nutrienti.get(key_serving, 0)
    
    # Adaugă și toate celelalte valori disponibile
    for key, value in nutrienti.items():
        if not key.endswith("_unit") and key not in nutrienti_completi:
            nutrienti_completi[key] = value

    return {
        "brand": brand,
        "nume": nume,
        "cantitate": cantitate,
        "nutriscore": nutriscore,
        "nova": nova,
        "ecoscore": ecoscore,
        "categorie": categorie,
        "nutrienti100g": nutrienti100g,
        "nutrientiPortie": nutrientiPortie,
        "alergeni": [a.replace("en:", "") for a in alergeni],
        "aditivi": [a.replace("en:", "") for a in aditivi],
        "origine": origine,
        "etichete": [e.replace("en:", "") for e in etichete],
        "generic_name": generic_name,
        "ambalaj": ambalaj,
        "code": code,
        "nutrienti": nutrienti_completi,
        "serving_size": produs.get("serving_size", ""),
    }


def grupare_dupa_magazin(rezultate: list[dict]) -> dict:
    grouped = {}
    for r in rezultate:
        hostname = urlparse(r["link"]).hostname or ""
        magazin = hostname.replace("www.", "").split(".")[0]
        if magazin not in grouped:
            grouped[magazin] = []
        if len(grouped[magazin]) < 3:
            grouped[magazin].append(r)
    return grouped

@router.get("/barcode-search/{code}")
def cauta_dupa_cod_barcode(code: str):
    url = f"https://world.openfoodfacts.org/api/v2/product/{code}.json"
    response = requests.get(url)

    if response.status_code != 200:
        raise HTTPException(status_code=500, detail="Eroare la OpenFoodFacts")

    data = response.json()
    if data.get("status") != 1:
        raise HTTPException(status_code=404, detail="Produs negăsit")

    produs = data["product"]
    nume = produs.get("product_name", "necunoscut")
    brand = produs.get("brands", "").split(",")[0].strip()  
    query = f"{brand} {nume}".lower().strip() if brand else nume.lower().strip()

    rezultate = search_google_cse(query)
    grupate = grupare_dupa_magazin(rezultate)

    return {
        "nume": nume,
        "query": query,
        "magazine": grupate
    }
