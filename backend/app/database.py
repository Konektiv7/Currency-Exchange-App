import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker


DATABASE_URL = os.getenv('DATABASE_URL', "postgresql://postgres:123456@localhost:5432/currency")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)