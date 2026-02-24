import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import gsap from 'gsap';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastProvider';
import { getMemory, deleteMemory } from '../services/api';
import './MemoryDetail.css';

const MOOD_EMOJIS = {
    happy: '😊', nostalgic: '🥀', peaceful: '🕊️', excited: '⚡',
    grateful: '🙏', reflective: '🌙', bittersweet: '🍂', adventurous: '🧭',
};

export default function MemoryDetail() {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const toast = useToast();

    const [memory, setMemory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activePhoto, setActivePhoto] = useState(0);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const contentRef = useRef(null);

    useEffect(() => {
        loadMemory();
    }, [id]);

    useEffect(() => {
        if (memory && contentRef.current) {
            const elements = contentRef.current.querySelectorAll('.detail-animate');
            gsap.fromTo(
                elements,
                { opacity: 0, y: 30 },
                { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power3.out' }
            );
        }
    }, [memory]);

    const loadMemory = async () => {
        try {
            const res = await getMemory(id);
            setMemory(res.data.memory);
        } catch {
            toast.error('Memory not found');
            navigate('/dashboard');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        try {
            await deleteMemory(id);
            toast.success('Memory deleted');
            navigate('/dashboard');
        } catch {
            toast.error('Failed to delete memory');
        }
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
        });
    };

    if (loading) {
        return (
            <div className="loading-overlay">
                <div className="spinner"></div>
                <span>Loading memory...</span>
            </div>
        );
    }

    if (!memory) return null;

    const isOwner = user?._id === memory.user?._id;
    const isTextOnly = !memory.photos || memory.photos.length === 0;

    return (
        <div className="memory-detail" ref={contentRef}>
            <div className="container">
                {/* Nav */}
                <div className="detail-nav detail-animate">
                    <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="15 18 9 12 15 6" />
                        </svg>
                        Back
                    </button>
                    {isOwner && (
                        <div className="detail-actions">
                            <Link to={`/memory/${id}/edit`} className="btn btn-ghost btn-sm">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                                Edit
                            </Link>
                            <button className="btn btn-ghost btn-sm" onClick={() => setShowDeleteConfirm(true)} style={{ color: 'var(--danger)' }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
                                Delete
                            </button>
                        </div>
                    )}
                </div>

                {/* Photo Gallery */}
                {!isTextOnly && (
                    <div className="detail-gallery detail-animate">
                        <div className="gallery-main">
                            <img
                                src={`http://localhost:5000${memory.photos[activePhoto]}`}
                                alt={memory.title}
                                className="gallery-image"
                            />
                        </div>
                        {memory.photos.length > 1 && (
                            <div className="gallery-thumbs">
                                {memory.photos.map((photo, i) => (
                                    <button
                                        key={i}
                                        className={`gallery-thumb ${i === activePhoto ? 'active' : ''}`}
                                        onClick={() => setActivePhoto(i)}
                                    >
                                        <img src={`http://localhost:5000${photo}`} alt="" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Content */}
                <div className={`detail-content ${isTextOnly ? 'text-only-detail' : ''}`}>
                    <div className="detail-date detail-animate">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        {formatDate(memory.memoryDate)}
                    </div>

                    {memory.title && (
                        <h1 className="detail-title detail-animate">{memory.title}</h1>
                    )}

                    {memory.mood && (
                        <div className="detail-mood detail-animate">
                            <span className="mood-badge">
                                {MOOD_EMOJIS[memory.mood]} {memory.mood}
                            </span>
                        </div>
                    )}

                    {memory.content && (
                        <div className="detail-story detail-animate">
                            <p>{memory.content}</p>
                        </div>
                    )}

                    {memory.tags && memory.tags.length > 0 && (
                        <div className="detail-tags detail-animate">
                            {memory.tags.map((tag) => (
                                <span key={tag} className="tag">{tag}</span>
                            ))}
                        </div>
                    )}

                    <div className="detail-meta detail-animate">
                        <span>Created {new Date(memory.createdAt).toLocaleDateString()}</span>
                        {memory.updatedAt !== memory.createdAt && (
                            <span>• Updated {new Date(memory.updatedAt).toLocaleDateString()}</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="modal-backdrop" onClick={() => setShowDeleteConfirm(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="delete-modal">
                            <h3>Delete this memory?</h3>
                            <p>This action cannot be undone. The memory and all its photos will be permanently removed.</p>
                            <div className="delete-modal-actions">
                                <button className="btn btn-ghost" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
                                <button className="btn btn-danger" onClick={handleDelete}>Delete Memory</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
