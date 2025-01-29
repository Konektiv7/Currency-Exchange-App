# app/schemas.py

from pydantic import BaseModel
from datetime import date
from pydantic import ConfigDict
class CurrencyRateBase(BaseModel):
    currency: str
    code: str
    rate: float
    date: date

class CurrencyRateCreate(CurrencyRateBase):
    pass

class CurrencyRateRead(CurrencyRateBase):
    id: int

class Config:
    model_config = ConfigDict(from_attributes=True)