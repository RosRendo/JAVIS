import os
import google.generativeai as genai

api_key = os.environ.get("GEMINI_API_KEY", "")

if not api_key:
    print("Please set GEMINI_API_KEY environment variable or in .env")
else:
    print("Testing Gemini API Key...")
    genai.configure(api_key=api_key)

    models_to_test = ["gemini-1.5-flash", "gemini-3.5-flash"]

    for model_name in models_to_test:
        print(f"\n--- Testing model: {model_name} ---")
        try:
            model = genai.GenerativeModel(model_name)
            response = model.generate_content("Hello! Are you working?")
            print(f"SUCCESS! Response: {response.text}")
        except Exception as e:
            print(f"FAILED! Error: {e}")
