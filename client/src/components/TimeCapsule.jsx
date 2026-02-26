import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { TextPlugin } from 'gsap/TextPlugin';
import './TimeCapsule.css';

gsap.registerPlugin(TextPlugin);

export default function TimeCapsule({ memory, onClose }) {
    const textRef = useRef(null);
    const [imageLoaded, setImageLoaded] = useState(false);

    useEffect(() => {
        if (!imageLoaded || !textRef.current || !memory) return;

        // Typewriter effect for the title/text
        gsap.to(textRef.current, {
            duration: 3 + Math.random(),
            text: memory.content ? memory.content.substring(0, 150) + (memory.content.length > 150 ? "..." : "") : memory.title || "A moment from the past...",
            ease: "none",
            delay: 1.5,
        });

    }, [imageLoaded, memory]);

    if (!memory) return null;

    const hasPhoto = memory.photos && memory.photos.length > 0;

    return (
        <AnimatePresence>
            <motion.div
                className="time-capsule-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 1.2 } }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
            >
                <div className="time-capsule-content">
                    {/* Background Ken Burns Image */}
                    {hasPhoto ? (
                        <motion.img
                            src={`http://localhost:5000${memory.photos[0]}`}
                            alt="Time Capsule Memory"
                            className="time-capsule-img"
                            onLoad={() => setImageLoaded(true)}
                            initial={{ scale: 1, x: 0, y: 0 }}
                            animate={{ scale: 1.15, x: "-1%", y: "-1%" }}
                            transition={{ duration: 25, ease: "linear" }}
                        />
                    ) : (
                        <div className="time-capsule-no-img" onLoad={() => setImageLoaded(true)}></div>
                    )}

                    <div className="time-capsule-vignette"></div>

                    <div className="time-capsule-ui">
                        <motion.div
                            className="time-capsule-header"
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1, duration: 1 }}
                        >
                            <span className="capsule-label">✦ On This Day</span>
                            <h2 className="capsule-date">
                                {new Date(memory.memoryDate).toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </h2>
                        </motion.div>

                        <div className="time-capsule-text-container">
                            <h3 className="capsule-title">
                                {memory.title}
                            </h3>
                            <p className="capsule-typewriter" ref={textRef}></p>
                        </div>

                        <motion.button
                            className="capsule-close-btn"
                            onClick={onClose}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 5, duration: 1 }}
                        >
                            <span className="capsule-close-text">Return to Present</span>
                            <div className="capsule-close-line"></div>
                        </motion.button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
