# app/main.py
from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from datetime import date
import requests
from .database import SessionLocal, engine
from . import crud, schemas, models

app = FastAPI(title="Currency Exchange App")


models.Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def root():
    return {"message": "API działa poprawnie"}

@app.get("/currencies", response_model=list[schemas.CurrencyRateRead])
def get_all_currencies(db: Session = Depends(get_db)):
    return crud.get_all_currency_rates(db)

@app.get("/currencies/{input_date}", response_model=list[schemas.CurrencyRateRead])
def get_currencies_by_date(input_date: date, db: Session = Depends(get_db)):
    return crud.get_currency_rates_by_date(db, input_date)

@app.post("/currencies/fetch")
def fetch_currencies(db: Session = Depends(get_db)):
    url = "http://api.nbp.pl/api/exchangerates/tables/A/?format=json"
    response = requests.get(url)
    if response.status_code != 200:
        return {"error": "Nie udało się pobrać danych z NBP"}

    data = response.json()
    rates = data[0]["rates"]
    effective_date = date.fromisoformat(data[0]["effectiveDate"])

    for r in rates:
        rate_data = schemas.CurrencyRateCreate(
            currency=r["currency"],
            code=r["code"],
            rate=r["mid"],
            date=effective_date
        )
        crud.create_currency_rate(db, rate_data)

    return {"status": "Kursy zostały pobrane i zapisane w bazie"}
