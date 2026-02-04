"""
Quick test to verify the server is working
Run this after starting the server to verify it's responding
"""
import requests
import sys

try:
    print("Testing server at http://localhost:8080...")
    response = requests.get("http://localhost:8080/health", timeout=2)
    
    if response.status_code == 200:
        print("✅ Server is running!")
        print(f"   Response: {response.json()}")
        sys.exit(0)
    else:
        print(f"❌ Server returned status {response.status_code}")
        sys.exit(1)
except requests.exceptions.ConnectionError:
    print("❌ Cannot connect to server")
    print("   Make sure the server is running: cd server && .\\start_server.ps1")
    sys.exit(1)
except Exception as e:
    print(f"❌ Error: {e}")
    sys.exit(1)

