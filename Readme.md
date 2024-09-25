# Local Video Indexing Script

This Python script allows you to download YouTube videos, process them using Google's Generative AI, and index the content for querying. It uses Pinecone for [vector storage](https://www.pinecone.io/learn/vector-database/) and retrieval using similarity search.

## Features

- Download YouTube videos
- Get the video's contents using [Google's GenerativeAI](https://aistudio.google.com/app/apikey?_gl=1*1mpwc9q*_ga*MTE1NjYyNzg2MC4xNzE1NTk2Mzg0*_ga_P1DBVKWT6V*MTcyMDg1NTYyOC4xNS4xLjE3MjA4NTU2MzEuNTcuMC44NTgxMTA0MDM.) api (It's free!).
- Index video content for [semantic search](https://www.pinecone.io/learn/vector-similarity/)
- Query indexed content based on user input

## Prerequisites

Before you begin, ensure you have met the following requirements:

- Python 3.10+
- pip (Python package manager)

## Installation

1. Clone this repository:
   ```
   git clone https://github.com/Druvith/video-query.git
   cd video-query
   ```

2. Navigate to the backend directory:
   ```
   cd backend
   ```

3. Create a virtual environment:
   ```
   python -m venv venv
   ```

4. Activate the virtual environment:
   - On macOS/Linux

   ```
   source venv/bin/activate
   ```

   - On windows:
   
   ```
   venv\Scripts\activate
   ```

5. Set up your environment variables:
   Create a `.env` file in the project root and add your API keys:
   ```
   GOOGLE_API_KEY=your_google_api_key
   OPENAI_API_KEY=your_openai_api_key
   PINECONE_API_KEY=your_pinecone_api_key
   ```

6. Install the required packages:
   ```
   pip install -r requirements.txt
   ```

7. Run the backend server:
   ```
   python app.py
   ```

The backend server should now be running at `http://127.0.0.1:5000`.

### Prerequisites

- Node.js (includes npm)

### Installation

1. **Navigate to the frontend directory**:
   ```sh
   cd frontend
   ```

2. **Install the dependencies**:
   ```sh
   npm install
   ```

3. **Start the frontend development server**:
   ```sh
   npm start
   ```

The frontend server should now be running at `http://localhost:3000`.

Follow the prompts to:
1. Enter a YouTube video URL
2. Wait for the video to be processed and the responses from the model to be indexed
3. Enter queries to search the video segment
4. Use play clip if you want play or download the video segment

## How it works

1. The script downloads the specified YouTube video
2. Google's Generative AI processes the video and generates structured descriptions
3. The descriptions are converted into embeddings using openai's ["text-embedding-3-small"](https://platform.openai.com/docs/guides/embeddings/what-are-embeddings) model and stored in Pinecone's Index.
4. User queries are converted to embeddings and used to search (using cosine similarity) the Pinecone index
5. The most relevant video segments are returned based on the query

## Additional Information

### Backend API Endpoints

- **Process Video**: `POST /process` 
- **Query Video**: `POST /query`
- **Create Clip**: `POST /clip`
- **Delete Index**: `POST /delete-index`

## Contributing

Contributions to this project are welcome. Please fork the repository and submit a pull request with your changes.

## License

This project is licensed under the MIT License.

## Acknowledgments

- Google Generative AI
- OpenAI
- Pinecone
- yt-dlp
- React
- Axios

