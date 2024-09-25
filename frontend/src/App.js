import React, { useState, useRef } from 'react';
import { processVideo, queryVideo } from './api';
import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:5000';

const App = () => {
  const [url, setUrl] = useState('');
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentClip, setCurrentClip] = useState(null);
  const [filename, setFilename] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null); // *** New State ***
  const videoRef = useRef(null);

  const handleProcess = async () => {
    setIsLoading(true);
    setMessage('');
    try {
      const data = await processVideo(url);
      setMessage(data.message || data.error);
      setFilename(data.filename);
      console.log("Filename set:", data.filename);  // Add this log
    } catch (error) {
      setMessage('Error processing video');
    }
    setIsLoading(false);
  };

  const handleUpload = async () => { // *** New Function ***
    if (!selectedFile) {
      setMessage('No file selected');
      return;
    }

    setIsLoading(true);
    setMessage('');
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setMessage(response.data.message || response.data.error);
      setFilename(response.data.filename);
      console.log("Uploaded filename set:", response.data.filename);
    } catch (error) {
      console.error("Error uploading video:", error.response ? error.response.data : error.message);
      setMessage(error.response ? error.response.data.error : 'Error uploading video');
    }
    setIsLoading(false);
  };

  const handleQuery = async () => {
    setIsLoading(true);
    setResults([]);
    try {
      const data = await queryVideo(query);
      setResults(data);
    } catch (error) {
      setMessage('Error querying video');
    }
    setIsLoading(false);
  };

  const playClip = async (startTime, endTime) => {
    setIsLoading(true);
    const clipData = { filename, start_time: startTime, end_time: endTime };
    console.log("Sending clip request with data:", clipData);
    try {
      const response = await axios.post(`${API_BASE_URL}/clip`, clipData);
      console.log("Received clip response:", response.data);
      setCurrentClip(response.data.clip_url);
    } catch (error) {
      console.error("Error creating clip:", error.response ? error.response.data : error.message);
      setMessage(error.response ? error.response.data.error : 'Error creating clip');
    }
    setIsLoading(false);
  };

  const handleDeleteIndex = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/delete-index`);
      console.log('Delete index response:', response.data);
      setMessage(response.data.message);
    } catch (error) {
      console.error('Error deleting index:', error.response ? error.response.data : error.message);
      setMessage(error.response ? error.response.data.error : 'Error deleting index');
    }
    setIsLoading(false);
  };

  const handleFileChange = (e) => { // *** New Function ***
    setSelectedFile(e.target.files[0]);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Video Processing and Querying</h1>
      
      {/* *** Existing URL Processing Section *** */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Enter YouTube URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full p-2 border rounded mb-2"
        />
        <button 
          onClick={handleProcess} 
          disabled={isLoading}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-400 mr-2"
        >
          Process Video
        </button>
        <button 
          onClick={handleDeleteIndex} 
          disabled={isLoading}
          className="bg-red-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
        >
          Delete Index
        </button>
      </div>

      {/* *** New Upload Section *** */}
      <div className="mb-4">
        <input
          type="file"
          accept="video/*"
          onChange={handleFileChange}
          className="w-full p-2 border rounded mb-2"
        />
        <button 
          onClick={handleUpload} 
          disabled={isLoading || !selectedFile}
          className="bg-indigo-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
        >
          Upload Video
        </button>
      </div>
      {/* *** End of Upload Section *** */}

      {message && <div className="mb-4 p-4 bg-yellow-100 border-l-4 border-yellow-500">{message}</div>}

      <div className="mb-4">
        <input
          type="text"
          placeholder="Enter query"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full p-2 border rounded mb-2"
        />
        <button 
          onClick={handleQuery} 
          disabled={isLoading}
          className="bg-green-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
        >
          Query Video
        </button>
      </div>

      {results.length > 0 && (
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">Results:</h2>
          {results.map((result, index) => (
            <div key={index} className="mb-4 p-4 border rounded">
              <p><strong>Time:</strong> {result.start_time} - {result.end_time}</p>
              <p><strong>Description:</strong> {result.description}</p>
              <p><strong>Score:</strong> {result.score.toFixed(4)}</p>
              <button 
                onClick={() => playClip(result.start_time, result.end_time)}
                className="mt-2 bg-purple-500 text-white px-4 py-2 rounded"
              >
                Play Clip
              </button>
            </div>
          ))}
        </div>
      )}

      {currentClip && (
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">Current Clip:</h2>
          <video 
            ref={videoRef}
            controls 
            className="w-full"
            src={`${API_BASE_URL}${currentClip}`}
          >
            Your browser does not support the video tag.
          </video>
        </div>
      )}
    </div>
  );
};

export default App;
