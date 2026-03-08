import os
from dotenv import load_dotenv
from google import genai

def test_gemini_connection():
    # Load environment variables
    load_dotenv("../.env.local")
    
    api_key = os.getenv("NOTEBOOKLM_API_KEY")
    
    if not api_key:
        print("❌ Error: NOTEBOOKLM_API_KEY is empty in .env.local")
        return False
        
    print("Testing connection to Google Gemini API...")
    
    try:
        # Initialize the GenAI client
        client = genai.Client(api_key=api_key)
        
        # Test a simple prompt
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents='Bitte antworte nur mit dem exakten Wort "HELLO" und sonst nichts.'
        )
        
        output = response.text.strip()
        print(f"API Response: '{output}'")
        
        if "HELLO" in output.upper():
            print("✅ Gemini API Key: SUCCESS (NotebookLM wrapper is ready!)")
            return True
        else:
            print("⚠️ API Key connected, but unexpected response format.")
            return False
            
    except Exception as e:
        print(f"❌ Gemini API Key: FAILED ({str(e)})")
        return False

if __name__ == "__main__":
    test_gemini_connection()
