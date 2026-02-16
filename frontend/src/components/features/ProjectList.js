import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../layout/Header';
import LoadingScreen from '../layout/LoadingScreen';
import { IconTrash, IconFilm } from '../icons/Icons';
import { getProjects, processVideo, uploadVideo, deleteProject } from '../../api';

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
    setIsValidUrl(youtubeRegex.test(videoUrl.trim()));
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
    const trimmedUrl = videoUrl.trim();
    if (!trimmedUrl || !isValidUrl) return;
    setProcessing(true);
    try {
      const res = await processVideo(trimmedUrl);
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
    e.stopPropagation();
    if (window.confirm('Delete this project?')) {
        await deleteProject(id);
        fetchProjects();
    }
  };

  if (processing) return (
      <div className="flex flex-col min-h-screen">
          <Header />
          <LoadingScreen />
      </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-canvas">
      <Header />
      <main className="container mx-auto px-6 py-12 max-w-6xl flex-1 flex flex-col">

        {/* Upload Section */}
        <section className="mb-20 animate-fade-in relative">
          {/* Glow Effect */}
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-accent-primary/5 blur-[100px] rounded-full pointer-events-none"></div>

          <div className="bg-panel/40 backdrop-blur-sm border border-border-subtle/50 rounded-2xl p-12 text-center shadow-card hover:shadow-hover transition-all duration-500 relative overflow-hidden group">
             {/* Subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
            
            <h2 className="text-4xl font-serif font-medium text-text-main mb-3 tracking-tight relative z-10">Semantic Video Index</h2>
            <p className="text-text-muted text-xl font-serif italic mb-10 max-w-md mx-auto leading-relaxed opacity-80 relative z-10">
                Turn any video into a searchable database.<br/>Paste a link to begin.
            </p>

            <div className="max-w-xl mx-auto flex gap-3 relative z-10">
                <input
                    type="text" 
                    className="flex-1 px-5 py-4 border border-border-subtle rounded-xl bg-canvas/50 text-text-main focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/50 transition-all placeholder:text-text-muted/30 font-sans shadow-inner"
                    placeholder="Paste YouTube URL..." 
                    value={videoUrl} 
                    onChange={(e) => setVideoUrl(e.target.value)}
                />
                <button
                    onClick={handleProcessUrl} 
                    disabled={!isValidUrl}
                    className={`px-8 py-3 rounded-xl font-medium tracking-wide transition-all duration-300 backdrop-blur-md border border-transparent ${
                        isValidUrl 
                        ? 'bg-text-main text-canvas hover:bg-accent-primary hover:text-white shadow-lg hover:shadow-glow hover:-translate-y-0.5' 
                        : 'bg-surface/50 text-text-muted/40 cursor-not-allowed'
                    }`}
                >
                    Index
                </button>
            </div>
            {videoUrl.trim() && !isValidUrl && (
                <p className="mt-3 text-xs text-red-300">
                    Enter a valid YouTube URL. For local files, use the upload option below.
                </p>
            )}
            <div className="mt-8 text-sm text-text-muted relative z-10">
                <button onClick={() => fileInputRef.current?.click()} className="group/upload relative inline-flex items-center gap-2 hover:text-text-main transition-colors">
                    <span className="w-8 h-8 rounded-full bg-surface/50 flex items-center justify-center group-hover/upload:bg-accent-primary group-hover/upload:text-white transition-all">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    </span>
                    <span>upload a file</span>
                </button>
                <input type="file" ref={fileInputRef} className="hidden" accept="video/*" onChange={handleFileUpload} />
            </div>
          </div>
        </section>

        {/* Projects Grid */}
        <div className="flex items-center gap-4 mb-8 border-b border-border-subtle pb-4">
            <h3 className="text-xs font-mono text-text-muted uppercase tracking-[0.2em]">Library</h3>
            <div className="h-px bg-border-subtle flex-1 opacity-50"></div>
        </div>

        {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-panel rounded-xl overflow-hidden border border-border-subtle/30 shadow-card">
                        <div className="aspect-video bg-white/5 animate-pulse"></div>
                        <div className="p-5 space-y-3">
                            <div className="h-5 bg-white/5 rounded w-3/4 animate-pulse"></div>
                            <div className="flex justify-between mt-4">
                                <div className="h-4 w-12 bg-white/5 rounded-full animate-pulse"></div>
                                <div className="h-4 w-16 bg-white/5 rounded animate-pulse"></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        ) : projects.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-12 text-center animate-fade-in">
                <div className="w-24 h-24 bg-panel/50 rounded-full flex items-center justify-center mb-6 text-border-subtle/80">
                    <IconFilm />
                </div>
                <h4 className="font-serif text-2xl text-text-main mb-3">No projects yet</h4>
                <p className="text-text-muted text-sm max-w-md mx-auto leading-relaxed opacity-80">
                    Your video library is empty. Start by pasting a YouTube URL or uploading a video file above to create your first searchable index.
                </p>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {projects.map((p) => (
                    <Link to={`/project/${p.id}`} key={p.id} className="group block bg-panel rounded-xl border border-border-subtle/50 hover:border-accent-primary/40 shadow-card hover:shadow-glow transition-all duration-500 overflow-hidden relative transform hover:-translate-y-1">
                        <div className="aspect-video bg-black relative overflow-hidden flex items-center justify-center">
                             {/* Placeholder or actual thumbnail if we stored one at project level */}
                             <div className="text-4xl font-serif text-text-muted/20 select-none">Aa</div>
                             <div className="absolute inset-0 bg-gradient-to-t from-panel via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500"></div>
                        </div>
                        <div className="p-5">
                            <h4 className="font-serif text-lg text-text-main mb-2 truncate group-hover:text-accent-primary transition-colors" title={p.name}>{p.name}</h4>
                            <div className="flex justify-between items-center mt-4">
                                <span className={`text-[10px] font-mono px-2 py-1 rounded-full uppercase tracking-wider border ${
                                    p.status === 'ready' 
                                    ? 'bg-accent-success/10 text-accent-success border-accent-success/20' 
                                    : 'bg-orange-500/10 text-orange-600 border-orange-500/20'
                                }`}>{p.status}</span>
                                <span className="text-xs text-text-muted font-mono opacity-60">{new Date(p.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                        <button
                            onClick={(e) => handleDelete(e, p.id)}
                            className="absolute top-3 right-3 p-2 bg-black/60 backdrop-blur-md rounded-full text-text-muted hover:text-red-500 hover:bg-black shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 border border-white/5"
                            title="Delete project"
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

export default ProjectList;
