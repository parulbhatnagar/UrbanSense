# DigitalEye Server - Watson AI Proxy

This directory contains the backend proxy servers for DigitalEye's IBM Watson AI integration.

## 📁 Files Overview

### **Production Files**
- `watson_proxy.py` - Full IBM Watson SDK integration with enhanced prompts
- `simple_watson_proxy.py` - Testing proxy with mock responses for development
- `requirements.txt` - Python dependencies (Flask, IBM Watson AI SDK)
- `.env.example` - Environment variable template

### **Configuration Files**
- `.env` - Local environment variables (not in git, create from .env.example)
- `watson_env/` - Python virtual environment (auto-generated)

## 🚀 Quick Start

### **1. Setup Python Environment**
```bash
# Create virtual environment with Python 3.10+
python3 -m venv watson_env
source watson_env/bin/activate  # Windows: watson_env\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### **2. Configure Environment**
```bash
# Copy template and edit with your Watson credentials
cp .env.example .env

# Edit .env with your IBM watsonx.ai credentials:
# WATSON_API_KEY=your_api_key
# WATSON_URL=your_watson_url
# WATSON_PROJECT_ID=your_project_id
# WATSON_MODEL_ID=meta-llama/llama-3-2-90b-vision-instruct
```

### **3. Run Development Server**

#### **Mock Mode (No Watson Credentials Needed)**
```bash
USE_MOCK=true PORT=5002 python3 simple_watson_proxy.py
```

#### **Real Watson Integration**
```bash
python3 watson_proxy.py
```

## 🔧 Server Details

### **watson_proxy.py**
- **Full Watson SDK**: Uses `ibm-watsonx-ai` Python SDK
- **Enhanced Prompts**: Detailed spatial awareness and navigation assistance
- **Environment Configuration**: Reads from `.env` file
- **Production Ready**: Handles authentication, error handling, CORS

### **simple_watson_proxy.py**
- **Mock Responses**: Provides realistic sample responses for testing
- **Netlify Forwarding**: Can forward requests to deployed Netlify functions
- **Development Testing**: Perfect for frontend development without Watson setup
- **Configurable**: Set `USE_MOCK=true/false` and `NETLIFY_FUNCTION_URL`

## 🎯 Enhanced AI Prompts

Both servers use improved prompts for better image descriptions:

### **Analyze (Explore Mode)**
```
You are a visual assistant for someone who needs detailed spatial awareness. 
Describe this scene focusing on: 
1) What's directly ahead and around
2) Any people, vehicles, or obstacles  
3) The type of environment (street, sidewalk, building, etc.)
4) Important spatial relationships and distances
Be descriptive but conversational, as if helping someone navigate the world. 
Provide 3-4 sentences with actionable detail.
```

### **Navigate Mode**
```
You are a navigation assistant helping someone follow this direction: "{instruction}". 
Look at the image and provide:
1) What you can see ahead that relates to the navigation instruction
2) Any obstacles, hazards, or people to be aware of
3) Confirmation if the path looks clear or what to watch for  
4) A specific next action based on what's visible
Be supportive and descriptive, giving confidence about the route ahead.
```

## 🌐 Integration

### **Local Development**
The Vite frontend (port 5173) proxies to these servers via `vite.config.ts`:
- `/api/watson/infer` → `http://127.0.0.1:5002` (or 5001)

### **Production Deployment**
In production, the app uses Netlify Functions instead of these servers:
- `netlify/functions/watson-infer.ts` - Serverless Watson proxy

## 🔒 Security

- **Environment Variables**: All credentials stored in `.env` (not committed)
- **CORS Enabled**: Allows frontend origin for development
- **Error Handling**: Sanitized error responses, no credential exposure
- **Proxy Pattern**: Keeps API keys server-side, never in browser

## 📊 API Endpoints

### **POST /api/watson/infer**
Analyzes images with Watson AI

**Request:**
```json
{
  "type": "analyze" | "navigate",
  "base64Image": "data:image/jpeg;base64,/9j/4AAQ...",
  "instruction": "turn left" // for navigate type
}
```

**Response:**
```json
{
  "text": "Looking ahead, you're facing a busy urban street..."
}
```

## 🛠️ Development Tips

1. **Start with Mock Mode**: Use `simple_watson_proxy.py` with `USE_MOCK=true`
2. **Test Prompts**: Check console output to see actual prompt being sent
3. **Debug Responses**: Enable Flask debug mode for detailed error info
4. **Port Conflicts**: Change `PORT` environment variable if 5001/5002 are busy
5. **Virtual Environment**: Always activate `watson_env` before running servers

## 📝 Dependencies

- **Flask 3.1+**: Web framework
- **Flask-CORS**: Cross-origin resource sharing
- **IBM watsonx.ai 1.3+**: IBM Watson AI SDK (requires Python 3.10+)
- **Requests**: HTTP client for Netlify function forwarding

---

**Part of the DigitalEye AI-powered visual assistance application**
