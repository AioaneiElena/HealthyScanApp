from fastapi import APIRouter, HTTPException
import requests

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
    return {
        "brand": produs.get("brands", "necunoscut"),
        "nume": produs.get("product_name", "necunoscut"),
        "cantitate": produs.get("quantity", ""),
        "nutrienti": produs.get("nutriments", {}),
    }
