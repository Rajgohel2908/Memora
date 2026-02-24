import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useAuth } from '../context/AuthContext';
import { getMyMemories } from '../services/api';
import MemoryCard from '../components/MemoryCard';
import './Dashboard.css';

export default function Dashboard() {
    const { user } = useAuth();
    const [memories, setMemories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [viewMode, setViewMode] = useState('grid');
    const headerRef = useRef(null);
    const viewToggleRef = useRef(null);
    const observer = useRef();

    const lastMemoryElementRef = useCallback((node) => {
        if (loading || loadingMore) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prevPage => prevPage + 1);
            }
        });
        if (node) observer.current.observe(node);
    }, [loading, loadingMore, hasMore]);

    const fetchMemories = useCallback(async (pageNum) => {
        try {
            pageNum === 1 ? setLoading(true) : setLoadingMore(true);
            const res = await getMyMemories({ limit: 12, page: pageNum });
            setMemories(prev => pageNum === 1 ? res.data.memories : [...prev, ...res.data.memories]);
            setHasMore(res.data.page < res.data.pages);
        } catch (err) {
            console.error('Error fetching memories:', err);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, []);

    useEffect(() => {
        fetchMemories(page);
    }, [fetchMemories, page]);

    useGSAP(() => {
        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
        tl.fromTo(headerRef.current, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.7 });
        if (viewToggleRef.current) {
            tl.fromTo(viewToggleRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5 }, '-=0.3');
        }
    }, { scope: headerRef.current?.parentNode });

    // Group memories by month for timeline view
    const timelineGroups = useMemo(() => {
        const groups = {};
        memories.forEach((memory) => {
            const date = new Date(memory.memoryDate);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            if (!groups[key]) groups[key] = { label, memories: [] };
            groups[key].memories.push(memory);
        });
        return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
    }, [memories]);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    return (
        <div className="dashboard">
            <div className="container-wide">
                {/* Header */}
                <div className="dashboard-header" ref={headerRef}>
                    <div className="header-left">
                        <h1 className="dashboard-greeting">
                            {getGreeting()}, <span className="greeting-name">{user?.displayName || user?.username}</span>
                        </h1>
                        <p className="dashboard-subtitle">
                            {memories.length === 0
                                ? 'Start capturing your first memory'
                                : `You have ${memories.length} ${memories.length === 1 ? 'memory' : 'memories'} captured`}
                        </p>
                    </div>
                    <Link to="/create" className="btn btn-primary">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        New Memory
                    </Link>
                </div>

                {/* View controls */}
                {memories.length > 0 && (
                    <div className="view-controls" ref={viewToggleRef}>
                        <div className="view-toggle">
                            <button
                                className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                                onClick={() => setViewMode('grid')}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
                                </svg>
                                Grid
                            </button>
                            <button
                                className={`view-btn ${viewMode === 'timeline' ? 'active' : ''}`}
                                onClick={() => setViewMode('timeline')}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="12" y1="2" x2="12" y2="22" /><circle cx="12" cy="6" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="12" cy="18" r="2" />
                                </svg>
                                Timeline
                            </button>
                        </div>
                    </div>
                )}

                {/* Loading */}
                {loading && (
                    <div className="loading-overlay">
                        <div className="spinner"></div>
                        <span>Loading your memories...</span>
                    </div>
                )}

                {/* Empty State */}
                {!loading && memories.length === 0 && (
                    <div className="empty-state">
                        <div className="empty-visual">
                            <span className="empty-icon">✦</span>
                            <div className="empty-rings">
                                <div className="ring ring-1"></div>
                                <div className="ring ring-2"></div>
                                <div className="ring ring-3"></div>
                            </div>
                        </div>
                        <h2>Your memory web is empty</h2>
                        <p>Create your first memory to start building your personal memory network.</p>
                        <Link to="/create" className="btn btn-primary btn-lg">
                            Create Your First Memory
                        </Link>
                    </div>
                )}

                {/* Grid View */}
                {!loading && memories.length > 0 && viewMode === 'grid' && (
                    <div className="memory-grid">
                        {memories.map((memory, index) => (
                            <MemoryCard key={memory._id} memory={memory} index={index} viewMode="grid" />
                        ))}
                    </div>
                )}

                {/* Timeline View */}
                {!loading && memories.length > 0 && viewMode === 'timeline' && (
                    <div className="timeline-view">
                        {timelineGroups.map(([key, group]) => (
                            <div key={key} className="timeline-group">
                                <div className="timeline-label">
                                    <div className="timeline-dot" />
                                    <h3>{group.label}</h3>
                                    <span className="timeline-count">{group.memories.length} {group.memories.length === 1 ? 'memory' : 'memories'}</span>
                                </div>
                                <div className="timeline-cards">
                                    {group.memories.map((memory, index) => (
                                        <MemoryCard key={memory._id} memory={memory} index={index} viewMode="timeline" />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Loading More Indicator */}
                {loadingMore && (
                    <div className="loading-more" style={{ display: 'flex', justifyContent: 'center', padding: '2rem 0' }}>
                        <div className="spinner"></div>
                    </div>
                )}

                {/* Intersection Observer Target */}
                {!loading && hasMore && (
                    <div ref={lastMemoryElementRef} style={{ height: '20px', margin: '20px 0' }}></div>
                )}
            </div>
        </div>
    );
}
