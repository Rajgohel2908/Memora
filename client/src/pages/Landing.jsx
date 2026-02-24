import { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import './Landing.css';

export default function Landing() {
    const heroRef = useRef(null);
    const titleRef = useRef(null);
    const subtitleRef = useRef(null);
    const ctaRef = useRef(null);
    const featuresRef = useRef(null);
    const particlesRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

        // Animate floating particles
        if (particlesRef.current) {
            const particles = particlesRef.current.querySelectorAll('.particle');
            particles.forEach((p, i) => {
                gsap.to(p, {
                    y: `random(-30, 30)`,
                    x: `random(-20, 20)`,
                    rotation: `random(-15, 15)`,
                    duration: `random(3, 6)`,
                    repeat: -1,
                    yoyo: true,
                    ease: 'sine.inOut',
                    delay: i * 0.3,
                });
            });
        }

        tl.fromTo(titleRef.current, { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 1 })
            .fromTo(subtitleRef.current, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8 }, '-=0.5')
            .fromTo(ctaRef.current, { opacity: 0, y: 20, scale: 0.9 }, { opacity: 1, y: 0, scale: 1, duration: 0.6 }, '-=0.3');

        if (featuresRef.current) {
            const cards = featuresRef.current.querySelectorAll('.feature-card');
            tl.fromTo(
                cards,
                { opacity: 0, y: 60, rotateY: 10 },
                { opacity: 1, y: 0, rotateY: 0, duration: 0.8, stagger: 0.15 },
                '-=0.2'
            );
        }
    }, []);

    return (
        <div className="landing" ref={heroRef}>
            {/* Floating particles background */}
            <div className="particles" ref={particlesRef}>
                {Array.from({ length: 12 }).map((_, i) => (
                    <div
                        key={i}
                        className="particle"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            width: `${Math.random() * 8 + 4}px`,
                            height: `${Math.random() * 8 + 4}px`,
                            animationDelay: `${i * 0.5}s`,
                        }}
                    />
                ))}
            </div>

            <div className="landing-hero">
                <div className="hero-badge">✦ Your memory web awaits</div>
                <h1 ref={titleRef} className="hero-title">
                    Every moment<br />
                    <span className="hero-title-accent">deserves to be remembered</span>
                </h1>
                <p ref={subtitleRef} className="hero-subtitle">
                    Capture, connect, and explore your memories through a beautiful
                    interactive network. Create your personal memory archive with
                    photos, stories, and emotions.
                </p>
                <div ref={ctaRef} className="hero-actions">
                    <button className="btn btn-primary btn-lg hero-cta" onClick={() => navigate('/auth')}>
                        Begin Your Journey
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                        </svg>
                    </button>
                    <button className="btn btn-ghost btn-lg" onClick={() => navigate('/auth')}>
                        I already have an account
                    </button>
                </div>
            </div>

            <div className="landing-features" ref={featuresRef}>
                <div className="feature-card">
                    <div className="feature-icon">📸</div>
                    <h3>Capture Moments</h3>
                    <p>Upload photos or write text-only memories. Every memory becomes a beautiful card in your personal archive.</p>
                </div>
                <div className="feature-card">
                    <div className="feature-icon">🕸️</div>
                    <h3>Memory Network</h3>
                    <p>See your memories as an interactive web. Pan, zoom, and explore connections between your life's moments.</p>
                </div>
                <div className="feature-card">
                    <div className="feature-icon">🕰️</div>
                    <h3>Time Travel</h3>
                    <p>Navigate through time — zoom into individual days or zoom out to see months and years at a glance.</p>
                </div>
                <div className="feature-card">
                    <div className="feature-icon">💫</div>
                    <h3>Beautiful & Alive</h3>
                    <p>Smooth cinematic animations, warm colors, and a nostalgic scrapbook feel make exploring memories a joy.</p>
                </div>
            </div>

            <div className="landing-footer">
                <span className="footer-brand">✦ Memora</span>
                <span className="footer-text">Your memories, beautifully connected.</span>
            </div>
        </div>
    );
}
