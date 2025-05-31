from fastapi import APIRouter
from services.deals import get_kaufland_deals

router = APIRouter()

@router.get("/deals")
def get_promotii():
    try:
        produse = get_kaufland_deals()
        return {"rezultate": produse}
    except Exception as e:
        return {"eroare": str(e)}
