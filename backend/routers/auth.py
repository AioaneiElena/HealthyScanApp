from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from jose import JWTError, jwt
from passlib.hash import bcrypt
from datetime import datetime, timedelta
from database.models import User
from database.session import AsyncSessionLocal


router = APIRouter()

SECRET_KEY = "cheie_super_secreta"
ALGORITHM = "HS256"

# --- Pydantic models ---
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

# --- DB session ---
async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

# --- Register route ---
@router.post("/register")
async def register(user: UserCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == user.email))
    existing_user = result.scalar_one_or_none()

    if existing_user:
        raise HTTPException(status_code=400, detail="Email deja folosit")

    hashed_password = bcrypt.hash(user.password)
    new_user = User(
        email=user.email,
        hashed_password=hashed_password,
        first_name=user.first_name,
        last_name=user.last_name,
    )

    db.add(new_user)
    await db.commit()
    return {"msg": "Cont creat cu succes"}

# --- Login route ---
@router.post("/login")
async def login(user: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == user.email))
    db_user = result.scalar_one_or_none()

    if not db_user or not bcrypt.verify(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Email sau parolă greșite")

    token_data = {
        "sub": db_user.email,
        "exp": datetime.utcnow() + timedelta(hours=3)
    }

    token = jwt.encode(token_data, SECRET_KEY, algorithm=ALGORITHM)
    return {"access_token": token, "token_type": "bearer"}

# --- Token verification ---
def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Token invalid")

# --- Me route (verifică token direct din query param) ---
@router.get("/me")
async def get_me(token: str, db: AsyncSession = Depends(get_db)):
    data = verify_token(token)
    result = await db.execute(select(User).where(User.email == data["sub"]))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name
    }
