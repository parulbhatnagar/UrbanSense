#!/usr/bin/env python3
"""
POC: Call Watson Model Inference REST endpoint without the ibm SDK.

Usage:
  - Fill `server/.env` with credentials (gitignored) or set env vars.
  - Run: python3 server/poc_watson_rest.py [optional-image-path]

Notes:
  - This script posts JSON to the REST endpoint and prints the raw response.
  - If the service expects a different authentication method, adjust the headers accordingly.
"""
import os
import sys
import base64
import json
from pathlib import Path

try:
    import requests
except Exception:
    print('Missing requests library. Install: python -m pip install requests')
    sys.exit(1)

# Load .env-like file if present
def load_dotenv(path: Path):
    if not path.exists():
        return
    with path.open('r') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#') or '=' not in line:
                continue
            k, v = line.split('=', 1)
            k = k.strip()
            v = v.strip().strip('"').strip("'")
            if k and (k not in os.environ):
                os.environ[k] = v

load_dotenv(Path(__file__).parent / '.env')

WATSON_API_KEY = os.getenv('WATSON_API_KEY')
WATSON_URL = os.getenv('WATSON_URL')
WATSON_PROJECT_ID = os.getenv('WATSON_PROJECT_ID')
WATSON_MODEL_ID = os.getenv('WATSON_MODEL_ID')

if not (WATSON_API_KEY and WATSON_URL and WATSON_PROJECT_ID and WATSON_MODEL_ID):
    print('Missing one or more Watson credentials in environment or server/.env')
    sys.exit(2)

# Image to send
default_image = Path(__file__).parent.parent / 'public' / 'testData' / 'newyork' / 'Closed-Sidewalk-with-Pedestrian-Pass-through-New-York-City-June-2024-1.jpeg'
image_path = Path(sys.argv[1]) if len(sys.argv) > 1 else default_image
if not image_path.exists():
    print('Image not found:', image_path)
    sys.exit(3)

with open(image_path, 'rb') as f:
    b = f.read()
    image_b64 = base64.b64encode(b).decode('utf-8')

prompt_text = 'Describe the scene in this image with spatial context. Keep it concise.'

endpoint = f"{WATSON_URL.rstrip('/')}/v1/projects/{WATSON_PROJECT_ID}/model_inference?version=2024-07-01"

payload = {
    'model': WATSON_MODEL_ID,
    'project': WATSON_PROJECT_ID,
    'inputs': [
        { 'type': 'image', 'data': image_b64, 'mime': 'image/jpeg' },
        { 'type': 'text', 'text': prompt_text }
    ]
}

headers = {
    'Content-Type': 'application/json',
    # Many IBM examples use Bearer <apikey> for simple API key auth via the SDK.
    # If your deployment expects a different auth, modify accordingly.
    'Authorization': f'Bearer {WATSON_API_KEY}'
}

print('POST', endpoint)
try:
    r = requests.post(endpoint, headers=headers, data=json.dumps(payload), timeout=60)
except Exception as e:
    print('Request failed:', e)
    sys.exit(4)

print('HTTP', r.status_code)
try:
    print(json.dumps(r.json(), indent=2))
except Exception:
    print(r.text)

if r.status_code != 200:
    print('\nIf authentication fails, your service may expect a different auth scheme (API key exchange/token).')
    print('Check Watson docs for the correct REST authentication for your deployment.')

print('\nPOC finished')
