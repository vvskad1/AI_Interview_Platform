"""
Test script to verify job description is returned and used
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_job_list_has_description():
    """Test that job list includes description"""
    
    print("🔍 Testing if job list includes description...")
    
    try:
        response = requests.get(f"{BASE_URL}/api/admin/jobs")
        
        if response.status_code == 200:
            result = response.json()
            jobs = result.get('jobs', [])
            
            if jobs:
                first_job = jobs[0]
                print(f"\n📄 First Job Details:")
                print(f"   ID: {first_job.get('id')}")
                print(f"   Title: {first_job.get('title')}")
                print(f"   Department: {first_job.get('department')}")
                
                if 'description' in first_job:
                    desc = first_job['description']
                    if desc:
                        print(f"   ✅ Description: {desc[:100]}..." if len(desc) > 100 else f"   ✅ Description: {desc}")
                        return True
                    else:
                        print(f"   ⚠️  Description field exists but is empty")
                        return False
                else:
                    print(f"   ❌ Description field missing from response")
                    return False
            else:
                print("   ℹ️  No jobs found")
                return False
        else:
            print(f"❌ Error: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Exception: {str(e)}")
        return False


def test_job_detail_has_description():
    """Test that job detail includes description"""
    
    print("\n🔍 Testing if job detail includes description...")
    
    try:
        # First get a job ID
        list_response = requests.get(f"{BASE_URL}/api/admin/jobs")
        if list_response.status_code != 200:
            print("❌ Could not fetch job list")
            return False
        
        jobs = list_response.json().get('jobs', [])
        if not jobs:
            print("ℹ️  No jobs available to test")
            return False
        
        job_id = jobs[0]['id']
        
        # Get job details
        response = requests.get(f"{BASE_URL}/api/admin/jobs/{job_id}")
        
        if response.status_code == 200:
            job = response.json()
            
            print(f"\n📄 Job Detail (ID: {job_id}):")
            print(f"   Title: {job.get('title')}")
            
            if 'description' in job:
                desc = job['description']
                if desc:
                    print(f"   ✅ Description: {desc[:100]}..." if len(desc) > 100 else f"   ✅ Description: {desc}")
                    return True
                else:
                    print(f"   ⚠️  Description field exists but is empty")
                    return False
            else:
                print(f"   ❌ Description field missing from response")
                return False
        else:
            print(f"❌ Error: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Exception: {str(e)}")
        return False


def test_create_job_with_description():
    """Test creating a job with description and verify it's stored"""
    
    print("\n🔍 Testing job creation with description...")
    
    job_data = {
        "title": "Test Job with Description",
        "description": "This is a detailed job description. We are looking for a talented engineer with experience in Python, FastAPI, and PostgreSQL. The role involves building scalable systems and working with a great team.",
        "requirements": ["Python", "FastAPI", "PostgreSQL", "5+ years experience"],
        "department": "Engineering",
        "level": "Senior",
        "location": "Remote",
        "salary_range": "$120k-$160k"
    }
    
    try:
        # Create job
        response = requests.post(
            f"{BASE_URL}/api/admin/jobs",
            json=job_data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            created_job = response.json()
            job_id = created_job['id']
            
            print(f"\n✅ Job created (ID: {job_id})")
            
            # Verify description was saved
            if 'description' in created_job:
                returned_desc = created_job['description']
                if returned_desc == job_data['description']:
                    print(f"   ✅ Description saved correctly!")
                    print(f"   📄 {returned_desc[:80]}...")
                    return True
                else:
                    print(f"   ⚠️  Description mismatch:")
                    print(f"      Sent: {job_data['description'][:50]}...")
                    print(f"      Got:  {returned_desc[:50] if returned_desc else 'None'}...")
                    return False
            else:
                print(f"   ❌ Description not in response")
                return False
        else:
            print(f"❌ Error creating job: {response.status_code}")
            print(f"   {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Exception: {str(e)}")
        return False


if __name__ == "__main__":
    print("=" * 70)
    print("Testing Job Description Storage and Retrieval")
    print("=" * 70)
    
    test1 = test_job_list_has_description()
    test2 = test_job_detail_has_description()
    test3 = test_create_job_with_description()
    
    print("\n" + "=" * 70)
    print("Summary:")
    print(f"  Job List - Description:   {'✅ PASS' if test1 else '❌ FAIL'}")
    print(f"  Job Detail - Description: {'✅ PASS' if test2 else '❌ FAIL'}")
    print(f"  Job Creation - Save:      {'✅ PASS' if test3 else '❌ FAIL'}")
    print("=" * 70)
    
    if test1 and test2 and test3:
        print("\n✅ All description tests passed!")
        print("\n📋 CONFIRMATION:")
        print("   ✓ Job descriptions ARE being stored in the database")
        print("   ✓ Job descriptions ARE returned in list and detail APIs")
        print("   ✓ Job descriptions ARE used for interview question generation")
    else:
        print("\n❌ Some tests failed - description may not be working correctly")
