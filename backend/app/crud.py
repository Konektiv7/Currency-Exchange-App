# app/crud.py
from sqlalchemy.orm import Session
from . import models, schemas

def create_currency_rate(db: Session, rate_data: schemas.CurrencyRateCreate):
    db_rate = models.CurrencyRate(
        currency=rate_data.currency,
        code=rate_data.code,
        rate=rate_data.rate,
        date=rate_data.date
    )
    db.add(db_rate)
    db.commit()
    db.refresh(db_rate)
    return db_rate

def get_currency_rates_by_date(db: Session, date):
    return db.query(models.CurrencyRate).filter(models.CurrencyRate.date == date).all()

def get_all_currency_rates(db: Session):
    return db.query(models.CurrencyRate).all()
