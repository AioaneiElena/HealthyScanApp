from fastapi import APIRouter, HTTPException, Request
import requests
from services.recipes_service import model

router = APIRouter()

@router.post("/alternatives")
async def get_healthier_alternatives(request: Request):
    body = await request.json()
    product_name = body.get("name", "").strip()
    fallback_category = body.get("categorie", "").strip()

    if not product_name:
        raise HTTPException(status_code=400, detail="Missing product name")

    search_url = f"https://world.openfoodfacts.org/cgi/search.pl?search_terms={product_name}&json=1&page_size=1"
    resp = requests.get(search_url)

    category_slug = None

    if resp.status_code == 200:
        results = resp.json().get("products", [])
        if results:
            product = results[0]
            categories = product.get("categories_tags", [])
            if categories:
                category_slug = categories[0].split(":")[-1]

    # fallback to frontend-provided category
    if not category_slug:
        if fallback_category:
            category_slug = fallback_category.replace(" ", "-").lower()
        else:
            raise HTTPException(status_code=404, detail="No category found")

    category_url = f"https://world.openfoodfacts.org/category/{category_slug}.json"
    r = requests.get(category_url)

    if r.status_code != 200:
        raise HTTPException(status_code=500, detail="Failed to fetch category")

    products = r.json().get("products", [])
    suggestions = []

    for p in products:
        score = p.get("nutriscore_grade", "X").upper()
        name = p.get("product_name", "").strip()
        if score in ["A", "B", "C"] and name and name.lower() != product_name.lower():
            suggestions.append(name)

    return suggestions[:3] or ["No healthier alternatives found."]

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
        f"Produsul {product_name} are un scor NutriScore {nutriscore}. "
        f"Oferă-mi 3 alternative mai sănătoase (cu NutriScore A, B sau C) "
        f"din categoria {categorie_umanoida}. Răspunde cu o listă simplă."
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
