import React, { useState, useRef, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useParams, useNavigate } from 'react-router-dom';
import {
  API_BASE_URL,
  getProjects,
  getProject,
  deleteProject,
  processVideo,
  uploadVideo,
  queryVideo,
  createClip
} from './api';
import './App.css';

// --- ICONS ---
const IconLogo = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
    <rect x="2" y="2" width="20" height="20" rx="0" ry="0"></rect>
    <path d="M10 8l6 4l-6 4v-8z" fill="currentColor" stroke="none"></path>
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

const IconTrash = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </svg>
);

const IconArrowLeft = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"></line>
    <polyline points="12 19 5 12 12 5"></polyline>
  </svg>
);


// --- HELPER FUNCTIONS ---
const formatTimestamp = (start, end) => {
  return `${start} - ${end}`;
};

const getPrimaryKeyword = (segment) => {
  const keyword = segment?.keywords?.find((k) => typeof k === 'string' && k.trim());
  return keyword ? keyword.trim() : 'Clip Segment';
};

// --- COMPONENTS ---

const Header = ({ title, showBack }) => (
  <header className="py-6 border-b border-border-subtle bg-canvas sticky top-0 z-20">
    <div className="container mx-auto px-6 flex justify-between items-center max-w-6xl">
        <div className="flex items-center gap-4">
            {showBack && (
                <Link to="/" className="text-text-muted hover:text-text-main transition-colors">
                    <IconArrowLeft />
                </Link>
            )}
            <Link to="/" className="flex items-center gap-2 font-serif text-xl font-bold text-text-main no-underline">
                <IconLogo />
                Video Query <span className="text-accent-primary">.</span>
            </Link>
        </div>
        {title && <span className="text-sm font-mono text-text-muted bg-panel px-3 py-1 rounded-full">{title}</span>}
    </div>
  </header>
);

const LoadingScreen = () => {
    const [step, setStep] = useState(0);
    const steps = [
        { label: 'Retrieving source material', sub: 'Downloading from remote origin...' },
        { label: 'Preparing analysis proxy', sub: 'Optimizing for the digital oracle...' },
        { label: 'Consulting the Oracle', sub: 'Analyzing semantic composition...' },
        { label: 'Cataloging vectors', sub: 'Finalizing the search index...' }
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setStep(prev => (prev < steps.length - 1 ? prev + 1 : prev));
        }, 6000);
        return () => clearInterval(interval);
    }, [steps.length]);

    return (
        <div className="flex-1 flex flex-col items-center justify-center py-20 animate-fade-in">
            <div className="w-16 h-16 border-2 border-panel border-t-accent-primary rounded-full animate-spin mb-12"></div>
            <div className="w-full max-w-md space-y-8">
                {steps.map((s, index) => (
                    <div key={index} className={`flex items-start gap-4 transition-all duration-500 ${index === step ? 'opacity-100 scale-100' : index < step ? 'opacity-40 scale-95' : 'opacity-20 scale-90'}`}>
                        <div className={`mt-1 w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${index <= step ? 'border-accent-primary bg-accent-primary text-white' : 'border-border-subtle'}`}>
                            {index < step ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg> : <span className="text-[10px] font-mono">{index + 1}</span>}
                        </div>
                        <div>
                            <h3 className={`font-serif text-lg leading-none mb-1 ${index === step ? 'text-text-main' : 'text-text-muted'}`}>{s.label}</h3>
                            <p className="text-xs font-mono text-text-muted opacity-80 italic">{index === step ? s.sub : ''}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const ProjectList = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [videoUrl, setVideoUrl] = useState('');
  const [isValidUrl, setIsValidUrl] = useState(false);
  const [processing, setProcessing] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
    const fileRegex = /\.(mp4|mov|avi|webm)$/i;
    setIsValidUrl(youtubeRegex.test(videoUrl) || fileRegex.test(videoUrl));
  }, [videoUrl]);

  const fetchProjects = async () => {
    try {
      const data = await getProjects();
      setProjects(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessUrl = async () => {
    if (!isValidUrl) return;
    setProcessing(true);
    try {
      const res = await processVideo(videoUrl);
      navigate(`/project/${res.project_id}`);
    } catch (error) {
      console.error(error);
      alert('Error: ' + (error.response?.data?.error || error.message));
      setProcessing(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProcessing(true);
    try {
      const res = await uploadVideo(file);
      navigate(`/project/${res.project_id}`);
    } catch (error) {
      console.error(error);
      alert('Error: ' + (error.response?.data?.error || error.message));
      setProcessing(false);
    }
  };

  const handleDelete = async (e, id) => {
    e.preventDefault();
    if (window.confirm('Delete this project?')) {
        await deleteProject(id);
        fetchProjects();
    }
  };

  if (processing) return <LoadingScreen />;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="container mx-auto px-6 py-12 max-w-6xl">

        {/* Upload Section */}
        <section className="mb-16 animate-fade-in">
          <div className="bg-canvas border border-dashed border-border-subtle rounded-xl p-12 text-center hover:border-accent-primary transition-colors duration-300">
            <h2 className="text-2xl font-serif font-semibold text-text-main mb-4">New Project</h2>
            <div className="max-w-xl mx-auto flex gap-2">
                <input
                    type="text" className="flex-1 p-3 border border-border-subtle rounded bg-panel text-text-main focus:outline-none focus:border-text-main transition-colors"
                    placeholder="Paste YouTube URL..." value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)}
                />
                <button
                    onClick={handleProcessUrl} disabled={!isValidUrl}
                    className={`px-6 py-3 rounded font-medium transition-all ${isValidUrl ? 'bg-accent-primary text-white hover:bg-accent-primary-hover' : 'bg-panel text-text-muted cursor-not-allowed'}`}
                >
                    Index
                </button>
            </div>
            <div className="mt-4 text-sm text-text-muted">
                or <button onClick={() => fileInputRef.current?.click()} className="underline hover:text-accent-primary">upload a file</button>
                <input type="file" ref={fileInputRef} className="hidden" accept="video/*" onChange={handleFileUpload} />
            </div>
          </div>
        </section>

        {/* Projects Grid */}
        <h3 className="text-lg font-mono text-text-muted mb-6 uppercase tracking-wider">Library</h3>
        {loading ? (
            <div className="text-center py-10 text-text-muted">Loading projects...</div>
        ) : projects.length === 0 ? (
            <div className="text-center py-10 text-text-muted italic">No projects yet. Create one above.</div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((p) => (
                    <Link to={`/project/${p.id}`} key={p.id} className="group block bg-panel rounded-lg border border-transparent hover:border-border-subtle hover:shadow-card transition-all overflow-hidden relative">
                        <div className="aspect-video bg-black/5 flex items-center justify-center relative">
                             {/* Placeholder or actual thumbnail if we stored one at project level */}
                             <div className="text-4xl text-text-muted opacity-20 font-serif">Aa</div>
                             <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
                        </div>
                        <div className="p-4">
                            <h4 className="font-serif text-lg text-text-main mb-1 truncate" title={p.name}>{p.name}</h4>
                            <div className="flex justify-between items-center mt-4">
                                <span className={`text-xs font-mono px-2 py-0.5 rounded ${p.status === 'ready' ? 'bg-green-500/10 text-green-600' : 'bg-yellow-500/10 text-yellow-600'}`}>{p.status}</span>
                                <span className="text-xs text-text-muted">{new Date(p.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                        <button
                            onClick={(e) => handleDelete(e, p.id)}
                            className="absolute top-2 right-2 p-2 bg-canvas/80 rounded-full text-text-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <IconTrash />
                        </button>
                    </Link>
                ))}
            </div>
        )}
      </main>
    </div>
  );
};

const ProjectDetail = () => {
    const { id } = useParams();
    const [project, setProject] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [clipUrl, setClipUrl] = useState(null);
    const [currentSegment, setCurrentSegment] = useState(null);
    const searchInputRef = useRef(null);

    useEffect(() => {
        getProject(id).then(setProject).catch(console.error);
    }, [id]);

    const handleSearch = async (e) => {
        if (e.key === 'Enter' && searchQuery.trim()) {
          setIsSearching(true);
          try {
            const data = await queryVideo(id, searchQuery);
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
            const res = await createClip(id, item.start_time, item.end_time);
            const fullClipUrl = new URL(res.clip_url, API_BASE_URL).toString();
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
            const res = await createClip(id, item.start_time, item.end_time);
            const fullClipUrl = new URL(res.clip_url, API_BASE_URL).toString();
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

    const suggestedQueries = results.length > 0
        ? [...new Set(results.flatMap(r => r.keywords || []))].slice(0, 5).map(k => `Show me ${k.toLowerCase()}`)
        : [];

    if (!project) return <div className="p-10 text-center">Loading project...</div>;

    return (
        <div className="flex flex-col min-h-screen">
            <Header title={project.name} showBack />
            <main className="container mx-auto px-6 py-8 max-w-6xl flex-1 flex flex-col">
                <div className="sticky top-20 bg-canvas z-10 py-4 mb-8">
                    <div className="relative group">
                        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none group-focus-within:text-accent-primary transition-colors"><IconSearch /></div>
                        <input
                            ref={searchInputRef} type="text"
                            className="w-full pl-14 pr-6 py-4 text-xl font-serif border border-border-subtle rounded-lg bg-panel text-text-main focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all shadow-sm"
                            placeholder={`Ask a question about "${project.name}"...`}
                            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={handleSearch} autoFocus
                        />
                    </div>
                    {suggestedQueries.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2 animate-fade-in">
                            {suggestedQueries.map((q, i) => (
                                <button
                                    key={i} onClick={() => { setSearchQuery(q); (async () => { setIsSearching(true); try { const data = await queryVideo(id, q); setResults(data); } catch (e) { console.error(e); } finally { setIsSearching(false); } })(); }}
                                    className="text-xs font-mono px-3 py-1.5 rounded-full border border-border-subtle text-text-muted hover:border-accent-primary hover:text-accent-primary transition-all bg-panel"
                                >{q}</button>
                            ))}
                        </div>
                    )}
                </div>

                {isSearching && <div className="text-center py-20 text-text-muted animate-pulse">Searching the index...</div>}

                {!isSearching && results.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fade-in">
                        {results.map((item) => (
                            <div key={item.id} onClick={() => handleResultClick(item)} className="group bg-canvas rounded-lg overflow-hidden cursor-pointer hover:-translate-y-1 hover:shadow-card transition-all duration-300 border border-transparent hover:border-border-subtle">
                                <div className="relative aspect-video bg-panel overflow-hidden flex items-center justify-center">
                                    {item.thumbnail ? <img src={item.thumbnail} alt={item.keywords?.[0]} className="w-full h-full object-cover" /> : <div className="text-text-muted opacity-20"><IconPlay /></div>}
                                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"><div className="w-12 h-12 bg-canvas rounded-full flex items-center justify-center text-text-main shadow-lg"><IconPlay /></div></div>
                                </div>
                                <div className="p-4">
                                    <div className="flex justify-between items-baseline mb-2"><span className="text-xs font-mono text-accent-primary bg-accent-primary/10 px-2 py-0.5 rounded">{formatTimestamp(item.start_time, item.end_time)}</span><span className="text-xs font-mono text-accent-secondary">{Math.round(item.score * 100)}% MATCH</span></div>
                                    <h3 className="text-base font-serif text-text-main leading-tight line-clamp-1 mb-1">{getPrimaryKeyword(item)}</h3>
                                    <p className="text-sm text-text-muted leading-relaxed line-clamp-2">{item.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {!isSearching && results.length === 0 && searchQuery && (
                    <div className="text-center py-20 text-text-muted">No matching segments found.</div>
                )}
            </main>

            {modalOpen && (
                <div className="fixed inset-0 bg-overlay flex items-center justify-center z-50 animate-fade-in" onClick={() => setModalOpen(false)}>
                    <div className="bg-black w-[90%] max-w-4xl aspect-video shadow-2xl relative rounded-lg overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
                        {currentSegment && (
                            <div className="absolute top-4 left-4 right-4 z-20 flex items-start justify-between gap-3 pointer-events-none">
                                <div className="max-w-[70%] bg-black/65 text-white px-3 py-2 rounded-md">
                                    <p className="text-base font-serif leading-tight truncate">{getPrimaryKeyword(currentSegment)}</p>
                                </div>
                                <div className="flex items-center gap-2 pointer-events-auto">
                                    <button
                                        onClick={(e) => handleDownload(e, currentSegment)}
                                        className="text-sm text-white bg-black/60 hover:bg-black/80 px-3 py-2 rounded-md flex items-center gap-1 transition-colors"
                                    >
                                        Download <IconDownloadSegment />
                                    </button>
                                    <button
                                        onClick={() => setModalOpen(false)}
                                        className="text-white/80 hover:text-white bg-black/60 hover:bg-black/80 p-2 rounded-md transition-colors"
                                    >
                                        <IconClose />
                                    </button>
                                </div>
                            </div>
                        )}
                        {clipUrl ? <video src={clipUrl} controls autoPlay className="w-full h-full object-contain" /> : <div className="w-full h-full flex items-center justify-center text-white"><div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin"></div></div>}
                        {currentSegment && (
                            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/85 to-transparent pointer-events-none">
                                <p className="text-white/90 text-xs font-mono">{formatTimestamp(currentSegment.start_time, currentSegment.end_time)}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ProjectList />} />
        <Route path="/project/:id" element={<ProjectDetail />} />
      </Routes>
    </Router>
  );
}

export default App;
