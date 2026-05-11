from pydantic import BaseModel, Field
from typing import Optional


class LoginRequest(BaseModel):
    email: str = Field(min_length=5)
    password: str = Field(min_length=6)


class RegisterRequest(BaseModel):
    email: str = Field(min_length=5)
    password: str = Field(min_length=8)
    role: str = Field(pattern="^(student|school|business)$")
    name: str = Field(min_length=2)
    surname: str = Field(min_length=2)
    phone: Optional[str] = None



class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user_id: int
    role: str
    email: str


class TokenPayload(BaseModel):
    sub: str          # user_id as string
    role: str
    email: str
    exp: int
    iat: int


class PermissionCheckRequest(BaseModel):
    user_id: int
    screen: str
    action: str = Field(pattern="^(create|read|update|delete)$")


class UserScreensResponse(BaseModel):
    user_id: int
    screens: list
