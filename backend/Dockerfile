FROM python:3.11-slim

WORKDIR /app

# Set Python environment variables to reduce memory usage
ENV PYTHONUNBUFFERED=1
ENV PYTHONOPTIMIZE=1
ENV PYTHONDONTWRITEBYTECODE=1

COPY requirements.txt .

# Remove --no-deps to ensure all dependencies are installed
# Use --no-cache-dir to save space
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1", "--limit-concurrency", "10"]
