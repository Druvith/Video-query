# Local Video Indexing Script

This Python script allows you to download YouTube videos, process them using Google's Generative AI, and index the content for querying. It uses Pinecone for [vector storage](https://www.pinecone.io/learn/vector-database/) and retrieval using similarity search.

## Features

- Download YouTube videos
- Get the video's contents using [Google's GenerativeAI](https://aistudio.google.com/app/apikey?_gl=1*1mpwc9q*_ga*MTE1NjYyNzg2MC4xNzE1NTk2Mzg0*_ga_P1DBVKWT6V*MTcyMDg1NTYyOC4xNS4xLjE3MjA4NTU2MzEuNTcuMC44NTgxMTA0MDM.) api (It's free!).
- Index video content for [semantic search](https://www.pinecone.io/learn/vector-similarity/)
- Query indexed content based on user input

## Prerequisites

Before you begin, ensure you have met the following requirements:

- Python 3.7+
- pip (Python package manager)

## Ongoing Development

Currently working on integrating a frontend and backend to enhance UX of this project.

## Installation

1. Clone this repository:
   ```
   git clone https://github.com/Druvith/Video_index.git
   cd Video_index
   ```

2. Install the required dependencies:
   ```
   pip install google-generativeai yt-dlp openai pinecone-client==4.1.0 pinecone-notebooks==0.1.1 python-dotenv
   ```

3. Set up your environment variables:
   Create a `.env` file in the project root and add your API keys:
   ```
   GOOGLE_API_KEY=your_google_api_key
   OPENAI_API_KEY=your_openai_api_key
   PINECONE_API_KEY=your_pinecone_api_key
   ```

## Usage

Run the script:

```
python main.py
```

Follow the prompts to:
1. Enter a YouTube video URL
2. Wait for the video to be processed and the responses from the model to be indexed
3. Enter queries to search the video content

## How it works

1. The script downloads the specified YouTube video
2. Google's Generative AI processes the video and generates structured descriptions
3. The descriptions are converted into embeddings using openai's ["text-embedding-3-small"](https://platform.openai.com/docs/guides/embeddings/what-are-embeddings) model and stored in Pinecone's Index.
4. User queries are converted to embeddings and used to search (using cosine similarity) the Pinecone index
5. The most relevant video segments are returned based on the query

## Contributing

Contributions to this project are welcome. Please fork the repository and submit a pull request with your changes.

## License

This project is licensed under the MIT License.

## Acknowledgments

- Google Generative AI
- OpenAI
- Pinecone
- yt-dlp

