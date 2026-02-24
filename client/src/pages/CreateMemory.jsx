import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import gsap from 'gsap';
import { useToast } from '../components/ToastProvider';
import { createMemory, getMemory, updateMemory } from '../services/api';
import './CreateMemory.css';

const MOODS = [
    { value: 'happy', emoji: '😊', label: 'Happy' },
    { value: 'nostalgic', emoji: '🥀', label: 'Nostalgic' },
    { value: 'peaceful', emoji: '🕊️', label: 'Peaceful' },
    { value: 'excited', emoji: '⚡', label: 'Excited' },
    { value: 'grateful', emoji: '🙏', label: 'Grateful' },
    { value: 'reflective', emoji: '🌙', label: 'Reflective' },
    { value: 'bittersweet', emoji: '🍂', label: 'Bittersweet' },
    { value: 'adventurous', emoji: '🧭', label: 'Adventurous' },
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
    });
    const [photos, setPhotos] = useState([]);
    const [existingPhotos, setExistingPhotos] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [loading, setLoading] = useState(false);
    const [dragActive, setDragActive] = useState(false);

    useEffect(() => {
        if (isEdit) {
            loadMemory();
        }
    }, [id]);

    useEffect(() => {
        gsap.fromTo(
            formRef.current,
            { opacity: 0, y: 30 },
            { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }
        );
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
            });
            setExistingPhotos(m.photos || []);
        } catch {
            toast.error('Memory not found');
            navigate('/dashboard');
        }
    };

    const handleChange = (e) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleFiles = (files) => {
        const fileArr = Array.from(files).filter((f) => f.type.startsWith('image/'));
        setPhotos((prev) => [...prev, ...fileArr]);

        fileArr.forEach((file) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                setPreviews((prev) => [...prev, e.target.result]);
            };
            reader.readAsDataURL(file);
        });
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragActive(false);
        handleFiles(e.dataTransfer.files);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setDragActive(true);
    };

    const handleDragLeave = () => setDragActive(false);

    const removePhoto = (index) => {
        setPhotos((prev) => prev.filter((_, i) => i !== index));
        setPreviews((prev) => prev.filter((_, i) => i !== index));
    };

    const removeExistingPhoto = (index) => {
        setExistingPhotos((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.title && !form.content && photos.length === 0 && existingPhotos.length === 0) {
            toast.error('Add a title, some text, or photos to create a memory');
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('title', form.title);
            formData.append('content', form.content);
            formData.append('memoryDate', form.memoryDate);
            if (form.mood) {
                formData.append('mood', form.mood);
            }
            if (form.tags) {
                formData.append('tags', JSON.stringify(form.tags.split(',').map((t) => t.trim()).filter(Boolean)));
            }
            photos.forEach((photo) => formData.append('photos', photo));

            if (isEdit) {
                formData.append('existingPhotos', JSON.stringify(existingPhotos));
                await updateMemory(id, formData);
                toast.success('Memory updated!');
            } else {
                await createMemory(formData);
                toast.success('Memory created!');
            }

            navigate('/dashboard');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save memory');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="create-memory">
            <div className="container" ref={formRef}>
                <div className="create-header">
                    <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="15 18 9 12 15 6" />
                        </svg>
                        Back
                    </button>
                    <h1>{isEdit ? 'Edit Memory' : 'New Memory'}</h1>
                    <p className="create-desc">
                        {isEdit
                            ? 'Update your memory details'
                            : 'Capture a moment, add photos, or write your story'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="create-form">
                    <div className="form-section">
                        {/* Photo Upload */}
                        <div
                            className={`photo-drop-zone ${dragActive ? 'active' : ''}`}
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                        >
                            <div className="drop-content">
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                                </svg>
                                <p>Drop photos here or <label htmlFor="photo-input" className="drop-browse">browse</label></p>
                                <span className="drop-hint">JPEG, PNG, GIF, WebP up to 10MB</span>
                            </div>
                            <input
                                id="photo-input"
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={(e) => handleFiles(e.target.files)}
                                style={{ display: 'none' }}
                            />
                        </div>

                        {/* Photo Previews */}
                        {(previews.length > 0 || existingPhotos.length > 0) && (
                            <div className="photo-previews">
                                {existingPhotos.map((photo, i) => (
                                    <div key={`existing-${i}`} className="preview-item">
                                        <img src={`http://localhost:5000${photo}`} alt="" />
                                        <button
                                            type="button"
                                            className="preview-remove"
                                            onClick={() => removeExistingPhoto(i)}
                                        >✕</button>
                                    </div>
                                ))}
                                {previews.map((src, i) => (
                                    <div key={`new-${i}`} className="preview-item">
                                        <img src={src} alt="" />
                                        <button
                                            type="button"
                                            className="preview-remove"
                                            onClick={() => removePhoto(i)}
                                        >✕</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="form-section">
                        <div className="input-group">
                            <label htmlFor="title">Title</label>
                            <input
                                id="title"
                                name="title"
                                type="text"
                                className="input-field"
                                placeholder="Give this memory a title..."
                                value={form.title}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="input-group">
                            <label htmlFor="content">Story / Notes</label>
                            <textarea
                                id="content"
                                name="content"
                                className="input-field"
                                placeholder="Write about this moment..."
                                value={form.content}
                                onChange={handleChange}
                                rows={5}
                            />
                        </div>

                        <div className="form-row">
                            <div className="input-group">
                                <label htmlFor="memoryDate">Date</label>
                                <input
                                    id="memoryDate"
                                    name="memoryDate"
                                    type="date"
                                    className="input-field"
                                    value={form.memoryDate}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="input-group">
                                <label htmlFor="tags">Tags</label>
                                <input
                                    id="tags"
                                    name="tags"
                                    type="text"
                                    className="input-field"
                                    placeholder="travel, family, sunset..."
                                    value={form.tags}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {/* Mood Selector */}
                        <div className="input-group">
                            <label>Mood</label>
                            <div className="mood-selector">
                                {MOODS.map((mood) => (
                                    <button
                                        key={mood.value}
                                        type="button"
                                        className={`mood-option ${form.mood === mood.value ? 'selected' : ''}`}
                                        onClick={() => setForm((prev) => ({ ...prev, mood: prev.mood === mood.value ? '' : mood.value }))}
                                    >
                                        <span className="mood-emoji">{mood.emoji}</span>
                                        <span className="mood-label">{mood.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                            {loading ? (
                                <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }}></div>
                            ) : isEdit ? (
                                'Update Memory'
                            ) : (
                                '✦ Save Memory'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
