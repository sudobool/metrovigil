from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from ..models.schemas import LoginRequest, LoginResponse, UserResponse
from jose import jwt
from datetime import datetime, timedelta
from ..config import SECRET_KEY

router = APIRouter()
security = HTTPBearer()

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=1)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm="HS256")
    return encoded_jwt

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=["HS256"])
        username: str = payload.get("sub")
        role: str = payload.get("role")
        if username is None or role is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return UserResponse(username=username, role=role)
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.post("/login", response_model=LoginResponse)
async def login(req: LoginRequest):
    # Demo implementation - no password check
    token = create_access_token(data={"sub": req.username, "role": req.role})
    return LoginResponse(
        token=token,
        user=UserResponse(username=req.username, role=req.role)
    )

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: UserResponse = Depends(get_current_user)):
    return current_user
