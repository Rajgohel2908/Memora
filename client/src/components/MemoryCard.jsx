import { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
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

    useGSAP(() => {
        if (!cardRef.current) return;

        gsap.fromTo(
            cardRef.current,
            {
                opacity: 0,
                y: 40,
                scale: 0.95,
                rotateX: 5,
            },
            {
                scrollTrigger: {
                    trigger: cardRef.current,
                    start: 'top 90%', // Animate when top of card is at 90% of viewport
                    toggleActions: 'play none none none',
                },
                opacity: 1,
                y: 0,
                scale: 1,
                rotateX: 0,
                duration: 0.7,
                delay: index < 12 ? index * 0.08 : 0, // Only delay initial load
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
        <div
            ref={cardRef}
            className={`memory-card ${isTextOnly ? 'text-only' : 'with-image'} ${viewMode === 'timeline' ? 'timeline-card' : ''} ${memory.mood ? `mood-${memory.mood}` : ''}`}
            onClick={handleClick}
            style={
                isTextOnly && memory.mood
                    ? { background: MOOD_GRADIENTS[memory.mood] }
                    : undefined
            }
        >
            {/* Photo card */}
            {!isTextOnly && (
                <div className="card-image-wrapper">
                    <img
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
        </div>
    );
}
