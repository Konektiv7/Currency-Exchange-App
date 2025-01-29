# tests/test_main.py
import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.main import app, get_db
from app.models import Base, CurrencyRate
from datetime import date


TEST_DATABASE_URL = "sqlite:///./test.db"
os.environ["DATABASE_URL"] = TEST_DATABASE_URL

engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

@pytest.fixture(scope="function")
def test_db():
    """ Fixture do resetowania bazy przed każdym testem """
    Base.metadata.drop_all(bind=engine)  # Usuwa testowe tabele
    Base.metadata.create_all(bind=engine)  # Tworzy je na nowo

    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.rollback()
        db.close()

# Testy API
def test_root_endpoint():
    """Test głównego endpointu"""
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "API działa poprawnie"}

def test_get_currency_rates_valid_date(test_db):
    """Test pobierania danych dla poprawnej daty"""
    # Przygotowanie testowych danych
    test_currency = CurrencyRate(
        currency="Euro",
        code="EUR",
        rate=4.5,
        date=date(2024, 1, 10)
    )
    test_db.add(test_currency)
    test_db.commit()

    # Wywołanie API
    response = client.get("/currencies/2024-01-10")
    
    # Sprawdzenie odpowiedzi
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["currency"] == "Euro"
    assert data[0]["code"] == "EUR"
    assert data[0]["rate"] == 4.5
    assert data[0]["date"] == "2024-01-10"

def test_get_currency_rates_invalid_date(test_db):
    """Test pobierania danych dla nieistniejącej daty"""
    response = client.get("/currencies/2024-01-01")
    assert response.status_code == 200
    assert response.json() == []

def test_get_all_currencies(test_db):
    """Test pobierania wszystkich kursów walut"""
    # Dodanie kilku testowych rekordów
    currencies = [
        CurrencyRate(currency="Euro", code="EUR", rate=4.5, date=date(2024, 1, 10)),
        CurrencyRate(currency="Dolar", code="USD", rate=3.8, date=date(2024, 1, 10))
    ]
    test_db.add_all(currencies)
    test_db.commit()

    response = client.get("/currencies")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert all(item["id"] is not None for item in data)

def test_database_connection(test_db):
    """Test połączenia z bazą danych"""
    try:
        # Próba wykonania prostej operacji na bazie
        result = test_db.execute(text("SELECT 1"))
        test_db.commit()

        assert result.scalar() == 1
    except Exception as e:
        pytest.fail(f"Nie udało się połączyć z bazą danych: {str(e)}")

def test_database_crud_operations(test_db):
    """Test operacji CRUD na bazie danych"""
    # Create
    new_rate = CurrencyRate(
        currency="Euro",
        code="EUR",
        rate=4.5,
        date=date(2024, 1, 10)
    )
    test_db.add(new_rate)
    test_db.commit()
    assert new_rate.id is not None

    # Read
    saved_rate = test_db.query(CurrencyRate).filter_by(code="EUR").first()
    assert saved_rate is not None
    assert saved_rate.currency == "Euro"

    # Update
    saved_rate.rate = 4.6
    test_db.commit()
    updated_rate = test_db.query(CurrencyRate).filter_by(code="EUR").first()
    assert updated_rate.rate == 4.6

    # Delete
    test_db.delete(saved_rate)
    test_db.commit()
    deleted_rate = test_db.query(CurrencyRate).filter_by(code="EUR").first()
    assert deleted_rate is None