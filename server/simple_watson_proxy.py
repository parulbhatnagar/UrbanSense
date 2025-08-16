#!/usr/bin/env python3

"""
Simple Watson proxy that forwards requests to the Netlify function
for testing purposes when the IBM SDK is not available.
"""

import os
import json
import traceback
from flask import Flask, request, jsonify
from flask_cors import CORS
import requests

app = Flask(__name__)
CORS(app)

# For testing, we can use either a deployed Netlify function or mock responses
NETLIFY_FUNCTION_URL = os.getenv("NETLIFY_FUNCTION_URL", "")
USE_MOCK = os.getenv("USE_MOCK", "true").lower() == "true"

@app.route("/api/watson/infer", methods=["POST"])
def infer():
    try:
        body = request.get_json(force=True)
        if not body:
            return jsonify({"error": "Missing JSON body"}), 400

        typ = body.get('type')
        base64Image = body.get('base64Image')
        instruction = body.get('instruction', '')

        if not base64Image:
            return jsonify({"error": "Missing base64Image"}), 400

        if typ not in ('analyze', 'navigate'):
            return jsonify({"error": "Unsupported type. Use 'analyze' or 'navigate'."}), 400

        # For testing purposes, return mock responses that demonstrate the improved prompts
        if USE_MOCK:
            if typ == 'analyze':
                mock_response = """Looking ahead, you're facing a busy urban street with a wide sidewalk on the right side. There are several people walking along the sidewalk - two people are about 10 feet ahead walking in the same direction, and a person with a bag is approaching from the opposite direction about 15 feet away. The environment appears to be a commercial district with storefronts visible on the right side, including what looks like a shop with a red awning. The sidewalk is clear of major obstacles, with the edge of the street clearly defined by a curb to your left, and the path ahead looks safe to continue walking straight."""
            else:  # navigate
                mock_response = f"""Following your direction to '{instruction}', I can see the path ahead looks clear and safe. The sidewalk continues straight ahead with a few pedestrians maintaining good spacing - there's no immediate obstacles to worry about. The storefront on your right provides a good reference point, and the street curb on your left is well-defined. You can confidently continue straight ahead at a normal walking pace, and the next 20-30 feet of sidewalk appear obstacle-free."""
            
            return jsonify({"text": mock_response})

        # If we have a Netlify function URL, forward the request
        if NETLIFY_FUNCTION_URL:
            try:
                response = requests.post(
                    NETLIFY_FUNCTION_URL,
                    json=body,
                    headers={'Content-Type': 'application/json'},
                    timeout=30
                )
                if response.ok:
                    return jsonify(response.json())
                else:
                    return jsonify({"error": f"Netlify function error: {response.status_code}"}), 500
            except requests.RequestException as e:
                return jsonify({"error": f"Request failed: {str(e)}"}), 500

        return jsonify({"error": "No Watson backend configured. Set NETLIFY_FUNCTION_URL or use USE_MOCK=true"}), 500

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    port = int(os.getenv('PORT', 5001))  # Use 5001 to avoid conflicts
    print(f"Starting Simple Watson proxy on http://0.0.0.0:{port}")
    print(f"Mock mode: {USE_MOCK}")
    print(f"Netlify function URL: {NETLIFY_FUNCTION_URL or 'Not set'}")
    app.run(host='0.0.0.0', port=port, debug=True)
