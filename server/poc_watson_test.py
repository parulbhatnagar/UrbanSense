#!/usr/bin/env python3
"""
POC script to test connectivity to IBM watsonx.ai ModelInference.

Usage:
- Put your credentials into `server/.env` (gitignored) or export as env vars.
- Run: python3 server/poc_watson_test.py

Notes:
- This script will try to load env vars first, then fall back to parsing server/.env if present.
- It uses the installed `ibm_watsonx_ai` SDK. Install with:
    python -m pip install -r server/requirements.txt
"""
import os
import base64
import json
import sys
from pathlib import Path

# Try to import the watson SDK
try:
    from ibm_watsonx_ai import APIClient, Credentials
    from ibm_watsonx_ai.foundation_models import ModelInference
except Exception as e:
    print("Missing ibm_watsonx_ai SDK. Install dependencies: python -m pip install -r server/requirements.txt")
    print("Error:", e)
    sys.exit(1)

# Helper: load simple KEY=VALUE .env file
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

# Load server/.env if present
load_dotenv(Path(__file__).parent / '.env')

# Read credentials from env
WATSON_API_KEY = os.getenv('WATSON_API_KEY')
WATSON_URL = os.getenv('WATSON_URL')
WATSON_PROJECT_ID = os.getenv('WATSON_PROJECT_ID')
WATSON_MODEL_ID = os.getenv('WATSON_MODEL_ID')

if not (WATSON_API_KEY and WATSON_URL and WATSON_PROJECT_ID and WATSON_MODEL_ID):
    print('Missing one or more Watson credentials. Please set WATSON_API_KEY, WATSON_URL, WATSON_PROJECT_ID, WATSON_MODEL_ID')
    sys.exit(2)

print('Using Watson URL:', WATSON_URL)
print('Using Project ID:', WATSON_PROJECT_ID)
print('Using Model ID:', WATSON_MODEL_ID)

# Create client and model
try:
    creds = Credentials(api_key=WATSON_API_KEY, url=WATSON_URL)
    client = APIClient(credentials=creds)
    vision_model = ModelInference(api_client=client, project_id=WATSON_PROJECT_ID, model_id=WATSON_MODEL_ID)
except Exception as e:
    print('Failed to initialize Watson client:', e)
    sys.exit(3)

# Choose a test image from the repo
default_image = Path(__file__).parent.parent / 'public' / 'testData' / 'newyork' / 'Closed-Sidewalk-with-Pedestrian-Pass-through-New-York-City-June-2024-1.jpeg'
if not default_image.exists():
    print('Default test image not found at', default_image)
    print('Provide an image path as the first argument to this script.')
    sys.exit(4)

image_path = Path(sys.argv[1]) if len(sys.argv) > 1 else default_image
print('Using image:', image_path)

try:
    with open(image_path, 'rb') as f:
        image_bytes = f.read()
        image_base64 = base64.b64encode(image_bytes).decode('utf-8')
except Exception as e:
    print('Failed to read image:', e)
    sys.exit(5)

prompt_text = "Describe the scene in this image with spatial context. Keep it concise."

print('Sending request to watson model...')
try:
    response = vision_model.generate(
        prompt=prompt_text,
        params={
            'image': image_base64,
            'max_new_tokens': 512,
            'temperature': 0.2
        }
    )
except Exception as e:
    print('Model call failed:', e)
    sys.exit(6)

print('\nRaw response:')
print(response)

# Try to extract text
out = None
if isinstance(response, dict):
    if 'results' in response and isinstance(response['results'], list) and len(response['results']) > 0:
        first = response['results'][0]
        out = first.get('generated_text') or first.get('output') or first.get('text')
    elif 'text' in response:
        out = response['text']

if not out:
    out = str(response)

print('\nExtracted output:\n')
print(out)
print('\nPOC finished')
