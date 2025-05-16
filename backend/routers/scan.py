from fastapi import APIRouter, UploadFile, File
from services.ocr import extract_query_from_image
from services.search import search_google_cse, adauga_pret_si_sorteaza

router = APIRouter()

@router.post("/scan")
async def scan_image(file: UploadFile = File(...)):
    contents = await file.read()
    query = extract_query_from_image(contents)
    return {"query": query}


@router.post("/scan-and-search")
async def scan_and_search(file: UploadFile = File(...)):
    contents = await file.read()
    query = extract_query_from_image(contents)
    rezultate = search_google_cse(query)
    produse_cu_pret = adauga_pret_si_sorteaza(rezultate)
    top3 = produse_cu_pret[:3]

    return {
        "query": query,
        "top3": top3,
        "toate": produse_cu_pret
    }
