from fastapi import APIRouter, HTTPException, Request
import requests
from services.recipes_service import model

router = APIRouter()

from fastapi import APIRouter, HTTPException, Request
import requests

router = APIRouter()

@router.post("/alternatives")
async def get_healthier_alternatives(request: Request):
    body = await request.json()
    product_name = body.get("name", "").strip()
    fallback_category = body.get("categorie", "").strip()

    if not product_name:
        raise HTTPException(status_code=400, detail="Missing product name")

    # 1. Căutăm produsul pe OpenFoodFacts
    search_url = f"https://world.openfoodfacts.org/cgi/search.pl?search_terms={product_name}&json=1&page_size=1"
    resp = requests.get(search_url)

    if resp.status_code != 200:
        raise HTTPException(status_code=500, detail="Eroare la căutarea produsului")

    products_found = resp.json().get("products", [])
    if not products_found:
        raise HTTPException(status_code=404, detail="Produs negăsit")

    produs = products_found[0]
    categories_tags = produs.get("categories_tags", [])

    # 2. Alegem o categorie generală potrivită
    category_slug = None
    for tag in categories_tags:
        if tag.startswith("en:") and len(tag.split(":")[-1]) > 3:
            category_slug = tag.split(":")[-1]
            break

    if not category_slug and fallback_category:
        category_slug = fallback_category.replace(" ", "-").lower()

    if not category_slug:
        raise HTTPException(status_code=404, detail="Fără categorie validă")

    # 3. Căutăm produse în acea categorie
    category_url = f"https://world.openfoodfacts.org/category/{category_slug}.json"
    r = requests.get(category_url)

    if r.status_code != 200:
        raise HTTPException(status_code=500, detail="Eroare la accesarea categoriei")

    produse = r.json().get("products", [])
    sugestii = []

    for p in produse:
        nume = p.get("product_name", "").strip()
        scor = p.get("nutriscore_grade", "").upper()

        if (
            scor in ["A", "B", "C"]
            and nume
            and nume.lower() != product_name.lower()
            and len(nume) > 3
        ):
            sugestii.append(nume)

    # 4. Eliminăm duplicate
    sugestii_unice = list(dict.fromkeys(sugestii))

    return sugestii_unice[:3] if sugestii_unice else ["Nu am găsit alternative mai sănătoase."]


@router.post("/alternatives-ai")
async def ai_suggestions_only(request: Request):
    body = await request.json()
    product_name = body.get("name", "").strip()
    nutriscore = body.get("nutriscore", "").upper().strip()
    fallback_category = body.get("categorie", "").strip()

    if not product_name or not nutriscore:
        raise HTTPException(status_code=400, detail="Missing product name or nutriscore")

    # Obține categoria
    category_slug = None
    if not fallback_category:
        search_url = f"https://world.openfoodfacts.org/cgi/search.pl?search_terms={product_name}&json=1&page_size=1"
        resp = requests.get(search_url)
        if resp.status_code == 200:
            results = resp.json().get("products", [])
            if results:
                tags = results[0].get("categories_tags", [])
                if tags:
                    category_slug = tags[0].split(":")[-1]
    else:
        category_slug = fallback_category.replace(" ", "-").lower()

    if not category_slug:
        raise HTTPException(status_code=404, detail="Category not found")

    categorie_umanoida = category_slug.replace("-", " ")
    prompt = (
        f"Produsul {product_name} are un scor NutriScore {nutriscore}. Este luat din baza de date OpenFoodFacts. "
        f"Oferă-mi 3 alternative mai sănătoase, naturale, ca sa inlocuiesc  {product_name}, deci ceva din aceeasi categorie. Răspunde cu o listă simplă."
    )

    try:
        result = model.generate_content(prompt)
        lines = result.text.strip().splitlines()
        suggestions = [
            line.lstrip("-•1234567890. ").strip()
            for line in lines if line.strip()
        ]
    except Exception as e:
        print("❌ Gemini error:", e)
        raise HTTPException(status_code=500, detail="AI generation failed")

    return {"suggestions": suggestions[:3]}
