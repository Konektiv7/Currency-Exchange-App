from sqlalchemy.orm import declarative_base
from sqlalchemy import Column, Integer, String, Float, Date
from .database import engine

Base = declarative_base()

class CurrencyRate(Base):
    __tablename__ = "currency_rates"
    id = Column(Integer, primary_key=True, index=True)
    currency = Column(String, nullable=False)
    code = Column(String, nullable=False)
    rate = Column(Float, nullable=False)
    date = Column(Date, nullable=False)

def create_tables():
    Base.metadata.create_all(bind=engine)

if __name__ == "__main__":
    create_tables()
