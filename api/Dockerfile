FROM python:3.14-slim

WORKDIR /app

COPY api/requirements-demo.txt .
RUN pip install --no-cache-dir -r requirements-demo.txt

COPY api/ ./api/
COPY data/houses_cleaned.csv ./data/houses_cleaned.csv

RUN useradd --create-home demo && mkdir -p /app/runtime && chown demo:demo /app/runtime
USER demo
ENV AI_ENABLED=false QUOTA_DB_PATH=/app/runtime/quota.sqlite3

EXPOSE 8000

CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]
