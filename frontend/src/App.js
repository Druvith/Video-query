// src/App.js
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './App.css'; // Ensure Tailwind CSS is imported here

const API_BASE_URL = 'http://127.0.0.1:5000';

const App = () => {
  const [activeTab, setActiveTab] = useState('youtube'); // 'youtube' or 'upload'
  const [url, setUrl] = useState('');
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState('');
  const [results, setResults] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isQuerying, setIsQuerying] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentClip, setCurrentClip] = useState(null);
  const [filename, setFilename] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [darkMode, setDarkMode] = useState(true); // Dark mode by default
  const videoRef = useRef(null);

  // Toggle dark mode by adding/removing 'dark' class on <html>
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    setMessage('');
    setResults([]);
    setCurrentClip(null);
  };

  const handleProcess = async (e) => {
    e.preventDefault();
    if (!url.trim()) {
      setMessage('Please enter a YouTube URL.');
      return;
    }

    setIsProcessing(true);
    setMessage('');
    try {
      const response = await axios.post(`${API_BASE_URL}/process`, { url });
      if (response.data.error) {
        setMessage(response.data.error);
      } else {
        setMessage(response.data.message);
        setFilename(response.data.filename);
      }
    } catch (error) {
      setMessage('Error processing video.');
    }
    setIsProcessing(false);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setMessage('Please select a video file to upload.');
      return;
    }

    setIsUploading(true);
    setMessage('');
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      if (response.data.error) {
        setMessage(response.data.error);
      } else {
        setMessage(response.data.message);
        setFilename(response.data.filename);
      }
    } catch (error) {
      setMessage('Error uploading video.');
    }
    setIsUploading(false);
  };

  const handleQuery = async (e) => {
    e.preventDefault();
    if (!query.trim()) {
      setMessage('Please enter a query.');
      return;
    }

    setIsQuerying(true);
    setResults([]);
    setMessage('');
    try {
      const response = await axios.post(`${API_BASE_URL}/query`, { query });
      if (response.data.error) {
        setMessage(response.data.error);
      } else {
        setResults(response.data);
      }
    } catch (error) {
      setMessage('Error querying video.');
    }
    setIsQuerying(false);
  };

  const playClip = async (startTime, endTime, videoFilename) => {
    const fileToUse = videoFilename || filename;

    if (!fileToUse) {
      setMessage('No video file available for clipping.');
      return;
    }

    setMessage('');
    const clipData = { filename: fileToUse, start_time: startTime, end_time: endTime };
    try {
      const response = await axios.post(`${API_BASE_URL}/clip`, clipData);
      if (response.data.error) {
        setMessage(response.data.error);
      } else {
        setCurrentClip(response.data.clip_url);
      }
    } catch (error) {
      setMessage('Error creating clip.');
    }
  };

  const handleDeleteIndex = async () => {
    setIsDeleting(true);
    setMessage('');
    try {
      const response = await axios.post(`${API_BASE_URL}/delete-index`);
      if (response.data.error) {
        setMessage(response.data.error);
      } else {
        setMessage(response.data.message);
      }
    } catch (error) {
      setMessage('Error deleting index.');
    }
    setIsDeleting(false);
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div className="min-h-screen bg-secondary dark:bg-primary transition-colors duration-300 relative">
      {/* Background Stars Animation */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(100)].map((_, index) => (
          <div
            key={index}
            className="star"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDuration: `${Math.random() * 3 + 2}s`,
            }}
          ></div>
        ))}
      </div>

      <div className="relative z-10 flex items-center justify-center p-4">
        <div className="bg-secondary dark:bg-primary shadow-lg rounded-lg p-8 w-full max-w-3xl">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-4xl font-ios text-text-primary dark:text-white">
              QUERY A VIDEO
            </h1>
            <button
              onClick={toggleDarkMode}
              className="bg-accent text-white p-2 rounded-full focus:outline-none hover:bg-accent/80 transition-colors duration-200"
              aria-label="Toggle Dark Mode"
            >
              {darkMode ? (
                // Sun Icon for Light Mode
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m8.66-11H21m-16.66 0H3m15.364-6.364l.707.707M6.343 17.657l.707.707M17.657 17.657l-.707.707M6.343 6.343l-.707.707" />
                  <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" />
                </svg>
              ) : (
                // Moon Icon for Dark Mode
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" />
                </svg>
              )}
            </button>
          </div>

          {/* Feedback Message */}
          {message && (
            <div className="mb-4 p-4 bg-yellow-100 dark:bg-yellow-200 border-l-4 border-yellow-500 text-gray-700 dark:text-gray-800 rounded">
              {message}
            </div>
          )}

          {/* Tabs for YouTube and Upload */}
          <div className="flex justify-center mb-6">
            <button
              onClick={() => handleTabSwitch('youtube')}
              className={`px-4 py-2 mr-2 rounded-t-lg focus:outline-none ${
                activeTab === 'youtube'
                  ? 'bg-accent text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              YouTube URL
            </button>
            <button
              onClick={() => handleTabSwitch('upload')}
              className={`px-4 py-2 rounded-t-lg focus:outline-none ${
                activeTab === 'upload'
                  ? 'bg-accent text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Upload Video
            </button>
          </div>

          {/* Active Tab Content */}
          {activeTab === 'youtube' && (
            <div className="space-y-4">
              {/* YouTube URL Processing */}
              <form onSubmit={handleProcess} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <input
                  type="url"
                  placeholder="Enter YouTube URL"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded mb-3 focus:outline-none focus:ring-2 focus:ring-accent dark:bg-gray-700 dark:text-white"
                  required
                  aria-label="YouTube URL"
                />
                {/* Submit Button Styled as a Minimalistic Button */}
                <button
                  type="submit"
                  disabled={isProcessing}
                  className={`w-full bg-accent text-white py-2 rounded hover:bg-accent/90 transition-colors duration-200 ${
                    isProcessing ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  aria-label="Process Video"
                >
                  {isProcessing ? 'Processing...' : 'Process Video'}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="space-y-4">
              {/* Local Video Upload */}
              <form onSubmit={handleUpload} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleFileChange}
                  className="w-full mb-3 text-gray-700 dark:text-gray-300"
                  required
                  aria-label="Upload Video"
                />
                {/* Submit Button Styled as a Minimalistic Button */}
                <button
                  type="submit"
                  disabled={isUploading || !selectedFile}
                  className={`w-full bg-accent text-white py-2 rounded hover:bg-accent/90 transition-colors duration-200 ${
                    isUploading || !selectedFile ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  aria-label="Upload Video"
                >
                  {isUploading ? 'Uploading...' : 'Upload Video'}
                </button>
              </form>
            </div>
          )}

          {/* Query Section */}
          <div className="mt-8 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <h2 className="text-2xl font-medium mb-2 text-text-primary dark:text-white">Query Video</h2>
            <form onSubmit={handleQuery} className="flex flex-col">
              <input
                type="text"
                placeholder="Enter your query"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded mb-3 focus:outline-none focus:ring-2 focus:ring-accent dark:bg-gray-700 dark:text-white"
                required
                aria-label="Video Query"
              />
              {/* Submit Button Styled as a Minimalistic Button */}
              <button
                type="submit"
                disabled={isQuerying}
                className={`w-full bg-accent text-white py-2 rounded hover:bg-accent/90 transition-colors duration-200 ${
                  isQuerying ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                aria-label="Submit Query"
              >
                {isQuerying ? 'Querying...' : 'Submit Query'}
              </button>
            </form>
          </div>

          {/* Results Section */}
          {results.length > 0 && (
            <div className="mt-8 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h2 className="text-2xl font-medium mb-4 text-text-primary dark:text-white">Results</h2>
              {results.map((result, index) => (
                <div key={index} className="mb-4 p-4 bg-white dark:bg-gray-700 rounded shadow">
                  <p className="text-text-primary dark:text-white"><strong>Time:</strong> {result.start_time} - {result.end_time}</p>
                  <p className="text-text-primary dark:text-white"><strong>Description:</strong> {result.description}</p>
                  <p className="text-text-primary dark:text-white"><strong>Score:</strong> {result.score.toFixed(4)}</p>
                  {/* Play Clip Button Styled as an Icon Button */}
                  <button
                    onClick={() => playClip(result.start_time, result.end_time, result.filename)}
                    className="mt-2 bg-accent text-white p-2 rounded-full hover:bg-accent/90 transition-colors duration-200"
                    aria-label="Play Clip"
                  >
                    {/* Play Icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-6.197-3.696A1 1 0 008 8.528v6.944a1 1 0 001.555.832l6.197-3.696a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Current Clip Section */}
          {currentClip && (
            <div className="mt-8 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h2 className="text-2xl font-medium mb-4 text-text-primary dark:text-white">Current Clip</h2>
              <video
                ref={videoRef}
                controls
                className="w-full rounded"
                src={`${API_BASE_URL}${currentClip}`}
              >
                Your browser does not support the video tag.
              </video>
            </div>
          )}

          {/* Delete Index Button - Positioned at Bottom Right */}
          <div className="fixed bottom-4 right-4">
            <button
              onClick={handleDeleteIndex}
              disabled={isDeleting}
              className={`bg-accent text-white p-3 rounded-full shadow-lg hover:bg-accent/90 transition-colors duration-200 ${
                isDeleting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              aria-label="Delete Index"
              title="Delete Index"
            >
              {/* Trash Can Icon */}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5-4h4a2 2 0 012 2v1H7V5a2 2 0 012-2zm5 4H7l1 12h10L19 7z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
