import { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import MoodPlayer from './MoodPlayer';
import './MemoryCard.css';

gsap.registerPlugin(ScrollTrigger);

const MOOD_EMOJIS = {
    happy: '😊',
    nostalgic: '🥀',
    peaceful: '🕊️',
    excited: '⚡',
    grateful: '🙏',
    reflective: '🌙',
    bittersweet: '🍂',
    adventurous: '🧭',
};

const MOOD_GRADIENTS = {
    happy: 'linear-gradient(135deg, #FFF8E1, #FFE0B2)',
    nostalgic: 'linear-gradient(135deg, #E8DEF8, #D1C4E9)',
    peaceful: 'linear-gradient(135deg, #E8F5E9, #C8E6C9)',
    excited: 'linear-gradient(135deg, #FFF3E0, #FFE0B2)',
    grateful: 'linear-gradient(135deg, #FCE4EC, #F8BBD0)',
    reflective: 'linear-gradient(135deg, #E3F2FD, #BBDEFB)',
    bittersweet: 'linear-gradient(135deg, #FBE9E7, #FFCCBC)',
    adventurous: 'linear-gradient(135deg, #FFF8E1, #FFECB3)',
};

export default function MemoryCard({ memory, index = 0, viewMode = 'grid' }) {
    const cardRef = useRef(null);
    const navigate = useNavigate();

    // 3D Tilt Logic
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseXSpring = useSpring(x);
    const mouseYSpring = useSpring(y);

    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["5deg", "-5deg"]);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-5deg", "5deg"]);

    const handleMouseMove = (e) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const xPct = mouseX / width - 0.5;
        const yPct = mouseY / height - 0.5;
        x.set(xPct);
        y.set(yPct);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    useGSAP(() => {
        if (!cardRef.current) return;

        gsap.fromTo(
            cardRef.current,
            {
                opacity: 0,
                y: 40,
                scale: 0.95,
            },
            {
                scrollTrigger: {
                    trigger: cardRef.current,
                    start: 'top 90%',
                    toggleActions: 'play none none none',
                },
                opacity: 1,
                y: 0,
                scale: 1,
                duration: 0.7,
                delay: index < 12 ? index * 0.08 : 0,
                ease: 'power3.out',
            }
        );
    }, { scope: cardRef });

    const handleClick = () => {
        if (!cardRef.current) return;

        gsap.to(cardRef.current, {
            scale: 0.97,
            duration: 0.15,
            ease: 'power2.in',
            onComplete: () => {
                gsap.to(cardRef.current, {
                    scale: 1,
                    duration: 0.15,
                    ease: 'power2.out',
                });
                navigate(`/memory/${memory._id}`);
            },
        });
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const isTextOnly = !memory.photos || memory.photos.length === 0;

    return (
        <motion.div
            ref={cardRef}
            className={`memory-card ${isTextOnly ? 'text-only' : 'with-image'} ${viewMode === 'timeline' ? 'timeline-card' : ''} ${memory.mood ? `mood-${memory.mood}` : ''}`}
            onClick={handleClick}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
                rotateX,
                rotateY,
                transformStyle: "preserve-3d",
                ...(isTextOnly && memory.mood ? { background: MOOD_GRADIENTS[memory.mood] } : {})
            }}
        >
            {/* Photo card */}
            {!isTextOnly && (
                <div className="card-image-wrapper">
                    <motion.img
                        layoutId={`memory-img-${memory._id}`}
                        src={`http://localhost:5000${memory.photos[0]}`}
                        alt={memory.title || 'Memory'}
                        className="card-image"
                        loading="lazy"
                    />
                    <div className="card-image-overlay" />
                    {memory.photos.length > 1 && (
                        <span className="card-photo-count">+{memory.photos.length - 1}</span>
                    )}
                </div>
            )}

            {/* Text-only visual */}
            {isTextOnly && (
                <div className="card-text-visual">
                    <div className="card-text-decorative">
                        <span className="decorative-quote">"</span>
                    </div>
                    <p className="card-text-excerpt">
                        {memory.content
                            ? memory.content.length > 120
                                ? memory.content.substring(0, 120) + '...'
                                : memory.content
                            : memory.title || 'A moment to remember...'}
                    </p>
                </div>
            )}

            {memory.audioUrl && (
                <div className="card-audio-preview" style={{ padding: '0 20px', marginTop: '10px' }}>
                    <MoodPlayer audioUrl={memory.audioUrl} mood={memory.mood} />
                </div>
            )}

            {/* Card footer */}
            <div className="card-footer">
                <div className="card-meta">
                    {memory.title && (
                        <h3 className="card-title">{memory.title}</h3>
                    )}
                    <span className="card-date">{formatDate(memory.memoryDate)}</span>
                </div>

                <div className="card-bottom-row">
                    {memory.mood && (
                        <span className="card-mood">
                            {MOOD_EMOJIS[memory.mood]} {memory.mood}
                        </span>
                    )}

                    {memory.collaborators && memory.collaborators.length > 0 && (
                        <div className="card-collaborators" style={{ display: 'flex', marginLeft: 'auto', marginRight: '6px' }}>
                            {memory.collaborators.map((c, i) => (
                                <div key={c._id || i} title={c.displayName || c.username} style={{
                                    width: 18, height: 18, borderRadius: '50%', backgroundColor: 'var(--surface-color)', border: '1.5px solid var(--bg-primary)', marginLeft: '-6px', position: 'relative', zIndex: memory.collaborators.length - i, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', color: 'var(--text-secondary)', overflow: 'hidden'
                                }}>
                                    {c.profileImage ? <img src={`http://localhost:5000${c.profileImage}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (c.displayName?.[0] || c.username?.[0] || 'U').toUpperCase()}
                                </div>
                            ))}
                        </div>
                    )}

                    {memory.tags && memory.tags.length > 0 && (
                        <div className="card-tags">
                            {memory.tags.slice(0, 3).map((tag) => (
                                <span key={tag} className="tag">{tag}</span>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Polaroid tape effect */}
            <div className="card-tape" />
        </motion.div>
    );
}
