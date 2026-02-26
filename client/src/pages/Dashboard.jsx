import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { getMyMemories, updatePrivacy } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastProvider';
import MemoryCard from '../components/MemoryCard';
import SkeletonCard from '../components/SkeletonCard';
import PageTransition from '../components/PageTransition';
import TimeCapsule from '../components/TimeCapsule';
import './Dashboard.css';

export default function Dashboard() {
    const { user } = useAuth();
    const [memories, setMemories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [viewMode, setViewMode] = useState('grid');
    const [timeCapsuleMemory, setTimeCapsuleMemory] = useState(null);
    const [showTimeCapsule, setShowTimeCapsule] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [isPublic, setIsPublic] = useState(true); // Default assuming true, will sync with user on mount
    const toast = useToast();

    useEffect(() => {
        if (user) {
            setIsPublic(user.isPublic ?? true);
        }
    }, [user]);

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
            const mems = res.data.memories;

            setMemories(prev => pageNum === 1 ? mems : [...prev, ...mems]);
            setHasMore(res.data.page < res.data.pages);

            // Check for Time Capsule on initial load
            if (pageNum === 1 && mems.length > 0) {
                const lastShown = localStorage.getItem('lastTimeCapsuleDate');
                const today = new Date().toDateString();

                if (lastShown !== today) {
                    const oneYearAgo = new Date();
                    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

                    let potentialMems = mems.filter(m => m.photos && m.photos.length > 0);
                    if (potentialMems.length === 0) potentialMems = mems;

                    let capsuleMem = potentialMems.find(m => {
                        const mDate = new Date(m.memoryDate);
                        return mDate.getDate() === oneYearAgo.getDate() &&
                            mDate.getMonth() === oneYearAgo.getMonth() &&
                            mDate.getFullYear() === oneYearAgo.getFullYear();
                    });

                    if (!capsuleMem && potentialMems.length > 0) {
                        capsuleMem = potentialMems[Math.floor(Math.random() * potentialMems.length)];
                    }

                    if (capsuleMem) {
                        setTimeout(() => {
                            setTimeCapsuleMemory(capsuleMem);
                            setShowTimeCapsule(true);
                            localStorage.setItem('lastTimeCapsuleDate', today);
                        }, 500); // slight delay after dashboard loads
                    }
                }
            }

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
        <PageTransition className="dashboard">
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
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <button className="btn btn-ghost" onClick={() => setShowSettings(true)}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                            </svg>
                            Settings
                        </button>
                        <Link to="/create" className="btn btn-primary">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            New Memory
                        </Link>
                    </div>
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

            {showTimeCapsule && timeCapsuleMemory && (
                <TimeCapsule
                    memory={timeCapsuleMemory}
                    onClose={() => setShowTimeCapsule(false)}
                />
            )}

            {/* Privacy Settings Modal */}
            {showSettings && (
                <div className="modal-backdrop" onClick={() => setShowSettings(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '2rem', maxWidth: '400px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Account Settings</h2>
                            <button className="btn btn-ghost btn-icon" onClick={() => setShowSettings(false)}>✕</button>
                        </div>

                        <div className="input-group" style={{ marginBottom: '2rem' }}>
                            <label style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                Profile Visibility

                                {/* Toggle Switch UI */}
                                <div
                                    style={{
                                        width: '44px',
                                        height: '24px',
                                        background: isPublic ? 'var(--warm-taupe)' : 'var(--taupe-light)',
                                        borderRadius: '12px',
                                        position: 'relative',
                                        cursor: 'pointer',
                                        transition: 'background 0.3s'
                                    }}
                                    onClick={async () => {
                                        const newVal = !isPublic;
                                        setIsPublic(newVal);
                                        try {
                                            await updatePrivacy(newVal);
                                            toast.success('Privacy settings updated');
                                        } catch (e) {
                                            toast.error('Failed to update privacy');
                                            setIsPublic(isPublic); // Rollback on error
                                        }
                                    }}
                                >
                                    <div style={{
                                        width: '20px',
                                        height: '20px',
                                        background: 'white',
                                        borderRadius: '10px',
                                        position: 'absolute',
                                        top: '2px',
                                        left: isPublic ? '22px' : '2px',
                                        transition: 'left 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                                    }}></div>
                                </div>
                            </label>

                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                                {isPublic
                                    ? "Your profile is Public. Friends can search for you and collaborate on mutual memories."
                                    : "Your profile is Private. You are hidden from search and cannot be tagged in new shared memories."}
                            </p>
                        </div>

                        <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setShowSettings(false)}>
                            Done
                        </button>
                    </div>
                </div>
            )}
        </PageTransition>
    );
}
