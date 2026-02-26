import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import './MoodPlayer.css';

// Fallback mood colors if not imported
const COLORS = {
    happy: '#E2C07D',
    nostalgic: '#C4766A',
    peaceful: '#8BAF88',
    excited: '#D4B778',
    reflective: '#9BA3C6',
    default: '#B6AE9F'
};

export default function MoodPlayer({ audioUrl, mood }) {
    const audioRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);

    const moodColor = COLORS[mood?.toLowerCase()] || COLORS.default;

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const updateProgress = () => {
            const currentProgress = (audio.currentTime / audio.duration) * 100;
            setProgress(isNaN(currentProgress) ? 0 : currentProgress);
        };

        const handleEnded = () => {
            setIsPlaying(false);
            setProgress(0);
        };

        audio.addEventListener('timeupdate', updateProgress);
        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.removeEventListener('timeupdate', updateProgress);
            audio.removeEventListener('ended', handleEnded);
        };
    }, []);

    const togglePlay = (e) => {
        e.stopPropagation(); // Prevent card clicks
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    if (!audioUrl) return null;

    // Generated "waveform" bars
    const numBars = 15;
    const bars = Array.from({ length: numBars }).map((_, i) => {
        const height = 30 + Math.random() * 70; // 30% to 100%
        return height;
    });

    return (
        <div
            className={`mood-player ${isPlaying ? 'playing' : ''}`}
            onClick={(e) => e.stopPropagation()}
            style={{ '--mood-color': moodColor }}
        >
            <audio ref={audioRef} src={`http://localhost:5000${audioUrl}`} hidden />

            <button className="play-btn" onClick={togglePlay} style={{ color: moodColor, borderColor: moodColor }}>
                {isPlaying ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <rect x="6" y="4" width="4" height="16" />
                        <rect x="14" y="4" width="4" height="16" />
                    </svg>
                ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: '2px' }}>
                        <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                )}
            </button>

            <div className="waveform-container">
                <div className="waveform-base">
                    {bars.map((height, i) => (
                        <motion.div
                            key={i}
                            className="wave-bar"
                            animate={{
                                height: isPlaying ? `${height}%` : '20%',
                                opacity: isPlaying ? 0.8 : 0.4
                            }}
                            transition={{
                                duration: 0.3 + Math.random() * 0.2,
                                repeat: isPlaying ? Infinity : 0,
                                repeatType: "reverse"
                            }}
                            style={{ backgroundColor: moodColor }}
                        />
                    ))}
                </div>
                {/* Progress Overlay */}
                <div className="waveform-progress" style={{ width: `${progress}%` }}>
                    {bars.map((height, i) => (
                        <motion.div
                            key={i}
                            className="wave-bar-active"
                            animate={{
                                height: isPlaying ? `${height}%` : '20%'
                            }}
                            transition={{
                                duration: 0.3 + Math.random() * 0.2,
                                repeat: isPlaying ? Infinity : 0,
                                repeatType: "reverse"
                            }}
                            style={{ backgroundColor: moodColor }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
