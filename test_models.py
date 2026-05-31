from dotenv import load_dotenv
load_dotenv()
import os
from google import genai
client = genai.Client()
for m in client.models.list_models():
    if 'tts' in m.name.lower():
        print(m.name)
