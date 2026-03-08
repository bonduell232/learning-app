import os
import requests
from dotenv import load_dotenv

def test_supabase_connection():
    # Load environment variables
    load_dotenv("../.env.local")
    
    url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    anon_key = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not service_role_key:
        print("❌ Error: SUPABASE_SERVICE_ROLE_KEY is empty in .env.local")
        return False
        
    print(f"Testing connection to: {url}")
    
    # 1. Test Anon Key via Auth Health-Check (REST schema is restricted to Service Role only)
    anon_headers = {
        "apikey": anon_key,
        "Authorization": f"Bearer {anon_key}"
    }
    
    try:
        anon_res = requests.get(f"{url}/auth/v1/health", headers=anon_headers)
        if anon_res.status_code == 200:
            print("✅ Anon Key: SUCCESS (Auth-Endpunkt erreichbar)")
        else:
            print(f"❌ Anon Key: FAILED (Status: {anon_res.status_code})")
    except Exception as e:
        print(f"❌ Anon Key: FAILED ({str(e)})")

    # 2. Test Service Role Key
    service_headers = {
        "apikey": service_role_key,
        "Authorization": f"Bearer {service_role_key}"
    }
    
    try:
        service_res =requests.get(f"{url}/rest/v1/", headers=service_headers)
        if service_res.status_code == 200:
            print("✅ Service Role Key: SUCCESS")
            return True
        else:
            print(f"❌ Service Role Key: FAILED (Status: {service_res.status_code})")
            return False
    except Exception as e:
        print(f"❌ Service Role Key: FAILED ({str(e)})")
        return False

if __name__ == "__main__":
    test_supabase_connection()
