from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import scan, barcode  # ← adaugă barcode

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Înregistrăm rutele
app.include_router(scan.router)
app.include_router(barcode.router)  # ← adaugă ruta pentru cod de bare
