# Local Video Indexing Script

# Dependencies to install:
# pip install google-generativeai yt-dlp openai pinecone-client==4.1.0 pinecone-notebooks==0.1.1

import os
import time
import json
import re
import ast
from uuid import uuid4
import google.generativeai as genai
import yt_dlp
from openai import OpenAI
from pinecone.grpc import PineconeGRPC as Pinecone
from pinecone import ServerlessSpec
from dotenv import load_dotenv
import warnings
import logging

# Configure logging
logging.basicConfig(level=logging.CRITICAL)
warnings.filterwarnings("ignore")

# Suppress Pinecone and other library logs
logging.getLogger("pinecone").setLevel(logging.ERROR)
logging.getLogger("openai").setLevel(logging.ERROR)
logging.getLogger("google.generativeai").setLevel(logging.ERROR)
logging.getLogger("urllib3").setLevel(logging.ERROR)
logging.getLogger("grpc").setLevel(logging.ERROR)

load_dotenv() # loads env variables from the dotenv file

GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
PINECONE_API_KEY = os.getenv('PINECONE_API_KEY')

genai.configure(api_key=GOOGLE_API_KEY)
client = OpenAI(api_key=OPENAI_API_KEY)
pc = Pinecone(api_key=PINECONE_API_KEY)


# Set up Pinecone index
index_name = "docs-quickstart-notebook"
cloud = "aws"  # or your preferred cloud provider
region = "us-east-1"  # or your preferred region
spec = ServerlessSpec(cloud, region)

# Create Pinecone index if it doesn't exist
if index_name not in pc.list_indexes().names():
    pc.create_index(
        name=index_name,
        dimension=1536,
        metric="cosine",
        spec=spec
    )
    while not pc.describe_index(index_name).status["ready"]:
        time.sleep(1)

class QuietLogger(object):
    def debug(self, msg):
        pass
    def warning(self, msg):
        pass
    def error(self, msg):
        pass

def download_youtube_video(video_url):
    ydl_opts = {
        'format': 'best',
        'outtmpl': '%(title)s.%(ext)s',
        'logger': QuietLogger(),
        'no_warnings': True,
        'quiet': True
    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        ydl.download([video_url])
    
    for file in os.listdir():
        if file.endswith('.mp4'):
            return file
    return None

# Function to get embeddings
def get_embedding(text, model="text-embedding-3-small"):
    return client.embeddings.create(input=text, model=model).data[0].embedding

# Function to convert string to dictionary
def convert_string_to_dict(input_string):
    cleaned_string = input_string.strip().removeprefix('```json').removesuffix('```').strip()
    try:
        return ast.literal_eval(cleaned_string)
    except (SyntaxError, ValueError):
        json_compatible_string = re.sub(r"'(\w+)':", r'"\1":', cleaned_string)
        json_compatible_string = re.sub(r"'([^']*)'", r'"\1"', json_compatible_string)
        json_compatible_string = re.sub(r",\s*([}\]])", r"\1", json_compatible_string)
        try:
            return json.loads(json_compatible_string)
        except json.JSONDecodeError as e:
            print(f"Error parsing JSON: {e}")
            return None
        
def process_and_index_video(video_file_name):
    try:
        # Upload file to Google AI
        video_file = genai.upload_file(path=video_file_name)
        print(f"File uploaded: {video_file.uri}")
        
        # Wait for processing
        while video_file.state.name == "PROCESSING":
            print(".", end='', flush=True)
            time.sleep(10)
            video_file = genai.get_file(video_file.name)
        
        if video_file.state.name == 'FAILED':
            print("Video processing failed")
            return False
        
        # Generate content
        prompt = """ # Structured Video Analysis Prompt

    Analyze the given video and provide a structured description in the following format:

    [
        {
            "start_time": "MM:SS",
            "end_time": "MM:SS",
            "description": "A detailed description of what happens in this segment.",
            "key_elements": ["list", "of", "key", "elements", "or", "concepts"]
        },
    ]


    Please follow these guidelines:

    1. Divide the video into meaningful segments, each typically 30 seconds to 1 minute long.
    2. For each segment, provide:
    - Precise start and end times in MM:SS format
    - A comprehensive description of the segment's content
    - A list of key elements or concepts present in the segment

    3. Ensure the descriptions cover:
    - Visual content (scenes, locations, objects, animals)
    - People and their actions
    - Any narration, dialogue, or significant audio
    - Notable cinematography or editing techniques

    4. In the key_elements list, include:
    - Important objects or animals
    - Significant actions or events
    - Relevant concepts or themes
    - Technical aspects (if notable)

    5. Make sure all segments are chronological and cover the entire duration of the video.

    Remember to be as detailed and precise as possible in your descriptions while maintaining the specified structure. """
        model = genai.GenerativeModel(model_name="models/gemini-1.5-flash")
        response = model.generate_content([prompt, video_file])
        
        # Process response
        video_segments = convert_string_to_dict(response.text)
        
        if not video_segments:
            print("Failed to process video segments")
            return False

        # Prepare data for Pinecone
        upsert_data = []
        for segment in video_segments:
            id = str(uuid4())
            embedding = get_embedding(segment['description'])
            metadata = {
                "start_time": segment['start_time'],
                "end_time": segment['end_time'],
                "description": segment['description'],
                "key_elements": ", ".join(segment['key_elements'])
            }
            upsert_data.append((id, embedding, metadata))
        
        
        # Upsert to Pinecone
        index = pc.Index(index_name)
        upsert = index.upsert(vectors=upsert_data)
        print("\nData upserted to Pinecone")
        return True
    except Exception as e:
        print(f"Error processing the video: {str(e)}")
        return False

def query_video_segments(query_text, top_k=1):
    index = pc.Index(index_name)
    query_embedding = get_embedding(query_text)
    query_response = index.query(
        vector=query_embedding,
        top_k=top_k,
        include_metadata=True
    )
    results = []
    for match in query_response['matches']:
        metadata = match['metadata']
        results.append({
            'start_time': metadata['start_time'],
            'end_time': metadata['end_time'],
            'description': metadata['description'],
            'score': match['score']
        })
    return results

def main():
    os.environ['GRPC_VERBOSITY'] = 'ERROR'
    video_url = input("\nEnter the youtube video to be downloaded: ")
    
    # Process and index the video (only needs to be done once)
    if process_and_index_video(video_url):
        print("Video processed and indexed successfully.")
    else:
        print("Failed to process and index the video.")
        return

    # Now you can query the index multiple times
    while True:
        query = input("\nEnter a query (or 'quit' to exit): ")
        if query.lower() == 'quit':
            break

        results = query_video_segments(query)
        for i, result in enumerate(results, 1):
            print(f"\nResult {i}:")
            print(f"Time: {result['start_time']} - {result['end_time']}")
            print(f"Description: {result['description']}")
            print(f"Similarity Score: {result['score']:.4f}")
            print("--" * 50)

    # Clean up (optional)
    pc.delete_index(index_name)

if __name__ == "__main__":
    main()