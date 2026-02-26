import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { useToast } from '../components/ToastProvider';
import { createMemory, getMemory, updateMemory, searchUsers } from '../services/api';
import PageTransition from '../components/PageTransition';
import './CreateMemory.css';

const MOODS = [
    { value: 'happy', emoji: '😊', label: 'Happy', color: '#E2C07D' },
    { value: 'nostalgic', emoji: '🥀', label: 'Nostalgic', color: '#C4766A' },
    { value: 'peaceful', emoji: '🕊️', label: 'Peaceful', color: '#8BAF88' },
    { value: 'excited', emoji: '⚡', label: 'Excited', color: '#D4B778' },
    { value: 'grateful', emoji: '🙏', label: 'Grateful', color: '#B8A9C9' },
    { value: 'reflective', emoji: '🌙', label: 'Reflective', color: '#9BA3C6' },
    { value: 'bittersweet', emoji: '🍂', label: 'Bittersweet', color: '#C9956B' },
    { value: 'adventurous', emoji: '🧭', label: 'Adventurous', color: '#7EB5A6' },
];

export default function CreateMemory() {
    const { id } = useParams();
    const isEdit = Boolean(id);
    const navigate = useNavigate();
    const toast = useToast();
    const formRef = useRef(null);

    const [form, setForm] = useState({
        title: '',
        content: '',
        memoryDate: new Date().toISOString().split('T')[0],
        mood: '',
        tags: '',
        lat: '',
        lng: '',
        collaborators: [],
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [photos, setPhotos] = useState([]);
    const [existingPhotos, setExistingPhotos] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [audioFile, setAudioFile] = useState(null);
    const [audioPreview, setAudioPreview] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [loading, setLoading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [activeStep, setActiveStep] = useState(0);
    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);
    const timerRef = useRef(null);

    useEffect(() => {
        if (isEdit) loadMemory();
    }, [id]);

    useEffect(() => {
        gsap.fromTo(formRef.current, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' });
    }, []);

    const loadMemory = async () => {
        try {
            const res = await getMemory(id);
            const m = res.data.memory;
            setForm({
                title: m.title || '',
                content: m.content || '',
                memoryDate: new Date(m.memoryDate).toISOString().split('T')[0],
                mood: m.mood || '',
                tags: m.tags ? m.tags.join(', ') : '',
                lat: m.location?.lat || '',
                lng: m.location?.lng || '',
                collaborators: m.collaborators || [],
            });
            setExistingPhotos(m.photos || []);
        } catch {
            toast.error('Memory not found');
            navigate('/dashboard');
        }
    };

    const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

    const handleFiles = (files) => {
        const fileArr = Array.from(files).filter((f) => f.type.startsWith('image/'));
        setPhotos((prev) => [...prev, ...fileArr]);
        fileArr.forEach((file) => {
            const reader = new FileReader();
            reader.onload = (e) => setPreviews((prev) => [...prev, e.target.result]);
            reader.readAsDataURL(file);
        });
    };

    const handleDrop = (e) => { e.preventDefault(); setDragActive(false); handleFiles(e.dataTransfer.files); };
    const handleDragOver = (e) => { e.preventDefault(); setDragActive(true); };
    const handleDragLeave = () => setDragActive(false);
    const removePhoto = (i) => { setPhotos(p => p.filter((_, j) => j !== i)); setPreviews(p => p.filter((_, j) => j !== i)); };
    const removeExistingPhoto = (i) => setExistingPhotos(p => p.filter((_, j) => j !== i));

    const handleGetLocation = () => {
        if (!navigator.geolocation) { toast.error('Geolocation not supported'); return; }
        toast.info('Fetching location...');
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setForm(p => ({ ...p, lat: pos.coords.latitude.toFixed(6), lng: pos.coords.longitude.toFixed(6) }));
                toast.success('Location captured!');
            },
            () => toast.error('Unable to retrieve location')
        );
    };

    const handleSearchUsers = async (e) => {
        const q = e.target.value;
        setSearchQuery(q);
        if (q.length < 2) { setSearchResults([]); return; }
        setIsSearching(true);
        try {
            const res = await searchUsers(q);
            setSearchResults(res.data.users.filter(u => !form.collaborators.some(c => c._id === u._id)));
        } catch (err) { console.error(err); }
        finally { setIsSearching(false); }
    };

    const addCollaborator = (user) => {
        setForm(p => ({ ...p, collaborators: [...p.collaborators, user] }));
        setSearchQuery(''); setSearchResults([]);
    };
    const removeCollaborator = (id) => setForm(p => ({ ...p, collaborators: p.collaborators.filter(c => c._id !== id) }));

    // Audio
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            chunksRef.current = [];
            recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
            recorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                setAudioFile(new File([blob], 'voice-memo.webm', { type: 'audio/webm' }));
                setAudioPreview(URL.createObjectURL(blob));
                stream.getTracks().forEach(t => t.stop());
                clearInterval(timerRef.current);
            };
            recorder.start();
            mediaRecorderRef.current = recorder;
            setIsRecording(true); setRecordingTime(0);
            timerRef.current = setInterval(() => setRecordingTime(p => p + 1), 1000);
        } catch { toast.error('Microphone access denied'); }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
        setIsRecording(false); clearInterval(timerRef.current);
    };

    const handleAudioFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (file?.type.startsWith('audio/')) { setAudioFile(file); setAudioPreview(URL.createObjectURL(file)); }
    };

    const removeAudio = () => { setAudioFile(null); if (audioPreview) URL.revokeObjectURL(audioPreview); setAudioPreview(null); };
    const formatRecordTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title && !form.content && photos.length === 0 && existingPhotos.length === 0) {
            toast.error('Add a title, text, or photos'); return;
        }
        setLoading(true);
        try {
            const fd = new FormData();
            fd.append('title', form.title);
            fd.append('content', form.content);
            fd.append('memoryDate', form.memoryDate);
            if (form.mood) fd.append('mood', form.mood);
            if (form.tags) fd.append('tags', JSON.stringify(form.tags.split(',').map(t => t.trim()).filter(Boolean)));
            if (form.lat && form.lng) { fd.append('lat', form.lat); fd.append('lng', form.lng); }
            if (form.collaborators.length > 0) fd.append('collaborators', JSON.stringify(form.collaborators.map(c => c._id)));
            photos.forEach(p => fd.append('photos', p));
            if (audioFile) fd.append('audio', audioFile);
            if (isEdit) { fd.append('existingPhotos', JSON.stringify(existingPhotos)); await updateMemory(id, fd); toast.success('Memory updated!'); }
            else { await createMemory(fd); toast.success('Memory created!'); }
            navigate('/dashboard');
        } catch (err) { toast.error(err.response?.data?.message || 'Failed to save'); }
        finally { setLoading(false); }
    };

    const STEPS = [
        { icon: '🖼️', label: 'Media' },
        { icon: '✍️', label: 'Story' },
        { icon: '✨', label: 'Details' },
    ];

    const selectedMood = MOODS.find(m => m.value === form.mood);

    return (
        <PageTransition className="cm-page">
            <div className="cm-container" ref={formRef}>
                {/* Header */}
                <div className="cm-header">
                    <button className="cm-back-btn" onClick={() => navigate(-1)}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                    </button>
                    <div className="cm-header-text">
                        <h1 className="cm-title">{isEdit ? 'Edit Memory' : 'New Memory'}</h1>
                        <p className="cm-subtitle">{isEdit ? 'Refine your captured moment' : 'Capture a moment worth remembering'}</p>
                    </div>
                </div>

                {/* Step Indicator */}
                <div className="cm-steps">
                    {STEPS.map((step, i) => (
                        <button key={i} className={`cm-step ${activeStep === i ? 'active' : ''} ${activeStep > i ? 'done' : ''}`} onClick={() => setActiveStep(i)}>
                            <span className="cm-step-icon">{step.icon}</span>
                            <span className="cm-step-label">{step.label}</span>
                        </button>
                    ))}
                    <div className="cm-step-track">
                        <div className="cm-step-progress" style={{ width: `${(activeStep / (STEPS.length - 1)) * 100}%` }} />
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="cm-form">
                    <AnimatePresence mode="wait">
                        {/* STEP 0: Media */}
                        {activeStep === 0 && (
                            <motion.div key="media" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.25 }} className="cm-step-panel">
                                <h2 className="cm-section-title">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                                    Photos
                                </h2>
                                <div
                                    className={`cm-drop-zone ${dragActive ? 'active' : ''}`}
                                    onDrop={handleDrop}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onClick={() => document.getElementById('photo-input').click()}
                                >
                                    <div className="cm-drop-inner">
                                        <div className="cm-drop-icon-wrap">
                                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                                        </div>
                                        <p className="cm-drop-text">Drop photos here or <span className="cm-drop-browse">browse</span></p>
                                        <span className="cm-drop-hint">JPEG, PNG, GIF, WebP — up to 10MB</span>
                                    </div>
                                    <input id="photo-input" type="file" accept="image/*" multiple onChange={(e) => handleFiles(e.target.files)} style={{ display: 'none' }} />
                                </div>

                                {(previews.length > 0 || existingPhotos.length > 0) && (
                                    <div className="cm-photo-grid">
                                        {existingPhotos.map((photo, i) => (
                                            <motion.div key={`ex-${i}`} className="cm-photo-item" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}>
                                                <img src={`http://localhost:5000${photo}`} alt="" />
                                                <button type="button" className="cm-photo-remove" onClick={() => removeExistingPhoto(i)}>✕</button>
                                            </motion.div>
                                        ))}
                                        {previews.map((src, i) => (
                                            <motion.div key={`new-${i}`} className="cm-photo-item" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}>
                                                <img src={src} alt="" />
                                                <button type="button" className="cm-photo-remove" onClick={() => removePhoto(i)}>✕</button>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}

                                {/* Voice Memo */}
                                <h2 className="cm-section-title" style={{ marginTop: '1.5rem' }}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>
                                    Voice Memo
                                </h2>
                                {!audioFile && !audioPreview ? (
                                    <div className="cm-audio-controls">
                                        {isRecording ? (
                                            <button type="button" className="cm-rec-btn recording" onClick={stopRecording}>
                                                <span className="cm-rec-dot" />
                                                <span className="cm-rec-time">{formatRecordTime(recordingTime)}</span>
                                                <span>Stop</span>
                                            </button>
                                        ) : (
                                            <button type="button" className="cm-rec-btn" onClick={startRecording}>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /></svg>
                                                Record
                                            </button>
                                        )}
                                        <span className="cm-audio-divider">or</span>
                                        <label className="cm-upload-btn">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                                            Upload
                                            <input type="file" accept="audio/*" onChange={handleAudioFileSelect} style={{ display: 'none' }} />
                                        </label>
                                    </div>
                                ) : (
                                    <div className="cm-audio-preview">
                                        <audio controls src={audioPreview} className="cm-audio-player" />
                                        <button type="button" className="cm-audio-remove" onClick={removeAudio}>✕</button>
                                    </div>
                                )}

                                <div className="cm-step-nav">
                                    <div />
                                    <button type="button" className="cm-next-btn" onClick={() => setActiveStep(1)}>
                                        Continue
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 1: Story */}
                        {activeStep === 1 && (
                            <motion.div key="story" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.25 }} className="cm-step-panel">
                                <div className="cm-field">
                                    <label className="cm-label" htmlFor="title">Title</label>
                                    <input id="title" name="title" type="text" className="cm-input" placeholder="A name for this memory…" value={form.title} onChange={handleChange} />
                                </div>
                                <div className="cm-field">
                                    <label className="cm-label" htmlFor="content">Your Story</label>
                                    <textarea id="content" name="content" className="cm-textarea" placeholder="What happened? How did you feel? Write freely…" value={form.content} onChange={handleChange} rows={7} />
                                    <span className="cm-char-count">{form.content.length} characters</span>
                                </div>
                                <div className="cm-step-nav">
                                    <button type="button" className="cm-prev-btn" onClick={() => setActiveStep(0)}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                                        Back
                                    </button>
                                    <button type="button" className="cm-next-btn" onClick={() => setActiveStep(2)}>
                                        Continue
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 2: Details */}
                        {activeStep === 2 && (
                            <motion.div key="details" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.25 }} className="cm-step-panel">
                                <div className="cm-row">
                                    <div className="cm-field">
                                        <label className="cm-label" htmlFor="memoryDate">Date</label>
                                        <input id="memoryDate" name="memoryDate" type="date" className="cm-input" value={form.memoryDate} onChange={handleChange} />
                                    </div>
                                    <div className="cm-field">
                                        <label className="cm-label" htmlFor="tags">Tags</label>
                                        <input id="tags" name="tags" type="text" className="cm-input" placeholder="travel, sunset, family…" value={form.tags} onChange={handleChange} />
                                    </div>
                                </div>

                                {/* Mood */}
                                <div className="cm-field">
                                    <label className="cm-label">Mood</label>
                                    <div className="cm-mood-grid">
                                        {MOODS.map(mood => (
                                            <button
                                                key={mood.value}
                                                type="button"
                                                className={`cm-mood-chip ${form.mood === mood.value ? 'selected' : ''}`}
                                                onClick={() => setForm(p => ({ ...p, mood: p.mood === mood.value ? '' : mood.value }))}
                                                style={form.mood === mood.value ? { borderColor: mood.color, boxShadow: `0 0 0 2px ${mood.color}33` } : {}}
                                            >
                                                <span className="cm-mood-emoji">{mood.emoji}</span>
                                                <span className="cm-mood-text">{mood.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                    {selectedMood && (
                                        <motion.div className="cm-mood-indicator" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} style={{ color: selectedMood.color }}>
                                            Feeling {selectedMood.label.toLowerCase()} {selectedMood.emoji}
                                        </motion.div>
                                    )}
                                </div>

                                {/* Location */}
                                <div className="cm-field">
                                    <label className="cm-label">Location</label>
                                    <div className="cm-location-row">
                                        <button type="button" className="cm-loc-btn" onClick={handleGetLocation}>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                                            {form.lat && form.lng ? 'Update Location' : 'Get Current Location'}
                                        </button>
                                        {form.lat && form.lng && (
                                            <motion.span className="cm-loc-coords" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                                📍 {form.lat}, {form.lng}
                                            </motion.span>
                                        )}
                                    </div>
                                </div>

                                {/* Collaborators */}
                                <div className="cm-field">
                                    <label className="cm-label">Shared With</label>
                                    {form.collaborators.length > 0 && (
                                        <div className="cm-collab-list">
                                            {form.collaborators.map(c => (
                                                <div key={c._id} className="cm-collab-pill">
                                                    <img src={c.profileImage ? `http://localhost:5000${c.profileImage}` : '/default-avatar.png'} alt="" className="cm-collab-avatar" />
                                                    <span>{c.displayName || c.username}</span>
                                                    <button type="button" className="cm-collab-remove" onClick={() => removeCollaborator(c._id)}>✕</button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <div className="cm-collab-search-wrap">
                                        <input type="text" className="cm-input" placeholder="Search people to invite…" value={searchQuery} onChange={handleSearchUsers} />
                                        {isSearching && <span className="cm-mini-spinner" />}
                                        <AnimatePresence>
                                            {searchResults.length > 0 && (
                                                <motion.div className="cm-collab-dropdown" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}>
                                                    {searchResults.map(u => (
                                                        <button key={u._id} type="button" className="cm-collab-option" onClick={() => addCollaborator(u)}>
                                                            <img src={u.profileImage ? `http://localhost:5000${u.profileImage}` : '/default-avatar.png'} alt="" className="cm-collab-avatar" />
                                                            <div className="cm-collab-info">
                                                                <span className="cm-collab-name">{u.displayName || u.username}</span>
                                                                <span className="cm-collab-handle">@{u.username}</span>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>

                                {/* Submit */}
                                <div className="cm-step-nav cm-submit-row">
                                    <button type="button" className="cm-prev-btn" onClick={() => setActiveStep(1)}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                                        Back
                                    </button>
                                    <button type="submit" className="cm-submit-btn" disabled={loading}>
                                        {loading ? (
                                            <span className="cm-mini-spinner white" />
                                        ) : (
                                            <>
                                                <span>✦</span>
                                                {isEdit ? 'Update Memory' : 'Save Memory'}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </form>
            </div>
        </PageTransition>
    );
}
