#!/usr/bin/env python3
"""
Simple Flask proxy to securely call IBM watsonx.ai (ModelInference) from the web app.

Security note: Do NOT commit your Watson API key to the repo. Set the following environment variables on the server:

  WATSON_API_KEY  - your watsonx.ai API key
  WATSON_URL      - watsonx.ai service URL (region-specific)
  WATSON_PROJECT_ID - the project id for model inference
  WATSON_MODEL_ID - the model id to use (e.g. "meta-llama/llama-3-2-90b-vision-instruct")

This proxy exposes a single endpoint POST /api/watson/infer that accepts JSON:
  { type: 'analyze'|'navigate', base64Image: '<data-uri or raw base64>', instruction?: string }

It returns JSON { text: 'generated text' } on success.

Install requirements: pip install -r server/requirements.txt
Run locally: python server/watson_proxy.py
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import traceback

try:
    from ibm_watsonx_ai import APIClient, Credentials
    from ibm_watsonx_ai.foundation_models import ModelInference
except Exception:
    # If ibm_watsonx_ai isn't installed, we'll surface a clear error at runtime.
    APIClient = None
    Credentials = None
    ModelInference = None

app = Flask(__name__)
CORS(app)

# Read configuration from environment
WATSON_API_KEY = os.getenv("WATSON_API_KEY")
WATSON_URL = os.getenv("WATSON_URL")
WATSON_PROJECT_ID = os.getenv("WATSON_PROJECT_ID")
WATSON_MODEL_ID = os.getenv("WATSON_MODEL_ID")

# Optional prompts (can be overridden by env)
EXPLORE_PROMPT = os.getenv("WATSON_EXPLORE_PROMPT",
                           "Describe the scene in this image with spatial context. Keep it concise (2-3 sentences) and speak directly to the user.")
NAV_PROMPT_TEMPLATE = os.getenv("WATSON_NAV_PROMPT_TEMPLATE",
                                "You are a navigation assistant. The core instruction is: '{instruction}'. Use the image only to provide safety/contextual information (obstacles, clear path). Be concise and give a single direct command.")

_model = None


def init_model():
    global _model
    if not APIClient:
        raise RuntimeError("ibm_watsonx_ai SDK not installed. Please install server/requirements.txt")
    if not (WATSON_API_KEY and WATSON_URL and WATSON_PROJECT_ID and WATSON_MODEL_ID):
        raise RuntimeError("Missing one or more WATSON_* environment variables (API_KEY, URL, PROJECT_ID, MODEL_ID)")

    creds = Credentials(api_key=WATSON_API_KEY, url=WATSON_URL)
    client = APIClient(credentials=creds)
    _model = ModelInference(api_client=client, project_id=WATSON_PROJECT_ID, model_id=WATSON_MODEL_ID)
    return _model


@app.route("/api/watson/infer", methods=["POST"])
def infer():
    global _model
    try:
        body = request.get_json(force=True)
        if not body:
            return jsonify({"error": "Missing JSON body"}), 400

        typ = body.get('type')
        base64Image = body.get('base64Image')
        instruction = body.get('instruction', '')

        if not base64Image:
            return jsonify({"error": "Missing base64Image"}), 400

        # Accept data URIs or raw base64
        if base64Image.startswith('data:'):
            # strip prefix
            try:
                base64Image = base64Image.split(',', 1)[1]
            except Exception:
                pass

        if typ not in ('analyze', 'navigate'):
            return jsonify({"error": "Unsupported type. Use 'analyze' or 'navigate'."}), 400

        if _model is None:
            try:
                init_model()
            except Exception as e:
                traceback.print_exc()
                return jsonify({"error": f"Watson client not configured: {str(e)}"}), 500

        # Build prompt
        if typ == 'analyze':
            prompt = EXPLORE_PROMPT
        else:
            prompt = NAV_PROMPT_TEMPLATE.replace('{instruction}', instruction or '')

        # Call Watson model for vision+text. The watsonx.ai Python API used in your sample
        # supports a `generate` method on ModelInference. We forward the base64 image and prompt
        # as parameters. Adjust param names if your watsonx.ai deployment expects different keys.
        params = {
            "image": base64Image,
            "max_new_tokens": 512,
            "temperature": 0.2
        }

        # Use the same method name as the sample: generate(prompt=..., params={...})
        resp = _model.generate(prompt=prompt, params=params)

        # Attempt to extract text from common response shapes
        text = None
        if isinstance(resp, dict):
            if 'results' in resp and isinstance(resp['results'], list) and len(resp['results']) > 0:
                first = resp['results'][0]
                text = first.get('generated_text') or first.get('output') or first.get('text')
            elif 'text' in resp:
                text = resp['text']

        if not text:
            # fallback: stringify response
            text = str(resp)

        return jsonify({"text": text})

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    # Run on port 5000 by default; set PORT env to override
    port = int(os.getenv('PORT', 5000))
    print(f"Starting Watson proxy on http://0.0.0.0:{port}")
    app.run(host='0.0.0.0', port=port, debug=True)
