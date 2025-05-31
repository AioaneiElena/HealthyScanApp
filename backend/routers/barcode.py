from fastapi import APIRouter, HTTPException
import requests
from services.search import search_google_cse, adauga_pret_si_sorteaza

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
    nutrienti = produs.get("nutriments", {})
    nutriscore = produs.get("nutriscore_grade", "necunoscut").upper()
    nova = produs.get("nova_group", "necunoscut")
    eco_score = produs.get("ecoscore_grade", "necunoscut").upper()
    categorie = produs.get("categories", "necunoscut")
    sanatate = f"NutriScore: {nutriscore}, NOVA: {nova}, EcoScore: {eco_score}"

    query = nume.lower()
    query = query.replace(",", "").replace("  ", " ").strip()

    print("🟡 QUERY din barcode:", query)

    rezultate = search_google_cse(query)
    produse_cu_pret = adauga_pret_si_sorteaza(rezultate)
    toate = produse_cu_pret

    return {
    "brand": brand,
    "nume": nume,
    "cantitate": cantitate,
    "nutrienti": nutrienti,
    "nutriscore": nutriscore,
    "nova": nova,
    "ecoscore": eco_score,
    "sanatate": sanatate,
    "categorie": categorie,
    "query": query,
    "rezultate": toate,
    }

