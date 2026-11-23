from typing import Optional
from pydantic import BaseModel, EmailStr
from datetime import datetime


class UserRegister(BaseModel):
    email: EmailStr
    password: str
    fullName: str
    phone: Optional[str] = None
    role: Optional[str] = "CITIZEN"


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class GoogleAuthPayload(BaseModel):
    email: EmailStr
    name: Optional[str] = None
    image: Optional[str] = None
    googleId: Optional[str] = None


class GoogleAuthResponse(BaseModel):
    user_id: str
    email: str
    role: str
    full_name: str
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenRefresh(BaseModel):
    refresh_token: str


class UserOut(BaseModel):
    id: str
    email: str
    fullName: str
    phone: Optional[str] = None
    role: str
    wardId: Optional[str] = None
    isActive: bool
    createdAt: datetime

    class Config:
        from_attributes = True
