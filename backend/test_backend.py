import requests
import time

BASE_URL = 'http://127.0.0.1:5000'

def test_workflow():
    print("1. Testing Video Processing...")
    # Use a short video for testing
    url = "https://www.youtube.com/watch?v=jNQXAC9IVRw" # "Me at the zoo" - very short
    response = requests.post(f"{BASE_URL}/process", json={'url': url})
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    
    if response.status_code != 200:
        print("Processing failed, aborting.")
        return

    filename = response.json().get('filename')
    print(f"\nVideo processed: {filename}")

    print("\n2. Testing Query...")
    query_resp = requests.post(f"{BASE_URL}/query", json={'query': 'zoo'})
    print(f"Status: {query_resp.status_code}")
    results = query_resp.json()
    print(f"Results: {len(results)}")
    if results:
        print(f"Top result: {results[0]}")

    if results and filename:
        print("\n3. Testing Clip...")
        top_res = results[0]
        clip_req = {
            'filename': filename,
            'start_time': top_res['start_time'],
            'end_time': top_res['end_time']
        }
        clip_resp = requests.post(f"{BASE_URL}/clip", json=clip_req)
        print(f"Status: {clip_resp.status_code}")
        print(f"Response: {clip_resp.json()}")

if __name__ == "__main__":
    # Ensure server is running before executing this
    try:
        test_workflow()
    except Exception as e:
        print(f"Test failed: {e}")
