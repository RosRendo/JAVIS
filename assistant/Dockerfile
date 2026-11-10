FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    build-essential \
    portaudio19-dev \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt* /tmp/requirements.txt
RUN if [ -f /tmp/requirements.txt ]; then pip install --no-cache-dir -r /tmp/requirements.txt; fi
RUN pip install --no-cache-dir fastapi uvicorn websockets pydantic

COPY . .

EXPOSE 8000

CMD ["uvicorn", "assistant.app:app", "--host", "0.0.0.0", "--port", "8000"]
