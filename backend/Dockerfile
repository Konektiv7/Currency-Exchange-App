FROM python:3.9-slim

WORKDIR /app

# Instalacja postgresql-client do wait-for-it.sh
RUN apt-get update && apt-get install -y postgresql-client && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY ./app ./app
COPY ./tests ./tests
COPY wait-for-it.sh /wait-for-it.sh
RUN chmod +x /wait-for-it.sh

EXPOSE 8080

CMD ["/wait-for-it.sh", "db", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080", "--reload"]