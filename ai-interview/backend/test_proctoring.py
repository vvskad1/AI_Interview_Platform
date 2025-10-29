#!/usr/bin/env python3
"""
Test proctoring functionality
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def test_proctor_event():
    """Test recording a proctoring event"""
    
    # Use an existing session (you can change this to a valid session ID)
    session_id = 12
    
    # Test tab hidden event
    print("🔍 Testing proctoring event recording...")
    
    payload = {
        "type": "tab_hidden",
        "present": False,
        "details": {
            "timestamp": 1697308800000
        }
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/proctor/{session_id}/event",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"📋 Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Proctor event recorded successfully!")
            print(f"📊 Risk Score: {result.get('risk', 0)}")
            return True
        else:
            print(f"❌ Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Exception: {str(e)}")
        return False

def test_proctor_event_visible():
    """Test tab visible event (should reduce risk)"""
    
    session_id = 12
    
    print("\n🔍 Testing tab visible event (risk reduction)...")
    
    payload = {
        "type": "tab_visible",
        "present": True,
        "details": {
            "timestamp": 1697308810000
        }
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/proctor/{session_id}/event",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"📋 Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Proctor event recorded successfully!")
            print(f"📊 Risk Score: {result.get('risk', 0)}")
            return True
        else:
            print(f"❌ Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Exception: {str(e)}")
        return False

if __name__ == "__main__":
    print("=" * 50)
    print("Testing Proctoring System")
    print("=" * 50)
    
    test1 = test_proctor_event()
    test2 = test_proctor_event_visible()
    
    print("\n" + "=" * 50)
    if test1 and test2:
        print("✅ All proctoring tests passed!")
    else:
        print("❌ Some tests failed")
    print("=" * 50)
