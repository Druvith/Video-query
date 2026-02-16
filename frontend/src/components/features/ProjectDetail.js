import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import Header from '../layout/Header';
import { IconSearch, IconPlay, IconClose, IconDownloadSegment } from '../icons/Icons';
import { getProject, queryVideo, createClip, API_BASE_URL } from '../../api';

const formatTimestamp = (start, end) => `${start} - ${end}`;

const getPrimaryKeyword = (segment) => {
  const keyword = segment?.keywords?.find((k) => typeof k === 'string' && k.trim());
  return keyword ? keyword.trim() : 'Clip Segment';
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

    if (!project) return <div className="flex items-center justify-center min-h-screen text-text-muted font-mono animate-pulse">Loading project...</div>;

    return (
        <div className="flex flex-col min-h-screen bg-canvas">
            <Header title={project.name} showBack />
            <main className="container mx-auto px-6 py-8 max-w-6xl flex-1 flex flex-col">
                <div className="sticky top-24 z-20 py-6 -mx-6 px-6 bg-canvas/95 backdrop-blur-sm transition-all duration-300">
                    <div className="relative group max-w-4xl mx-auto">
                        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-accent-primary transition-colors duration-300 pointer-events-none">
                            <IconSearch />
                        </div>
                        <input
                            ref={searchInputRef} type="text"
                            className="w-full pl-16 pr-6 py-5 text-xl font-serif border border-border-subtle rounded-xl bg-panel text-text-main placeholder:text-text-muted/60 focus:outline-none focus:border-accent-primary focus:ring-4 focus:ring-accent-primary/10 transition-all shadow-card hover:shadow-hover"
                            placeholder={`Ask a question about "${project.name}"...`}
                            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={handleSearch} autoFocus
                        />
                    </div>
                    {suggestedQueries.length > 0 && (
                        <div className="mt-4 flex flex-wrap justify-center gap-2 animate-fade-in max-w-4xl mx-auto">
                            {suggestedQueries.map((q, i) => (
                                <button
                                    key={i} onClick={() => { setSearchQuery(q); (async () => { setIsSearching(true); try { const data = await queryVideo(id, q); setResults(data); } catch (e) { console.error(e); } finally { setIsSearching(false); } })(); }}
                                    className="text-xs font-mono px-4 py-2 rounded-full border border-border-subtle/80 text-text-main bg-panel shadow-card hover:border-accent-primary hover:text-accent-primary hover:shadow-hover transition-all duration-300"
                                >{q}</button>
                            ))}
                        </div>
                    )}
                </div>

                {isSearching && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20 animate-fade-in">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="bg-panel rounded-xl overflow-hidden border border-border-subtle/30 shadow-card">
                                <div className="aspect-video bg-white/5 animate-pulse"></div>
                                <div className="p-6 space-y-3">
                                    <div className="h-4 bg-white/5 rounded w-3/4 animate-pulse"></div>
                                    <div className="h-3 bg-white/5 rounded w-1/2 animate-pulse"></div>
                                    <div className="pt-2 flex gap-2">
                                        <div className="h-5 w-16 bg-white/5 rounded-full animate-pulse"></div>
                                        <div className="h-5 w-12 bg-white/5 rounded-full animate-pulse"></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {!isSearching && results.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fade-in pb-20">
                        {results.map((item) => (
                            <div key={item.id} onClick={() => handleResultClick(item)} className="group bg-panel/50 backdrop-blur-sm rounded-xl overflow-hidden cursor-pointer hover:-translate-y-1 hover:shadow-glow transition-all duration-500 border border-border-subtle/50 hover:border-accent-primary/30">
                                <div className="relative aspect-video bg-black/40 overflow-hidden flex items-center justify-center">
                                    {item.thumbnail ? (
                                        <img src={item.thumbnail} alt={item.keywords?.[0]} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-80 group-hover:opacity-100" />
                                    ) : (
                                        <div className="text-text-muted opacity-20"><IconPlay /></div>
                                    )}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                                        <div className="w-14 h-14 bg-accent-primary/90 rounded-full flex items-center justify-center text-white shadow-lg transform scale-90 group-hover:scale-100 transition-transform duration-300 border border-white/10">
                                            <IconPlay />
                                        </div>
                                    </div>
                                    <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75">
                                        <span className="text-[10px] font-mono bg-black/80 text-white px-2 py-1 rounded backdrop-blur-md border border-white/10">{formatTimestamp(item.start_time, item.end_time)}</span>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <div className="flex justify-between items-center mb-3">
                                        <div className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                                            item.score > 0.4 ? 'bg-accent-success/10 text-accent-success border-accent-success/20' : 
                                            item.score > 0.15 ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                                            'bg-surface text-text-muted border-border-subtle'
                                        }`}>
                                            {item.score > 0.4 ? 'HIGH CONFIDENCE' : item.score > 0.15 ? 'MEDIUM MATCH' : 'RELATED'}
                                        </div>
                                        <span className="text-xs font-mono font-bold text-text-muted/60">{Math.round(item.score * 100)}%</span>
                                    </div>
                                    <h3 className="text-lg font-serif text-text-main leading-tight line-clamp-1 mb-2 group-hover:text-accent-primary transition-colors">{getPrimaryKeyword(item)}</h3>
                                    <p className="text-sm text-text-muted leading-relaxed line-clamp-2 opacity-80 mb-4">{item.description}</p>
                                    
                                    {/* Keyword Tags */}
                                    <div className="flex flex-wrap gap-2">
                                        {item.keywords?.slice(0, 3).map((k, idx) => (
                                            <span key={idx} className="text-[10px] font-mono text-text-muted/70 bg-surface/50 px-2 py-1 rounded hover:bg-surface hover:text-text-main transition-colors">#{k}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {!isSearching && results.length === 0 && searchQuery && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-20 animate-fade-in">
                        <div className="text-6xl mb-4 opacity-20">?</div>
                        <h3 className="font-serif text-xl text-text-main mb-2">No matching segments</h3>
                        <p className="text-text-muted text-sm max-w-sm">
                            We couldn't find any clips matching "<span className="italic text-text-main">{searchQuery}</span>". Try using different keywords or simpler terms.
                        </p>
                    </div>
                )}
            </main>

            {modalOpen && (
                <div className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center z-50 animate-fade-in p-4" onClick={() => setModalOpen(false)}>
                    <div className="bg-black w-full max-w-5xl aspect-video shadow-glow relative rounded-xl overflow-hidden flex flex-col ring-1 ring-white/10" onClick={(e) => e.stopPropagation()}>
                        {currentSegment && (
                            <div className="absolute top-0 left-0 right-0 z-20 flex items-start justify-between p-6 bg-gradient-to-b from-black/80 to-transparent pointer-events-none transition-opacity duration-300 hover:opacity-100">
                                <div className="max-w-[70%]">
                                    <h2 className="text-xl font-serif text-white/95 leading-tight drop-shadow-md">{getPrimaryKeyword(currentSegment)}</h2>
                                    <p className="text-white/60 text-xs font-mono mt-1">{currentSegment.description}</p>
                                </div>
                                <div className="flex items-center gap-3 pointer-events-auto">
                                    <button
                                        onClick={(e) => handleDownload(e, currentSegment)}
                                        className="text-xs font-bold text-white bg-white/10 hover:bg-white/20 border border-white/10 px-4 py-2 rounded-full flex items-center gap-2 transition-all backdrop-blur-md"
                                    >
                                        Download <IconDownloadSegment />
                                    </button>
                                    <button
                                        onClick={() => setModalOpen(false)}
                                        className="text-white/70 hover:text-white bg-black/20 hover:bg-black/40 p-2 rounded-full transition-colors backdrop-blur-md"
                                    >
                                        <IconClose />
                                    </button>
                                </div>
                            </div>
                        )}
                        {clipUrl ? (
                            <video src={clipUrl} controls autoPlay className="w-full h-full object-contain bg-black" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-white/50 bg-black">
                                <div className="flex flex-col items-center gap-4">
                                    <div className="w-10 h-10 border-2 border-white/10 border-t-white rounded-full animate-spin"></div>
                                    <span className="text-xs font-mono tracking-widest uppercase">Loading Clip</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectDetail;
