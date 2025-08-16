from ibm_watsonx_ai import APIClient
from ibm_watsonx_ai import Credentials
from ibm_watsonx_ai.foundation_models import ModelInference
import base64

# 1. Setup your credentials
creds = Credentials(
    api_key="sK0-qJczXE83HUoPZvOKO7WepaizFsHFGW9gqS5sfCKN",
    url="https://us-south.ml.cloud.ibm.com"  # adjust region-based endpoint
)

# 2. Create the API client
client = APIClient(credentials=creds)
project_id = "00ff6717-02aa-4ae0-b773-246caf4b6ab0"

# 3. Initialize the Vision model for inference
vision_model = ModelInference(
    api_client=client,
    project_id=project_id,
    model_id="meta-llama/llama-3-2-90b-vision-instruct"
)

# 4. Load an image (e.g., for visual question answering)
image_path = "/Users/parul/DigitalEye/public/testData/delhi/MedicalStroe.png"
with open(image_path, "rb") as img_f:
    image_bytes = img_f.read()
    image_base64 = base64.b64encode(image_bytes).decode('utf-8')

# 5. Construct your prompt
prompt_text = "Describe the image in detail"

# 6. Call the model
response = vision_model.generate(
    prompt=prompt_text,
    params={
        "image": image_base64,
        "max_new_tokens": 512,
        "temperature": 0.7
    }
)

# 7. Process model output
if 'results' in response and len(response['results']) > 0:
    output = response['results'][0].get('generated_text') or response['results'][0]
    print("Output:", output)
else:
    print("Unexpected response:", response)
