from pydantic import BaseModel, Field
from datetime import datetime
from typing import Literal


class OperationCreate(BaseModel):
    date: datetime | None = None
    ticker: str = Field(..., min_length=1, max_length=20)
    side: Literal["buy", "sell"]
    quantity: float = Field(..., gt=0)
    price: float = Field(..., gt=0)
    commission: float = 0.0
    note: str = ""


class OperationOut(BaseModel):
    id: int
    date: datetime
    ticker: str
    side: str
    quantity: float
    price: float
    commission: float
    note: str

    class Config:
        from_attributes = True


class Position(BaseModel):
    ticker: str
    quantity: float
    avg_price: float
    invested: float