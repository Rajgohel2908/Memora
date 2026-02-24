import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, useTransform, useSpring, useMotionValue, AnimatePresence } from "framer-motion";

// ═══════════════════════════════════════════════════════════
// FLOATING PARTICLES — canvas for 60fps
// ═══════════════════════════════════════════════════════════
function FloatingParticles({ width, height }) {
    const canvasRef = useRef(null);
    const particlesRef = useRef([]);
    const rafRef = useRef(null);

    useEffect(() => {
        if (!width || !height) return;
        particlesRef.current = Array.from({ length: 40 }, () => ({
            x: Math.random() * width, y: Math.random() * height,
            size: 1 + Math.random() * 2.5, opacity: 0.3 + Math.random() * 0.4,
            vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.3,
            drift: Math.random() * Math.PI * 2, driftSpeed: 0.003 + Math.random() * 0.004,
        }));
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        const animate = () => {
            ctx.clearRect(0, 0, width, height);
            particlesRef.current.forEach((p) => {
                p.drift += p.driftSpeed;
                p.x += p.vx + Math.sin(p.drift) * 0.2;
                p.y += p.vy + Math.cos(p.drift) * 0.15;
                if (p.x < -10) p.x = width + 10;
                if (p.x > width + 10) p.x = -10;
                if (p.y < -10) p.y = height + 10;
                if (p.y > height + 10) p.y = -10;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 250, 235, ${p.opacity})`;
                ctx.shadowBlur = 4;
                ctx.shadowColor = "rgba(255, 250, 235, 0.4)";
                ctx.fill();
            });
            rafRef.current = requestAnimationFrame(animate);
        };
        animate();
        return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    }, [width, height]);

    return <canvas ref={canvasRef} width={width} height={height} style={{ position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none" }} />;
}

// ═══════════════════════════════════════════════════════════
// TYPEWRITER TEXT
// ═══════════════════════════════════════════════════════════
function TypewriterText({ text, triggerPhase, currentPhase, style }) {
    const [count, setCount] = useState(0);
    const ref = useRef(null);
    useEffect(() => {
        if (currentPhase === triggerPhase) {
            setCount(0);
            let c = 0;
            ref.current = setInterval(() => { c++; setCount(c); if (c >= text.length) clearInterval(ref.current); }, 30);
        } else { setCount(0); if (ref.current) clearInterval(ref.current); }
        return () => { if (ref.current) clearInterval(ref.current); };
    }, [currentPhase, triggerPhase, text]);
    return <span style={style}>{text.slice(0, count)}<span style={{ opacity: 0 }}>{text.slice(count)}</span></span>;
}

// ═══════════════════════════════════════════════════════════
// ANIMATED COUNTER — easeOut 0→target
// ═══════════════════════════════════════════════════════════
function AnimatedCounter({ target, trigger, style }) {
    const [count, setCount] = useState(0);
    const started = useRef(false);
    useEffect(() => {
        if (!trigger || started.current) return;
        started.current = true;
        const start = performance.now();
        const tick = (now) => {
            const p = Math.min((now - start) / 2000, 1);
            setCount(Math.floor((1 - Math.pow(1 - p, 3)) * target));
            if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    }, [trigger, target]);
    return <span style={style}>{count.toLocaleString()}</span>;
}

// ═══════════════════════════════════════════════════════════
// CONNECTION LINES — SVG between nearby cards
// ═══════════════════════════════════════════════════════════
function ConnectionLines({ positions, phase, morphValue, size }) {
    if (phase !== "circle" || !positions.length || !size.width) return null;
    const cx = size.width / 2, cy = size.height / 2;
    const lines = [];
    const seen = new Set();
    for (let i = 0; i < positions.length; i++) {
        for (let off = 1; off <= 2; off++) {
            const j = (i + off) % positions.length;
            const k = `${Math.min(i, j)}-${Math.max(i, j)}`;
            if (seen.has(k)) continue;
            seen.add(k);
            lines.push({ x1: cx + positions[i].x + 30, y1: cy + positions[i].y + 42, x2: cx + positions[j].x + 30, y2: cy + positions[j].y + 42 });
        }
    }
    const op = Math.max(0, (1 - morphValue) * 0.4);
    return (
        <svg style={{ position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none" }} width={size.width} height={size.height}>
            {lines.map((l, i) => <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="rgba(182,174,159,0.35)" strokeWidth="0.5" opacity={op} />)}
        </svg>
    );
}

// ═══════════════════════════════════════════════════════════
// MEMORY MODAL — click-to-expand card
// ═══════════════════════════════════════════════════════════
const LABELS = ["Friends laughing", "Ocean sunset", "Together forever", "Journey ahead", "Celebration night", "Golden afternoon", "Peaceful moment", "Summer warmth", "Wild adventure", "Kind smile", "Cultural roots", "Mountain vista", "Old town streets", "Sunset walk", "Family gathering", "Festival joy", "Quiet reflection", "Painted sky", "Morning calm", "Home comfort"];

function MemoryModal({ src, index, onClose }) {
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
            onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(63,58,52,0.6)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", cursor: "pointer" }}>
            <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }} onClick={e => e.stopPropagation()}
                style={{ width: "min(85vw, 420px)", background: "linear-gradient(145deg, #DEDED1, #C5C7BC)", borderRadius: 20, overflow: "hidden", boxShadow: "0 30px 80px rgba(0,0,0,0.25)", cursor: "default" }}>
                <img src={src.replace("w=300", "w=800").replace("q=80", "q=90")} alt={LABELS[index]} style={{ width: "100%", height: 280, objectFit: "cover" }} />
                <div style={{ padding: "20px 24px 24px" }}>
                    <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.3rem", fontWeight: 600, color: "#3f3a34", marginBottom: 6 }}>{LABELS[index]}</p>
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.82rem", color: "#5C554D", lineHeight: 1.6 }}>A moment frozen in time, waiting to be relived.</p>
                    <button onClick={onClose} style={{ marginTop: 16, fontFamily: "'Inter', sans-serif", fontSize: "0.75rem", fontWeight: 500, color: "#8A8279", background: "transparent", border: "1px solid rgba(182,174,159,0.4)", padding: "8px 20px", borderRadius: 8, cursor: "pointer" }}>Close</button>
                </div>
            </motion.div>
        </motion.div>
    );
}

// ═══════════════════════════════════════════════════════════
// FLIP CARD — with hover glow, depth, stagger, click
// ═══════════════════════════════════════════════════════════
const IMG_WIDTH = 60;
const IMG_HEIGHT = 85;

function FlipCard({ src, index, phase, target, depthFactor, onCardClick, clickable }) {
    return (
        <motion.div
            animate={{ x: target.x, y: target.y, rotate: target.rotation, scale: target.scale, opacity: target.opacity }}
            transition={{ type: "spring", stiffness: 40, damping: 15, delay: phase === "scatter" ? index * 0.08 : 0 }}
            style={{ position: "absolute", width: IMG_WIDTH, height: IMG_HEIGHT, transformStyle: "preserve-3d", perspective: "1000px", filter: depthFactor < 0.7 ? `opacity(${0.7 + depthFactor * 0.3})` : "none" }}
            className="cursor-pointer group"
            onClick={() => clickable && onCardClick?.(index)}
            whileHover={{ scale: (target.scale || 1) * 1.02, boxShadow: "0 0 20px rgba(251,243,209,0.4), 0 8px 30px rgba(0,0,0,0.08)" }}
        >
            <motion.div className="relative h-full w-full" style={{ transformStyle: "preserve-3d" }} transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }} whileHover={{ rotateY: 180 }}>
                <div className="absolute inset-0 h-full w-full overflow-hidden rounded-xl" style={{ backfaceVisibility: "hidden", boxShadow: "0 10px 30px rgba(0,0,0,0.08)", backgroundColor: "#C5C7BC" }}>
                    <img src={src} alt={`memory-${index}`} className="h-full w-full object-cover" loading="lazy" />
                    <div className="absolute inset-0 transition-colors group-hover:bg-transparent" style={{ backgroundColor: "rgba(63,58,52,0.08)" }} />
                </div>
                <div className="absolute inset-0 h-full w-full overflow-hidden rounded-xl flex flex-col items-center justify-center p-4" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)", background: "linear-gradient(135deg, #B6AE9F 0%, #C5C7BC 100%)", boxShadow: "0 10px 30px rgba(0,0,0,0.08)", border: "1px solid rgba(182,174,159,0.5)" }}>
                    <p style={{ fontSize: "8px", fontWeight: 700, color: "#3f3a34", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 2, fontFamily: "'Inter', sans-serif" }}>View</p>
                    <p style={{ fontSize: "12px", fontWeight: 500, color: "#5C554D", fontFamily: "'Inter', sans-serif" }}>Memory</p>
                </div>
            </motion.div>
        </motion.div>
    );
}

// ═══════════════════════════════════════════════════════════
// MAIN HERO — core morph UNTOUCHED, new phases layered
// ═══════════════════════════════════════════════════════════
const TOTAL_IMAGES = 20;
const MAX_SCROLL = 7200; // Extended for better pacing

// Fixed photo #18 and refined some others for maximum cinematic impact
const IMAGES = [
    "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=300&q=80",
    "https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=300&q=80",
    "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=300&q=80",
    "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=300&q=80",
    "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=300&q=80",
    "https://images.unsplash.com/photo-1484804959297-65e7c19d7c9f?w=300&q=80",
    "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=300&q=80",
    "https://images.unsplash.com/photo-1523438885200-e635ba2c371e?w=300&q=80",
    "https://images.unsplash.com/photo-1539635278303-d4002c07eae3?w=300&q=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=80",
    "https://images.unsplash.com/photo-1543807535-eceef0bc6599?w=300&q=80",
    "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=300&q=80",
    "https://images.unsplash.com/photo-1474552226712-ac0f0961a954?w=300&q=80",
    "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=300&q=80",
    "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=300&q=80",
    "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=300&q=80",
    "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=300&q=80",
    "https://images.unsplash.com/photo-1518002171953-a080ee817e1f?w=300&q=80",
    "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=300&q=80",
    "https://images.unsplash.com/photo-1519834785169-98be25ec3f84?w=300&q=80",
];

const lerp = (a, b, t) => a * (1 - t) + b * t;

// Feature data for cinematic overlay
const FEATURES = [
    { title: "Capture Moments", sub: "Every photo becomes a card in your archive" },
    { title: "Memory Network", sub: "See your life as an interactive web" },
    { title: "Time Travel", sub: "Navigate days, months, and years" },
    { title: "Beautiful & Alive", sub: "Cinematic animations, warm colors" },
];

export default function IntroAnimation() {
    const [introPhase, setIntroPhase] = useState("scatter");
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
    const containerRef = useRef(null);
    const [selectedCard, setSelectedCard] = useState(null);
    const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });

    // ─── Container Size (UNTOUCHED) ───
    useEffect(() => {
        if (!containerRef.current) return;
        const handleResize = (entries) => { for (const e of entries) setContainerSize({ width: e.contentRect.width, height: e.contentRect.height }); };
        const obs = new ResizeObserver(handleResize);
        obs.observe(containerRef.current);
        setContainerSize({ width: containerRef.current.offsetWidth, height: containerRef.current.offsetHeight });
        return () => obs.disconnect();
    }, []);

    // ─── Virtual Scroll (UNTOUCHED except MAX_SCROLL) ───
    const virtualScroll = useMotionValue(0);
    const scrollRef = useRef(0);

    useEffect(() => {
        const c = containerRef.current;
        if (!c) return;
        const onWheel = (e) => { e.preventDefault(); scrollRef.current = Math.min(Math.max(scrollRef.current + e.deltaY, 0), MAX_SCROLL); virtualScroll.set(scrollRef.current); };
        let touchY = 0;
        const onTS = (e) => { touchY = e.touches[0].clientY; };
        const onTM = (e) => { const dy = touchY - e.touches[0].clientY; touchY = e.touches[0].clientY; scrollRef.current = Math.min(Math.max(scrollRef.current + dy, 0), MAX_SCROLL); virtualScroll.set(scrollRef.current); };
        c.addEventListener("wheel", onWheel, { passive: false });
        c.addEventListener("touchstart", onTS, { passive: false });
        c.addEventListener("touchmove", onTM, { passive: false });
        return () => { c.removeEventListener("wheel", onWheel); c.removeEventListener("touchstart", onTS); c.removeEventListener("touchmove", onTM); };
    }, [virtualScroll]);

    // ─── EXISTING Transforms (UNTOUCHED) ───
    const morphProgress = useTransform(virtualScroll, [0, 600], [0, 1]);
    const smoothMorph = useSpring(morphProgress, { stiffness: 40, damping: 20 });
    const scrollRotate = useTransform(virtualScroll, [600, 3000], [0, 360]);
    const smoothScrollRotate = useSpring(scrollRotate, { stiffness: 40, damping: 20 });

    // ─── NEW Transforms — layered phases (Pacing smoothed out) ───
    const gridMorphRaw = useTransform(virtualScroll, [2800, 3800], [0, 1]);
    const smoothGrid = useSpring(gridMorphRaw, { stiffness: 40, damping: 18 });
    const spiralMorphRaw = useTransform(virtualScroll, [4400, 5400], [0, 1]);
    const smoothSpiral = useSpring(spiralMorphRaw, { stiffness: 45, damping: 18 });
    const exitMorphRaw = useTransform(virtualScroll, [5800, 6500], [0, 1]);
    const smoothExit = useSpring(exitMorphRaw, { stiffness: 35, damping: 20 });

    // ─── Mouse Parallax (Global Tilt + Light Sweep) ───
    const mouseX = useMotionValue(0.5);
    const mouseY = useMotionValue(0.5);
    const smoothMouseX = useSpring(mouseX, { stiffness: 30, damping: 20 });
    const smoothMouseY = useSpring(mouseY, { stiffness: 30, damping: 20 });

    useEffect(() => {
        const c = containerRef.current;
        if (!c) return;
        const onMove = (e) => {
            const r = c.getBoundingClientRect();
            const relX = (e.clientX - r.left) / r.width;
            const relY = (e.clientY - r.top) / r.height;
            mouseX.set(relX);
            mouseY.set(relY);
            setMousePos({ x: relX, y: relY });
        };
        c.addEventListener("mousemove", onMove);
        return () => c.removeEventListener("mousemove", onMove);
    }, [mouseX, mouseY]);

    // ─── Intro Sequence (UNTOUCHED) ───
    useEffect(() => {
        const t1 = setTimeout(() => setIntroPhase("line"), 500);
        const t2 = setTimeout(() => setIntroPhase("circle"), 2500);
        return () => { clearTimeout(t1); clearTimeout(t2); };
    }, []);

    // ─── Scatter Positions (UNTOUCHED) ───
    const scatterPositions = useMemo(() => IMAGES.map(() => ({
        x: (Math.random() - 0.5) * 1500, y: (Math.random() - 0.5) * 1000,
        rotation: (Math.random() - 0.5) * 180, scale: 0.6, opacity: 0,
    })), []);

    // ─── NEW: Pre-computed positions for grid, spiral, exit ───
    const randomTilts = useMemo(() => IMAGES.map(() => (Math.random() - 0.5) * 8), []);
    const exitAngles = useMemo(() => IMAGES.map((_, i) => (i / TOTAL_IMAGES) * Math.PI * 2 + (Math.random() - 0.5) * 0.5), []);

    const gridPositions = useMemo(() => {
        if (!containerSize.width) return [];
        // Creating an organic floating gallery layout (minimalistic & scattered, but CENTRALIZED)
        return IMAGES.map((_, i) => {
            const cols = containerSize.width < 768 ? 3 : 5;
            const row = Math.floor(i / cols);
            const col = i % cols;

            // Base positions spread closely near the center
            let x = (col - (cols - 1) / 2) * (containerSize.width * 0.12);
            let y = (row - (TOTAL_IMAGES / cols - 1) / 2) * (containerSize.height * 0.18);

            // Add organic scatter
            x += (Math.random() - 0.5) * 60;
            y += (Math.random() - 0.5) * 60;

            return {
                x,
                y,
                rotation: randomTilts[i] * 1.5,
                scale: 0.9 + Math.random() * 0.4, // Slightly smaller variance so they fit together better
            };
        });
    }, [containerSize.width, containerSize.height, randomTilts]);

    const spiralPositions = useMemo(() => {
        if (!containerSize.width) return [];
        const isMobile = containerSize.width < 768;
        const maxR = Math.min(containerSize.width, containerSize.height) * (isMobile ? 0.38 : 0.45);
        // Offset spiral to the right on desktop so feature cards can sit on the left
        const offsetX = isMobile ? 0 : containerSize.width * 0.15;
        return IMAGES.map((_, i) => {
            const angle = i * 2.399; // golden angle
            const r = (i / TOTAL_IMAGES) * maxR;
            return { x: Math.cos(angle) * r + offsetX, y: Math.sin(angle) * r, rotation: (angle * 180 / Math.PI) % 360, scale: 1.2 + (1 - i / TOTAL_IMAGES) * 0.5 };
        });
    }, [containerSize.width, containerSize.height]);

    // ─── Render Loop — subscribe to all motion values ───
    const [morphValue, setMorphValue] = useState(0);
    const [rotateValue, setRotateValue] = useState(0);
    const [parallaxValue, setParallaxValue] = useState(0);
    const [gridVal, setGridVal] = useState(0);
    const [spiralVal, setSpiralVal] = useState(0);
    const [exitVal, setExitVal] = useState(0);
    const [scrollValue, setScrollValue] = useState(0);

    useEffect(() => {
        const unsubs = [
            smoothMorph.on("change", setMorphValue),
            smoothScrollRotate.on("change", setRotateValue),
            smoothMouseX.on("change", setParallaxValue),
            smoothGrid.on("change", setGridVal),
            smoothSpiral.on("change", setSpiralVal),
            smoothExit.on("change", setExitVal),
            virtualScroll.on("change", setScrollValue),
        ];
        return () => unsubs.forEach(u => u());
    }, [smoothMorph, smoothScrollRotate, smoothMouseX, smoothGrid, smoothSpiral, smoothExit, virtualScroll]);

    // ─── Content Opacity (UNTOUCHED) ───
    const contentOpacity = useTransform(smoothMorph, [0.8, 1], [0, 1]);
    const contentY = useTransform(smoothMorph, [0.8, 1], [20, 0]);

    // ─── NEW: Overlay opacities & cleanly separated logic ───
    const arcContentFadeOut = Math.max(0, 1 - gridVal * 5);

    // Grid phase text: Appears early in grid morph, full in middle, fades strictly before spiral
    const newWayOpacity = scrollValue < 3000 ? 0 : scrollValue < 3300 ? (scrollValue - 3000) / 300 : scrollValue < 3900 ? 1 : scrollValue < 4200 ? 1 - (scrollValue - 3900) / 300 : 0;

    // Spiral Phase features: Separated cleanly from Grid Phase
    const featuresPhaseProgress = scrollValue < 4400 ? 0 : scrollValue < 5600 ? (scrollValue - 4400) / 1200 : 0;

    // CTA: Strict appearance only during Exit phase
    const ctaOpacity = scrollValue < 6200 ? 0 : scrollValue < 6600 ? (scrollValue - 6200) / 400 : 1;

    // Global 3D Tilt for Wow Factor
    const globalTiltX = useTransform(smoothMouseY, [0, 1], [15, -15]);
    const globalTiltY = useTransform(smoothMouseX, [0, 1], [-15, 15]);

    // Progress bar
    const progressPct = (scrollValue / MAX_SCROLL) * 100;

    // Card positions ref for connection lines
    const cardPosRef = useRef([]);

    return (
        <div ref={containerRef} className="w-full h-full overflow-hidden" style={{ position: "absolute", inset: 0, backgroundColor: "#DEDED1" }}>
            {/* Floating Particles */}
            <FloatingParticles width={containerSize.width} height={containerSize.height} />

            {/* Vignette */}
            <div style={{ position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none", background: "radial-gradient(ellipse 70% 60% at 50% 50%, transparent 40%, rgba(58,53,48,0.12) 100%)" }} />

            {/* Light Sweep */}
            <div style={{ position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none", background: `radial-gradient(800px circle at ${mousePos.x * 100}% ${mousePos.y * 100}%, rgba(251,243,209,0.15) 0%, transparent 70%)`, mixBlendMode: "soft-light", transition: "background 0.2s ease-out" }} />

            {/* Parallax Background — reveals during grid/spiral phases */}
            <div style={{ position: "absolute", inset: 0, zIndex: 0, opacity: Math.max(0, gridVal * 0.2), backgroundImage: "url('https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&q=60')", backgroundSize: "cover", backgroundPosition: "center", filter: `blur(${Math.max(0, 20 - gridVal * 15)}px)` }} />

            <motion.div className="flex h-full w-full flex-col items-center justify-center"
                style={{ perspective: "1500px", rotateX: globalTiltX, rotateY: globalTiltY, filter: `dr-op-shadow(0px 20px 40px rgba(0,0,0,0.1))` }}>

                {/* ════ Intro Text — Typewriter (fades out with grid morph) ════ */}
                <div className="absolute z-10 flex flex-col items-center justify-center text-center pointer-events-none" style={{ top: "50%", transform: "translateY(-50%)", opacity: arcContentFadeOut }}>
                    <motion.div initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
                        animate={introPhase === "circle" && morphValue < 0.5 ? { opacity: 1 - morphValue * 2, y: 0, filter: "blur(0px)" } : { opacity: 0, filter: "blur(10px)" }}
                        transition={{ duration: 1 }}>
                        <TypewriterText text="Your memories, beautifully connected." triggerPhase="circle" currentPhase={introPhase}
                            style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 500, letterSpacing: "-0.02em", color: "#3f3a34", fontSize: "clamp(1.5rem, 4vw, 2.5rem)", display: "block" }} />
                    </motion.div>
                    <motion.p initial={{ opacity: 0 }} animate={introPhase === "circle" && morphValue < 0.5 ? { opacity: 0.5 - morphValue } : { opacity: 0 }} transition={{ duration: 1, delay: 1.2 }}
                        style={{ marginTop: 12, fontSize: "0.85rem", fontWeight: 400, color: "#5C554D", fontFamily: "'Inter', sans-serif", lineHeight: 1.6, textAlign: "center", maxWidth: "28rem" }}>
                        Memora turns moments into a living memory web.
                    </motion.p>
                    <motion.div initial={{ opacity: 0 }} animate={introPhase === "circle" && morphValue < 0.5 ? { opacity: 0.35 - morphValue * 0.7 } : { opacity: 0 }} transition={{ duration: 0.8, delay: 1.5 }}
                        style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 6 }}>
                        <AnimatedCounter target={1247} trigger={introPhase === "circle"} style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.8rem", fontWeight: 600, color: "#B6AE9F" }} />
                        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.7rem", color: "#8A8279" }}>memories preserved</span>
                    </motion.div>
                    <motion.p initial={{ opacity: 0 }} animate={introPhase === "circle" && morphValue < 0.5 ? { opacity: 0.4 - morphValue * 0.8 } : { opacity: 0 }} transition={{ duration: 1, delay: 2 }}
                        style={{ marginTop: 16, fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.2em", color: "#8A8279", fontFamily: "'Inter', sans-serif" }}>
                        SCROLL THROUGH TIME · RELIVE YOUR STORY
                    </motion.p>
                </div>

                {/* ════ Arc Content "Welcome to Memora" — fades out with grid morph ════ */}
                <motion.div style={{ opacity: contentOpacity, y: contentY, position: "absolute", top: "10%", zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", pointerEvents: "none", padding: "0 1rem" }}>
                    <div style={{ opacity: arcContentFadeOut }}>
                        <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(1.8rem, 5vw, 3rem)", fontWeight: 600, color: "#3f3a34", letterSpacing: "-0.02em", marginBottom: 16 }}>Welcome to Memora</h2>
                        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "clamp(0.85rem, 1.5vw, 1rem)", color: "#5C554D", maxWidth: "32rem", lineHeight: 1.7 }}>Relive your moments through a living memory web.<br />Every scroll connects a story, every photo holds a feeling.</p>
                    </div>
                </motion.div>

                {/* ════ NEW: "A New Way" overlay — exclusively in grid phase ════ */}
                <div className="absolute z-20 flex flex-col items-center justify-center text-center pointer-events-none" style={{ top: "0", left: "0", right: "0", bottom: "0", opacity: newWayOpacity, transform: `translateY(${(1 - newWayOpacity) * 40}px) scale(${0.95 + newWayOpacity * 0.05})`, transition: "opacity 0.1s, transform 0.1s" }}>
                    <div style={{ background: "rgba(222, 222, 209, 0.7)", padding: "40px 60px", borderRadius: "24px", backdropFilter: "blur(12px)", boxShadow: "0 20px 50px rgba(58,53,48,0.1), inset 0 0 0 1px rgba(255,255,255,0.4)" }}>
                        <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 600, color: "#3f3a34", marginBottom: 16 }}>A New Way to Experience Time</h2>
                        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "clamp(0.9rem, 1.5vw, 1.15rem)", color: "rgba(63,58,52,0.8)", maxWidth: "32rem", margin: "0 auto", lineHeight: 1.7 }}>Explore your memories seamlessly. Look closely at individual days, or float above the years in a stunning organic web.</p>
                    </div>
                </div>

                {/* ════ NEW: Cinematic Feature Sequence — exclusively in spiral phase ════ */}
                <div className="absolute z-20 flex flex-col items-center justify-center text-center pointer-events-none"
                    style={{
                        top: "0", left: "0", right: "0", bottom: "0",
                        opacity: featuresPhaseProgress > 0 && exitVal === 0 ? 1 : 0,
                        transition: "opacity 0.5s"
                    }}>

                    {/* We use featuresPhaseProgress (0 to 1) to determine which of the 4 features to show */}
                    {FEATURES.map((f, fi) => {
                        const start = fi * 0.25;
                        const end = (fi + 1) * 0.25;

                        // Active range logic
                        const isActive = featuresPhaseProgress > start && featuresPhaseProgress < end;

                        // Local progress for this specific feature (0 to 1)
                        const localProgress = isActive ? (featuresPhaseProgress - start) / 0.25 : 0;

                        // Animation maths: fade in early, hold, fade out late
                        let opacity = 0;
                        let yOffset = 40;
                        let scale = 0.9;
                        let blur = 10;

                        if (isActive) {
                            if (localProgress < 0.2) { // Fade In
                                const inP = localProgress / 0.2;
                                opacity = inP;
                                yOffset = (1 - inP) * 40;
                                scale = 0.95 + inP * 0.05;
                                blur = (1 - inP) * 10;
                            } else if (localProgress > 0.8) { // Fade Out
                                const outP = (localProgress - 0.8) / 0.2;
                                opacity = 1 - outP;
                                yOffset = -(outP * 40);
                                scale = 1 + outP * 0.05;
                                blur = outP * 10;
                            } else { // Hold
                                opacity = 1;
                                yOffset = 0;
                                scale = 1;
                                blur = 0;
                            }
                        }

                        if (!isActive) return null;

                        return (
                            <div key={fi} className="absolute flex flex-col items-center justify-center w-full px-4"
                                style={{
                                    opacity,
                                    transform: `translateY(${yOffset}px) scale(${scale})`,
                                    filter: `blur(${blur}px)`,
                                    // Make sure text pops powerfully over the spiral
                                    textShadow: "0 10px 30px rgba(222, 222, 209, 0.8), 0 2px 10px rgba(222, 222, 209, 0.6)"
                                }}>

                                <h3 style={{
                                    fontFamily: "'Playfair Display', Georgia, serif",
                                    fontSize: "clamp(2.5rem, 6vw, 4rem)",
                                    fontWeight: 700,
                                    color: "#3f3a34",
                                    marginBottom: 12,
                                    lineHeight: 1.1
                                }}>
                                    {f.title}
                                </h3>

                                <p style={{
                                    fontFamily: "'Inter', sans-serif",
                                    fontSize: "clamp(1.1rem, 2vw, 1.4rem)",
                                    color: "#3f3a34", // Darker for max contrast
                                    fontWeight: 500,
                                    maxWidth: "28rem",
                                    lineHeight: 1.6,
                                    background: "rgba(222, 222, 209, 0.6)",
                                    padding: "8px 24px",
                                    borderRadius: "100px",
                                    backdropFilter: "blur(8px)"
                                }}>
                                    {f.sub}
                                </p>
                            </div>
                        );
                    })}
                </div>

                {/* ════ NEW: CTA overlay — after exit scatter ════ */}
                <div className="absolute z-30 flex flex-col items-center justify-center text-center" style={{ opacity: ctaOpacity, transform: `translateY(${(1 - ctaOpacity) * 30}px)`, transition: "opacity 0.4s, transform 0.4s", pointerEvents: ctaOpacity > 0.5 ? "auto" : "none" }}>
                    <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(1.6rem, 4vw, 2.3rem)", fontWeight: 600, color: "#3f3a34", marginBottom: 8 }}>Ready to preserve your memories?</h2>
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.95rem", color: "#5C554D", marginBottom: 28 }}>Start your personal memory archive today.</p>
                    <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center" }}>
                        <a href="/auth" style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.95rem", fontWeight: 500, color: "#F5F2EB", background: "linear-gradient(135deg, #B6AE9F, #7D756A)", padding: "14px 32px", borderRadius: 12, textDecoration: "none", boxShadow: "0 8px 30px rgba(58,53,48,0.15)", display: "flex", alignItems: "center", gap: 8 }}>
                            Begin Your Journey <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                        </a>
                        <a href="/auth" style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.95rem", fontWeight: 500, color: "#5C554D", background: "transparent", border: "1.5px solid rgba(182,174,159,0.5)", padding: "14px 28px", borderRadius: 12, textDecoration: "none" }}>I already have an account</a>
                    </div>
                    <p style={{ marginTop: 40, fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.1rem", color: "#B6AE9F" }}>✦ Memora</p>
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.75rem", color: "#8A8279", marginTop: 4 }}>Your memories, beautifully connected.</p>
                </div>

                {/* Connection Lines */}
                <ConnectionLines positions={cardPosRef.current} phase={introPhase} morphValue={morphValue} size={containerSize} />

                {/* ════ Cards — CORE MORPH UNTOUCHED + layered grid/spiral/exit ════ */}
                <div className="relative flex items-center justify-center w-full h-full">
                    {IMAGES.slice(0, TOTAL_IMAGES).map((src, i) => {
                        let target = { x: 0, y: 0, rotation: 0, scale: 1, opacity: 1 };
                        let depthFactor = 1;

                        // ─── CORE MORPH LOGIC (COMPLETELY UNTOUCHED) ───
                        if (introPhase === "scatter") {
                            target = scatterPositions[i];
                        } else if (introPhase === "line") {
                            const lineSpacing = 70;
                            const lineTotalWidth = TOTAL_IMAGES * lineSpacing;
                            target = { x: i * lineSpacing - lineTotalWidth / 2, y: 0, rotation: 0, scale: 1, opacity: 1 };
                        } else {
                            const isMobile = containerSize.width < 768;
                            const minDimension = Math.min(containerSize.width, containerSize.height);
                            const circleRadius = Math.min(minDimension * 0.35, 350);
                            const circleAngle = (i / TOTAL_IMAGES) * 360;
                            const circleRad = (circleAngle * Math.PI) / 180;
                            const circlePos = { x: Math.cos(circleRad) * circleRadius, y: Math.sin(circleRad) * circleRadius, rotation: circleAngle + 90 };

                            const baseRadius = Math.min(containerSize.width, containerSize.height * 1.5);
                            const arcRadius = baseRadius * (isMobile ? 1.4 : 1.1);
                            const arcApexY = containerSize.height * (isMobile ? 0.35 : 0.25);
                            const arcCenterY = arcApexY + arcRadius;
                            const spreadAngle = isMobile ? 100 : 130;
                            const startAngle = -90 - (spreadAngle / 2);
                            const step = spreadAngle / (TOTAL_IMAGES - 1);
                            const scrollProgressVal = Math.min(Math.max(rotateValue / 360, 0), 1);
                            const maxRotation = spreadAngle * 0.8;
                            const boundedRotation = -scrollProgressVal * maxRotation;
                            const currentArcAngle = startAngle + (i * step) + boundedRotation;
                            const arcRad = (currentArcAngle * Math.PI) / 180;
                            const arcPos = { x: Math.cos(arcRad) * arcRadius + parallaxValue, y: Math.sin(arcRad) * arcRadius + arcCenterY, rotation: currentArcAngle + 90, scale: isMobile ? 1.4 : 1.8 };

                            target = {
                                x: lerp(circlePos.x, arcPos.x, morphValue),
                                y: lerp(circlePos.y, arcPos.y, morphValue),
                                rotation: lerp(circlePos.rotation, arcPos.rotation, morphValue),
                                scale: lerp(1, arcPos.scale, morphValue),
                                opacity: 1,
                            };
                            // ─── END CORE MORPH ───

                            // Depth-of-field for circle phase
                            const normalizedY = Math.sin(circleRad);
                            depthFactor = lerp(0.6 + normalizedY * 0.2 + 0.2, 1, morphValue);
                            cardPosRef.current[i] = { x: target.x, y: target.y };

                            // ═══ NEW PHASE: Flowing Gallery Grid (scroll 2800-3800) ═══
                            if (gridVal > 0 && gridPositions[i]) {
                                const gp = gridPositions[i];
                                // Staggered: organic floating entrance
                                const cardT = Math.min(Math.max((gridVal * 1.5 - i * 0.02), 0), 1);
                                const eased = 1 - Math.pow(1 - cardT, 3);
                                target = {
                                    x: lerp(target.x, gp.x, eased),
                                    y: lerp(target.y, gp.y, eased),
                                    rotation: lerp(target.rotation, gp.rotation, eased),
                                    scale: lerp(target.scale, gp.scale, eased),
                                    opacity: 1,
                                };
                                depthFactor = 1; // clear depth for grid
                            }

                            // ═══ NEW PHASE: Spiral Morph (scroll 4400-5400) ═══
                            if (spiralVal > 0 && spiralPositions[i]) {
                                const sp = spiralPositions[i];
                                const cardT = Math.min(Math.max((spiralVal * 1.3 - i * 0.015), 0), 1);
                                const eased = 1 - Math.pow(1 - cardT, 2);
                                target = {
                                    x: lerp(target.x, sp.x, eased),
                                    y: lerp(target.y, sp.y, eased),
                                    rotation: lerp(target.rotation, sp.rotation, eased),
                                    scale: lerp(target.scale, sp.scale, eased),
                                    opacity: 1,
                                };
                                // Re-introduce depth based on distance from center
                                depthFactor = lerp(1, Math.max(0.6, 1 - (i / TOTAL_IMAGES) * 0.5), spiralVal);
                            }

                            // ═══ NEW PHASE: Exit Scatter (scroll 5800-6500) ═══
                            if (exitVal > 0) {
                                const exitDist = Math.max(containerSize.width, containerSize.height) * 1.2;
                                const angle = exitAngles[i];
                                const cardT = Math.min(Math.max((exitVal * 1.3 - i * 0.015), 0), 1);
                                const eased = cardT * cardT * cardT; // sharp cubic ease in for explosive exit
                                target = {
                                    x: lerp(target.x, target.x + Math.cos(angle) * exitDist, eased),
                                    y: lerp(target.y, target.y + Math.sin(angle) * exitDist, eased),
                                    rotation: target.rotation + eased * 360,
                                    scale: lerp(target.scale, 0, eased),
                                    opacity: 1 - eased,
                                };
                            }
                        }

                        // Parallax adjustments linked to global tilt
                        const pX = (target.x || 0) + parallaxValue;
                        const pY = (target.y || 0) + (mouseX.get() - 0.5) * -15; // inverse vertical float
                        const finalTarget = { ...target, x: pX, y: pY };
                        return (
                            <FlipCard key={i} src={src} index={i} phase={introPhase} target={finalTarget}
                                depthFactor={depthFactor} onCardClick={setSelectedCard}
                                clickable={morphValue > 0.9 && exitVal < 0.2} />
                        );
                    })}
                </div>
            </motion.div>

            {/* Progress Bar */}
            <div style={{ position: "absolute", bottom: 0, left: 0, width: `${progressPct}%`, height: 2, backgroundColor: "#B6AE9F", zIndex: 50 }} />

            {/* Modal */}
            <AnimatePresence>
                {selectedCard !== null && <MemoryModal src={IMAGES[selectedCard]} index={selectedCard} onClose={() => setSelectedCard(null)} />}
            </AnimatePresence>
        </div>
    );
}
