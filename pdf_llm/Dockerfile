FROM python:3.9-slim AS builder

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first to leverage Docker cache
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Production image
FROM python:3.9-slim

WORKDIR /app

# Copy installed packages from builder stage
COPY --from=builder /usr/local/lib/python3.9/site-packages/ /usr/local/lib/python3.9/site-packages/
COPY --from=builder /usr/local/bin/ /usr/local/bin/

# Create a non-root user to run the application
RUN useradd -m appuser

# Copy the application code
COPY . .

# Create directories for uploads and vector stores and set proper permissions
RUN mkdir -p uploads vectorstores && \
    chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Add health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:${PORT:-5002}/health || exit 1

# Expose the port the app runs on
EXPOSE ${PORT:-5002}

# Use gunicorn for production
CMD gunicorn --bind 0.0.0.0:${PORT:-5002} --workers 4 --timeout 120 'api:app' 