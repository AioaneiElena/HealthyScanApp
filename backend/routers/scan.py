from fastapi import APIRouter, UploadFile, File, Body
from services.ocr import extract_query_from_image
from services.search import search_google_cse, grupeaza_rezultate_dupa_magazin

router = APIRouter()

@router.post("/scan")
async def scan_image(file: UploadFile = File(...)):
    contents = await file.read()
    query = extract_query_from_image(contents)
    return {"query": query}


@router.post("/scan-and-search")
async def scan_and_search(
    file: UploadFile = File(None),
    query: str = Body(default=None)
):
    if file is not None:
        contents = await file.read()
        query = extract_query_from_image(contents)

    if not query:
        return {"query": "invalid", "top3": [], "toate": [], "grupate": {}}

    print("🟡 QUERY:", query)
    rezultate = search_google_cse(query)
    print("🟢 REZULTATE:", len(rezultate))

    grupate = grupeaza_rezultate_dupa_magazin(rezultate, query)
    top3 = [item for group in grupate.values() for item in group][:3]

    return {
        "query": query,
        "top3": top3,
        "toate": rezultate,
        "grupate": grupate
    }


@router.post("/search")
async def direct_search(query: str = Body(..., embed=True)):
    print("🟡 QUERY direct:", query)
    rezultate = search_google_cse(query)
    grupate = grupeaza_rezultate_dupa_magazin(rezultate, query)
    top3 = [item for group in grupate.values() for item in group][:3]

    return {
        "query": query,
        "top3": top3,
        "toate": rezultate,
        "grupate": grupate
    }
