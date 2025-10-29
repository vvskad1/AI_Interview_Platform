"""
Test script to verify job creation endpoint
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_create_job():
    """Test creating a job"""
    
    job_data = {
        "title": "Senior Software Engineer",
        "description": "We are looking for a senior software engineer with 5+ years experience in Python and FastAPI.",
        "requirements": ["Python", "FastAPI", "PostgreSQL"],
        "department": "Engineering",
        "level": "Senior",
        "status": "active"
    }
    
    print("🔍 Testing job creation endpoint...")
    print(f"📋 POST {BASE_URL}/api/admin/jobs")
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/admin/jobs",
            json=job_data,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"📊 Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Job created successfully!")
            print(f"📄 Job ID: {result.get('id')}")
            print(f"📄 Title: {result.get('title')}")
            return True
        else:
            print(f"❌ Error: {response.status_code}")
            print(f"📄 Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Exception: {str(e)}")
        return False


def test_list_jobs():
    """Test listing jobs"""
    
    print("\n🔍 Testing job list endpoint...")
    print(f"📋 GET {BASE_URL}/api/admin/jobs")
    
    try:
        response = requests.get(f"{BASE_URL}/api/admin/jobs")
        
        print(f"📊 Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Jobs retrieved successfully!")
            print(f"📄 Total jobs: {result.get('total', 0)}")
            return True
        else:
            print(f"❌ Error: {response.status_code}")
            print(f"📄 Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Exception: {str(e)}")
        return False


if __name__ == "__main__":
    print("=" * 50)
    print("Testing Jobs API")
    print("=" * 50)
    
    test1 = test_list_jobs()
    test2 = test_create_job()
    
    print("\n" + "=" * 50)
    if test1 and test2:
        print("✅ All tests passed!")
    else:
        print("❌ Some tests failed")
    print("=" * 50)
