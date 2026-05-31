import sys
import os
import json
import base64
from dotenv import load_dotenv
from google import genai

load_dotenv()

def main():
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print(json.dumps({"status": "error", "error": "GEMINI_API_KEY not found"}))
        sys.exit(1)

    with open("input.json", "r") as f:
        data = json.load(f)
    
    transcript = data.get("transcript", "")
    face_image_b64 = data.get("faceImage", "")
    
    if face_image_b64 and face_image_b64.startswith("data:image"):
        face_image_b64 = face_image_b64.split(",")[1]

    client = genai.Client()
    
    # 1. Multimodal Reasoning (Flash acts as Omni)
    contents = [
        f"You are a magical children's storyteller. The child's story is: '{transcript}'. First, write a fun, 4-line rhyming story involving the child. If an image is provided, describe the child from the image and put THEM in the story! Then, on a new line, write 'PROMPT:' followed by a highly descriptive Pixar-style image prompt for the scene featuring the child."
    ]

    if face_image_b64:
        contents.append(
            genai.types.Part.from_bytes(
                data=base64.b64decode(face_image_b64),
                mime_type="image/jpeg",
            )
        )

    response = client.models.generate_content(
        model="gemini-3.5-flash",
        contents=contents
    )
    
    text_out = response.text.strip()
    parts = text_out.split("PROMPT:")
    rhyme = parts[0].strip()
    image_prompt = parts[1].strip() if len(parts) > 1 else transcript

    # 2. Image Generation
    try:
        img_response = client.models.generate_content(
            model="gemini-3.1-flash-image-preview",
            contents=image_prompt,
        )
        image_bytes = img_response.candidates[0].content.parts[0].inline_data.data
        image_b64 = "data:image/png;base64," + base64.b64encode(image_bytes).decode('utf-8')
    except Exception as e:
        image_b64 = None

    # 3. Audio Generation (Using gTTS for 100% reliable, browser-compatible MP3 audio)
    try:
        from gtts import gTTS
        import io
        tts = gTTS(text=rhyme, lang='en', slow=False)
        fp = io.BytesIO()
        tts.write_to_fp(fp)
        fp.seek(0)
        audio_bytes = fp.read()
        audio_b64 = "data:audio/mpeg;base64," + base64.b64encode(audio_bytes).decode('utf-8')
    except Exception as e:
        audio_b64 = None

    print(json.dumps({"status": "success", "image": image_b64, "rhyme": rhyme, "audio": audio_b64}))

if __name__ == "__main__":
    main()
