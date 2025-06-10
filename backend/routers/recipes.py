from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from services.recipes_service import genereaza_reteta

router = APIRouter()

class RecipeRequest(BaseModel):
    cos: List[str]
    dieta: str = ""
    scop: str = ""
    timp: str = ""
    context: str = ""

@router.post("/reteta")
async def get_recipe(data: RecipeRequest):
    rezultat = genereaza_reteta(
        cos=data.cos,
        dieta=data.dieta,
        scop=data.scop,
        timp=data.timp,
        context=data.context
    )

    if rezultat.startswith("Eroare"):
        raise HTTPException(status_code=500, detail=rezultat)

    return {"reteta": rezultat}
