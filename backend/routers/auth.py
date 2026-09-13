import logging

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt

from ..config import SECRET_KEY
from ..models.schemas import LoginRequest, LoginResponse, UserResponse
from ..services.auth_service import authenticate
from datetime import datetime, timedelta

logger = logging.getLogger("metrovigil.auth")

router = APIRouter()
security = HTTPBearer()


def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=1)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm="HS256")


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> UserResponse:
    """Dependency that validates the bearer JWT and returns the caller.

    Import and add `current_user: UserResponse = Depends(get_current_user)`
    to any route that should require a logged-in user.
    """
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=["HS256"])
        username: str = payload.get("sub")
        role: str = payload.get("role")
        if username is None or role is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return UserResponse(username=username, role=role)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


def require_role(*allowed_roles: str):
    """Dependency factory that additionally restricts a route to specific roles."""

    def _check(current_user: UserResponse = Depends(get_current_user)) -> UserResponse:
        if current_user.role not in allowed_roles:
            raise HTTPException(status_code=403, detail="Not authorized for this action")
        return current_user

    return _check


@router.post("/login", response_model=LoginResponse)
async def login(req: LoginRequest):
    role = authenticate(req.username, req.password)
    if role is None:
        logger.info("Failed login attempt for username=%r", req.username)
        raise HTTPException(status_code=401, detail="Invalid username or password")

    token = create_access_token(data={"sub": req.username, "role": role})
    return LoginResponse(
        token=token,
        user=UserResponse(username=req.username, role=role),
    )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: UserResponse = Depends(get_current_user)):
    return current_user
