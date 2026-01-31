import React, { useState, useRef, useEffect } from 'react';
import { processVideo, uploadVideo, queryVideo, createClip, deleteIndex } from './api';
import './App.css';

// --- ICONS ---
const IconLogo = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
    <rect x="2" y="2" width="20" height="20" rx="0" ry="0"></rect>
    <path d="M10 8l6 4l-6 4v-8z" fill="currentColor" stroke="none"></path>
  </svg>
);

const IconUpload = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="17 8 12 3 7 8"></polyline>
    <line x1="12" y1="3" x2="12" y2="15"></line>
  </svg>
);

const IconSearch = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

const IconPlay = () => (
  <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
    <path d="M6 4l12 8l-12 8z"></path>
  </svg>
);

const IconDownloadSegment = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="7 10 12 15 17 10"></polyline>
    <line x1="12" y1="15" x2="12" y2="3"></line>
  </svg>
);

const IconClose = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

// --- HELPER FUNCTIONS ---
const formatTimestamp = (start, end) => {
  return `${start} - ${end}`;
};

function App() {
  // State
  const [viewState, setViewState] = useState('upload'); 
  const [videoUrl, setVideoUrl] = useState('');
  const [isValidUrl, setIsValidUrl] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [clipUrl, setClipUrl] = useState(null);
  const [currentSegment, setCurrentSegment] = useState(null);

  // Refs
  const fileInputRef = useRef(null);
  const searchInputRef = useRef(null);

  const steps = [
    { label: 'Retrieving source material', sub: 'Downloading from remote origin...' },
    { label: 'Preparing analysis proxy', sub: 'Optimizing for the digital oracle...' },
    { label: 'Consulting the Oracle', sub: 'Analyzing semantic composition...' },
    { label: 'Cataloging vectors', sub: 'Finalizing the search index...' }
  ];

  // URL Validation
  useEffect(() => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
    const fileRegex = /\.(mp4|mov|avi|webm)$/i;
    setIsValidUrl(youtubeRegex.test(videoUrl) || fileRegex.test(videoUrl));
  }, [videoUrl]);

  // Simulated Progress Logic
  useEffect(() => {
    let interval;
    if (viewState === 'loading') {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep(prev => (prev < steps.length - 1 ? prev + 1 : prev));
      }, 6000);
    }
    return () => clearInterval(interval);
  }, [viewState]);

  // --- ACTIONS ---

  const handleProcessUrl = async () => {
    if (!isValidUrl) return;
    try {
      setViewState('loading');
      await processVideo(videoUrl);
      setViewState('dashboard');
    } catch (error) {
      console.error(error);
      setViewState('upload');
      alert('Error processing video: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setViewState('loading');
      await uploadVideo(file);
      setViewState('dashboard');
    } catch (error) {
      console.error(error);
      setViewState('upload');
      alert('Error uploading video: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleSearch = async (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      setIsSearching(true);
      try {
        const data = await queryVideo(searchQuery);
        setResults(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsSearching(false);
      }
    }
  };

  const handleResultClick = async (item) => {
    setClipUrl(null);
    setCurrentSegment(item);
    setModalOpen(true);

    try {
        const res = await createClip(item.filename, item.start_time, item.end_time);
        const fullClipUrl = `http://127.0.0.1:5000${res.clip_url}`;
        setClipUrl(fullClipUrl);
    } catch (error) {
        console.error("Error clipping video:", error);
        alert("Could not load clip.");
        setModalOpen(false);
    }
  };

  const handleDownload = async (e, item) => {
    e.stopPropagation();
    try {
        const res = await createClip(item.filename, item.start_time, item.end_time);
        const fullClipUrl = `http://127.0.0.1:5000${res.clip_url}`;
        const a = document.createElement('a');
        a.href = fullClipUrl;
        a.download = `clip_${item.start_time}_${item.end_time}.mp4`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    } catch (error) {
        console.error("Download failed:", error);
        alert("Download failed.");
    }
  };

  const [suggestedQueries, setSuggestedQueries] = useState([]);
  
  useEffect(() => {
    if (results.length > 0) {
        const allKeywords = results.flatMap(r => r.keywords || []);
        const uniqueKeywords = [...new Set(allKeywords)].slice(0, 3);
        const suggestions = uniqueKeywords.map(k => `Tell me more about ${k.toLowerCase()}`);
        setSuggestedQueries(suggestions);
    } else {
        setSuggestedQueries([]);
    }
  }, [results]);

  const handleReset = async () => {
    if (window.confirm('Are you sure you want to clear the index and start over?')) {
        try {
            await deleteIndex();
            setResults([]);
            setSearchQuery('');
            setVideoUrl('');
            setViewState('upload');
        } catch(e) {
            console.error(e);
        }
    }
  };

  const [dragOver, setDragOver] = useState(false);
  const onDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const onDragLeave = (e) => { e.preventDefault(); setDragOver(false); };
  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
       const file = e.dataTransfer.files[0];
       (async () => {
        try {
            setViewState('loading');
            await uploadVideo(file);
            setViewState('dashboard');
          } catch (error) {
            console.error(error);
            setViewState('upload');
            alert('Error uploading video: ' + (error.response?.data?.error || error.message));
          }
       })();
    }
  };

  useEffect(() => {
    if (viewState === 'dashboard' && searchInputRef.current) {
        searchInputRef.current.focus();
    }
  }, [viewState]);

  return (
    <div className="flex flex-col min-h-screen font-sans text-text-main">
      <header className={`py-8 border-b transition-colors duration-300 ${viewState === 'dashboard' ? 'border-border-subtle' : 'border-transparent'}`}>
        <div className="container mx-auto px-8 flex justify-between items-center max-w-5xl">
          <a href="/" className="flex items-center gap-2 font-serif text-2xl font-bold text-text-main no-underline">
            <IconLogo />
            Video Query <span className="text-accent-primary">.</span>
          </a>
          {viewState === 'dashboard' && (
            <button onClick={handleReset} className="bg-transparent border border-border-subtle px-4 py-2 rounded text-text-muted hover:border-accent-primary hover:text-accent-primary transition-all text-sm cursor-pointer">
              Clear Index
            </button>
          )}
        </div>
      </header>

      <main className="container mx-auto px-8 max-w-5xl flex-1 flex flex-col">
        {viewState === 'upload' && (
          <section className="flex-1 flex items-center justify-center py-16 animate-fade-in">
            <div 
                className={`bg-canvas border border-dashed rounded-xl p-16 text-center w-full max-w-2xl transition-all duration-300 relative ${dragOver ? 'border-accent-secondary bg-opacity-50 bg-teal-50' : 'border-border-subtle'}`}
                onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
            >
              <div className="text-accent-secondary opacity-80 mb-6 flex justify-center">
                <IconUpload />
              </div>
              <h1 className="text-4xl font-serif font-semibold text-text-main mb-4">Index Semantic Content</h1>
              <p className="text-text-muted mb-10">Upload a local video or paste a YouTube URL to begin analysis.</p>
              <div className="flex flex-col md:flex-row gap-2 mt-8 relative">
                <input 
                    type="text" className="flex-1 p-4 border border-border-subtle rounded bg-panel text-text-main focus:outline-none focus:border-text-main transition-colors"
                    placeholder="Paste YouTube URL here..." value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)}
                />
                <button 
                    onClick={handleProcessUrl} disabled={!isValidUrl}
                    className={`px-8 py-4 rounded font-medium transition-all whitespace-nowrap ${isValidUrl ? 'bg-accent-primary text-white hover:bg-accent-primary-hover cursor-pointer' : 'bg-panel text-text-muted cursor-not-allowed opacity-50'}`}
                >
                    Index Video
                </button>
              </div>
              <div className="my-8 flex items-center justify-center relative opacity-60">
                <div className="absolute w-1/3 h-px bg-border-subtle left-0"></div>
                <span className="font-serif italic text-text-muted px-4 bg-canvas z-10">or drag and drop MP4</span>
                <div className="absolute w-1/3 h-px bg-border-subtle right-0"></div>
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept="video/*" onChange={handleFileUpload} />
              <button onClick={() => fileInputRef.current?.click()} className="text-sm text-text-muted underline hover:text-accent-primary">Browse Files</button>
            </div>
          </section>
        )}

        {viewState === 'loading' && (
          <section className="flex-1 flex flex-col items-center justify-center py-16 animate-fade-in">
            <div className="w-16 h-16 border-2 border-panel border-t-accent-primary rounded-full animate-spin mb-12"></div>
            <div className="w-full max-w-md space-y-8">
              {steps.map((step, index) => (
                <div key={index} className={`flex items-start gap-4 transition-all duration-500 ${index === loadingStep ? 'opacity-100 scale-100' : index < loadingStep ? 'opacity-40 scale-95' : 'opacity-20 scale-90'}`}>
                  <div className={`mt-1 w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${index <= loadingStep ? 'border-accent-primary bg-accent-primary text-white' : 'border-border-subtle'}`}>
                    {index < loadingStep ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg> : <span className="text-[10px] font-mono">{index + 1}</span>}
                  </div>
                  <div>
                    <h3 className={`font-serif text-lg leading-none mb-1 ${index === loadingStep ? 'text-text-main' : 'text-text-muted'}`}>{step.label}</h3>
                    <p className="text-xs font-mono text-text-muted opacity-80 italic">{index === loadingStep ? step.sub : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {viewState === 'dashboard' && (
          <section className="pb-16 animate-fade-in">
            <div className="sticky top-0 bg-canvas z-10 py-4 mb-8 border-b border-transparent focus-within:border-accent-primary transition-colors">
                <div className="relative">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"><IconSearch /></div>
                    <input 
                        ref={searchInputRef} type="text" className="w-full pl-14 pr-6 py-5 text-xl font-serif border-b border-border-subtle bg-transparent text-text-main focus:outline-none placeholder-border-subtle"
                        placeholder="Ask a question about the video..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={handleSearch}
                    />
                </div>
                {suggestedQueries.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2 animate-fade-in">
                        {suggestedQueries.map((q, i) => (
                            <button 
                                key={i} onClick={() => { setSearchQuery(q); (async () => { setIsSearching(true); try { const data = await queryVideo(q); setResults(data); } catch (e) { console.error(e); } finally { setIsSearching(false); } })(); }}
                                className="text-xs font-mono px-3 py-1.5 rounded-full border border-border-subtle text-text-muted hover:border-accent-primary hover:text-accent-primary transition-all"
                            >{q}</button>
                        ))}
                    </div>
                )}
            </div>
            {results.length > 0 && <div className="flex justify-between items-center mb-6 text-text-muted text-sm animate-fade-in"><span>Found <strong>{results.length}</strong> segments</span><span className="font-mono text-xs opacity-70">SORTED BY RELEVANCE</span></div>}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {results.map((item) => (
                    <div key={item.id} onClick={() => handleResultClick(item)} className="group bg-canvas rounded-lg overflow-hidden cursor-pointer hover:-translate-y-1 hover:shadow-card transition-all duration-300 border border-transparent hover:border-border-subtle">
                        <div className="relative aspect-video bg-panel overflow-hidden flex items-center justify-center">
                             {item.thumbnail ? <img src={item.thumbnail} alt={item.keywords?.[0]} className="w-full h-full object-cover sepia-[0.3] brightness-[0.9] transition-all duration-300 group-hover:sepia-0 group-hover:brightness-100" /> : <><div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-accent-secondary to-transparent"></div><svg className="w-12 h-12 text-text-muted opacity-20" fill="currentColor" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg></>}
                             <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"><div className="w-12 h-12 bg-canvas rounded-full flex items-center justify-center text-text-main shadow-lg"><IconPlay /></div></div>
                        </div>
                        <div className="p-5">
                            <div className="flex justify-between items-baseline mb-2"><span className="text-xs font-mono text-accent-primary bg-accent-primary/10 px-2 py-0.5 rounded">{formatTimestamp(item.start_time, item.end_time)}</span><span className="text-xs font-mono text-accent-secondary">{Math.round(item.score * 100)}% MATCH</span></div>
                            <h3 className="font-serif text-lg text-text-main mb-2 line-clamp-1">{item.keywords && item.keywords[0] ? item.keywords[0] : 'Video Segment'}</h3>
                            <div className="flex justify-between items-end mt-4">
                                <p className="text-sm text-text-muted leading-relaxed line-clamp-2 flex-1">{item.description}</p>
                                <button onClick={(e) => handleDownload(e, item)} className="ml-4 p-2 text-text-muted hover:text-accent-primary hover:bg-accent-primary/5 rounded-full transition-all" title="Download Segment"><IconDownloadSegment /></button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            {results.length === 0 && !isSearching && searchQuery && <div className="text-center py-20 text-text-muted">No results found. Try a different query.</div>}
            {isSearching && <div className="text-center py-20 text-text-muted">Searching...</div>}
          </section>
        )}
      </main>

      <footer className="mt-auto py-8 text-center text-sm text-text-muted border-t border-border-subtle">
        <div className="container mx-auto">&copy; {new Date().getFullYear()} Video Query. Local-first AI Architecture.</div>
      </footer>

      {modalOpen && (
        <div className="fixed inset-0 bg-overlay flex items-center justify-center z-50 animate-fade-in" onClick={() => setModalOpen(false)}>
            <div className="bg-black w-[90%] max-w-4xl aspect-video shadow-2xl relative rounded overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent z-10 flex justify-between items-start pointer-events-none">
                    <div className="text-white pointer-events-auto max-w-[80%]">
                        {currentSegment && (
                            <>
                                <h3 className="font-serif text-xl leading-tight mb-1 opacity-90">{currentSegment.keywords && currentSegment.keywords[0] ? currentSegment.keywords[0] : 'Video Segment'}</h3>
                                <p className="text-sm text-white/70 line-clamp-1 mb-2 font-sans">{currentSegment.description}</p>
                                <p className="font-mono text-xs text-accent-primary bg-accent-primary/10 inline-block px-2 py-0.5 rounded">{formatTimestamp(currentSegment.start_time, currentSegment.end_time)}</p>
                            </>
                        )}
                    </div>
                    <div className="flex items-center gap-4 pointer-events-auto">
                        <button 
                            onClick={(e) => handleDownload(e, currentSegment)}
                            className="text-white/70 hover:text-accent-primary flex items-center gap-2 text-sm transition-colors"
                            title="Download Segment"
                        >
                            Download <IconDownloadSegment />
                        </button>
                        <button 
                            onClick={() => setModalOpen(false)}
                            className="text-white/70 hover:text-white flex items-center gap-2 text-sm transition-colors"
                        >
                            Close <IconClose />
                        </button>
                    </div>
                </div>
                {clipUrl ? <video key={clipUrl} src={clipUrl} controls autoPlay className="w-full h-full object-contain shadow-2xl"><source src={clipUrl} type="video/mp4" />Your browser does not support the video tag.</video> : <div className="w-full h-full flex items-center justify-center text-white"><div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin"></div></div>}
            </div>
        </div>
      )}
    </div>
  );
}

export default App;
