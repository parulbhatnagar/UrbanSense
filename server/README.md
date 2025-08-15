# Watson Proxy Server

This server provides a secure proxy to call IBM watsonx.ai for image understanding without exposing API keys in the browser.

Environment variables (set these before running):

- WATSON_API_KEY: your watsonx.ai API key
- WATSON_URL: watsonx.ai service URL (region specific)
- WATSON_PROJECT_ID: project id for model inference
- WATSON_MODEL_ID: model id to use (e.g. meta-llama/llama-3-2-90b-vision-instruct)

Install dependencies:

python -m pip install -r server/requirements.txt

Run locally:

WATSON_API_KEY=... WATSON_URL=... WATSON_PROJECT_ID=... WATSON_MODEL_ID=... python server/watson_proxy.py

The proxy exposes POST /api/watson/infer which accepts JSON { type: 'analyze'|'navigate', base64Image, instruction? }
and returns { text }.
