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
