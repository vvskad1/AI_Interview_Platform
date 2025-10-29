import requests
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.config import settings

response = requests.get('https://api.groq.com/openai/v1/models', 
                       headers={'Authorization': f'Bearer {settings.groq_api_key}'})

if response.status_code == 200:
    models = response.json()['data']
    print('Available Groq models:')
    for model in models:
        if 'llama' in model['id'].lower() or 'mixtral' in model['id'].lower() or 'gemma' in model['id'].lower():
            print(f'- {model["id"]}')
else:
    print(f'Error: {response.status_code} - {response.text}')