from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class UserRoleEnum(str, Enum):
    ADMIN = "ADMIN"
    OFFICER = "OFFICER"
    CITIZEN = "CITIZEN"
    MAINTENANCE = "MAINTENANCE"


class UserCreate(BaseModel):
    email: str = Field(..., min_length=5, max_length=255)
    password: str = Field(..., min_length=8)
    full_name: str = Field(..., min_length=2, max_length=100)
    phone: Optional[str] = None
    role: UserRoleEnum = UserRoleEnum.CITIZEN
    ward_id: Optional[str] = None


class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    phone: Optional[str] = None
    ward_id: Optional[str] = None


class UserRoleUpdate(BaseModel):
    role: UserRoleEnum

RoleUpdate = UserRoleUpdate


class UserStatusUpdate(BaseModel):
    is_active: bool


class UserOut(BaseModel):
    id: str
    email: str
    fullName: Optional[str] = None
    full_name: Optional[str] = None
    phone: Optional[str] = None
    role: UserRoleEnum
    ward_id: Optional[str] = None
    wardId: Optional[str] = None
    is_active: Optional[bool] = None
    isActive: Optional[bool] = None
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None

    model_config = {"from_attributes": True}


class UserListOut(BaseModel):
    items: List[UserOut]
    total: int
    skip: int
    limit: int
