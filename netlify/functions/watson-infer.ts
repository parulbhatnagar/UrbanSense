import { Handler } from '@netlify/functions';

export const handler: Handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { type, base64Image, instruction } = JSON.parse(event.body || '{}');
    
    if (!base64Image) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing base64Image' })
      };
    }

    // Strip data URI prefix if present
    const cleanBase64 = base64Image.startsWith('data:') 
      ? base64Image.split(',')[1] 
      : base64Image;

    // Build prompt based on type
    const prompt = type === 'analyze' 
      ? 'Describe the scene in this image with spatial context. Keep it concise (2-3 sentences) and speak directly to the user.'
      : `You are a navigation assistant. The core instruction is: '${instruction}'. Use the image only to provide safety/contextual information (obstacles, clear path). Be concise and give a single direct command.`;

    // Call Watson API
    const watsonResponse = await fetch(`${process.env.WATSON_URL}/v1/projects/${process.env.WATSON_PROJECT_ID}/model_inference?version=2024-07-01`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.WATSON_API_KEY}`
      },
      body: JSON.stringify({
        model: process.env.WATSON_MODEL_ID,
        project: process.env.WATSON_PROJECT_ID,
        inputs: [
          { type: 'image', data: cleanBase64, mime: 'image/jpeg' },
          { type: 'text', text: prompt }
        ]
      })
    });

    if (!watsonResponse.ok) {
      throw new Error(`Watson API error: ${watsonResponse.status}`);
    }

    const result = await watsonResponse.json();
    let text = 'Unable to process image';
    
    if (result?.results?.length > 0) {
      text = result.results[0].generated_text || result.results[0].output || result.results[0].text || text;
    } else if (result?.text) {
      text = result.text;
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({ text })
    };

  } catch (error) {
    console.error('Watson function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
