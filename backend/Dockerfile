FROM python:3.11-slim

WORKDIR /app

# Set Python environment variables to reduce memory usage
ENV PYTHONUNBUFFERED=1
ENV PYTHONOPTIMIZE=1
ENV PYTHONDONTWRITEBYTECODE=1

COPY requirements.txt .

# Use --no-cache-dir and limit pip's memory usage
RUN pip install --no-cache-dir --no-deps -r requirements.txt || \
    pip install --no-cache-dir -r requirements.txt

COPY . .

# Reduce uvicorn workers and limit memory
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1", "--limit-concurrency", "10"]
