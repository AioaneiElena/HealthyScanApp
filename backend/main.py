from dotenv import load_dotenv
import os

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import scan, barcode  
from routers import decode
from routers import auth
from routers import alternatives
from routers import deals_api
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(scan.router)
app.include_router(barcode.router) 
app.include_router(decode.router)
app.include_router(auth.router)
app.include_router(alternatives.router)
app.include_router(deals_api.router)