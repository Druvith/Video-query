import requests

BASE_URL = 'http://127.0.0.1:5000'

def test_process_video():
    url = f"{BASE_URL}/process"
    data = {'url': 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'}  # Replace with an actual YouTube URL
    response = requests.post(url, data=data)
    print(f"Process Video Response: {response.json()}")

def test_query_video():
    url = f"{BASE_URL}/query"
    data = {'query': 'get me the lyrics'}
    response = requests.post(url, json=data)
    print(f"Query Video Response: {response.json()}")

"""def test_clip_video():
    url = f"{BASE_URL}/clip"
    data = {
        'file': 'processed_video.mp4',  # Replace with an actual processed video filename
        'start_time': 10,
        'end_time': 20
    }
    response = requests.post(url, json=data)
    print(f"Clip Video Response: {response.json()}")"""

if __name__ == "__main__":
    test_process_video()
    test_query_video()
    #test_clip_video()