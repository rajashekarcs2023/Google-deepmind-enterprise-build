from dotenv import load_dotenv
load_dotenv()
import os
from google import genai
from google.genai import types
import base64

client = genai.Client()

for model_name in ["gemini-3.5-flash", "gemini-2.5-flash"]:
    try:
        response = client.models.generate_content(
            model=model_name,
            contents="Say hello!",
            config=types.GenerateContentConfig(
                response_modalities=["AUDIO"],
                speech_config={"voice_config": {"prebuilt_voice_config": {"voice_name": "Aoede"}}}
            )
        )
        for part in response.candidates[0].content.parts:
            if part.inline_data:
                print(f"[{model_name}] Found Audio! Mime: {part.inline_data.mime_type}, len: {len(part.inline_data.data)}")
    except Exception as e:
        print(f"[{model_name}] Error: {e}")

