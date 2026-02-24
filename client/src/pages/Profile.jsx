import { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastProvider';
import { updateProfile, getMyMemories } from '../services/api';
import './Profile.css';

export default function Profile() {
    const { user, setUser } = useAuth();
    const toast = useToast();
    const pageRef = useRef(null);

    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({
        displayName: '',
        bio: '',
    });
    const [profileImage, setProfileImage] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState({ totalMemories: 0, firstMemory: null, moods: {} });

    useEffect(() => {
        if (user) {
            setForm({ displayName: user.displayName || '', bio: user.bio || '' });
            fetchStats();
        }
    }, [user]);

    useEffect(() => {
        if (pageRef.current) {
            const elements = pageRef.current.querySelectorAll('.profile-animate');
            gsap.fromTo(
                elements,
                { opacity: 0, y: 25 },
                { opacity: 1, y: 0, duration: 0.6, stagger: 0.08, ease: 'power3.out' }
            );
        }
    }, []);

    const fetchStats = async () => {
        try {
            const res = await getMyMemories({ limit: 200, sort: 'memoryDate' });
            const memories = res.data.memories;
            const moods = {};
            memories.forEach((m) => {
                if (m.mood) moods[m.mood] = (moods[m.mood] || 0) + 1;
            });
            setStats({
                totalMemories: memories.length,
                firstMemory: memories.length > 0 ? memories[memories.length - 1] : null,
                moods,
            });
        } catch (err) {
            console.error(err);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProfileImage(file);
            const reader = new FileReader();
            reader.onload = (ev) => setImagePreview(ev.target.result);
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('displayName', form.displayName);
            formData.append('bio', form.bio);
            if (profileImage) formData.append('profileImage', profileImage);

            const res = await updateProfile(formData);
            setUser(res.data.user);
            setEditing(false);
            setProfileImage(null);
            setImagePreview('');
            toast.success('Profile updated!');
        } catch (err) {
            toast.error('Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const MOOD_EMOJIS = {
        happy: '😊', nostalgic: '🥀', peaceful: '🕊️', excited: '⚡',
        grateful: '🙏', reflective: '🌙', bittersweet: '🍂', adventurous: '🧭',
    };

    return (
        <div className="profile-page" ref={pageRef}>
            <div className="container">
                {/* Profile Header */}
                <div className="profile-header profile-animate">
                    <div className="profile-avatar-section">
                        <div className="profile-avatar-wrapper">
                            {(imagePreview || user?.profileImage) ? (
                                <img
                                    src={imagePreview || `http://localhost:5000${user.profileImage}`}
                                    alt={user?.displayName}
                                    className="profile-avatar"
                                />
                            ) : (
                                <div className="profile-avatar profile-avatar-placeholder">
                                    {(user?.displayName || user?.username || 'U')[0].toUpperCase()}
                                </div>
                            )}
                            {editing && (
                                <label className="avatar-upload-btn" htmlFor="avatar-upload">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                                    </svg>
                                </label>
                            )}
                            <input
                                id="avatar-upload"
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={handleImageChange}
                            />
                        </div>

                        <div className="profile-info">
                            {editing ? (
                                <div className="profile-edit-fields">
                                    <input
                                        type="text"
                                        className="input-field"
                                        value={form.displayName}
                                        onChange={(e) => setForm((p) => ({ ...p, displayName: e.target.value }))}
                                        placeholder="Display name"
                                    />
                                    <textarea
                                        className="input-field"
                                        value={form.bio}
                                        onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
                                        placeholder="Write a short bio..."
                                        rows={3}
                                        maxLength={300}
                                    />
                                </div>
                            ) : (
                                <>
                                    <h1 className="profile-name">{user?.displayName || user?.username}</h1>
                                    <span className="profile-username">@{user?.username}</span>
                                    {user?.bio && <p className="profile-bio">{user.bio}</p>}
                                </>
                            )}
                        </div>
                    </div>

                    <div className="profile-actions">
                        {editing ? (
                            <>
                                <button className="btn btn-ghost btn-sm" onClick={() => {
                                    setEditing(false);
                                    setProfileImage(null);
                                    setImagePreview('');
                                    setForm({ displayName: user?.displayName || '', bio: user?.bio || '' });
                                }}>Cancel</button>
                                <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={loading}>
                                    {loading ? 'Saving...' : 'Save Changes'}
                                </button>
                            </>
                        ) : (
                            <button className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                                Edit Profile
                            </button>
                        )}
                    </div>
                </div>

                {/* Stats */}
                <div className="profile-stats profile-animate">
                    <div className="stat-card">
                        <span className="stat-number">{stats.totalMemories}</span>
                        <span className="stat-label">Memories</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-number">
                            {stats.firstMemory
                                ? new Date(stats.firstMemory.memoryDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                                : '—'}
                        </span>
                        <span className="stat-label">First Memory</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-number">{Object.keys(stats.moods).length}</span>
                        <span className="stat-label">Moods Captured</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-number">
                            {new Date(user?.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        </span>
                        <span className="stat-label">Joined</span>
                    </div>
                </div>

                {/* Mood Breakdown */}
                {Object.keys(stats.moods).length > 0 && (
                    <div className="profile-section profile-animate">
                        <h3 className="section-title">Your Mood Palette</h3>
                        <div className="mood-breakdown">
                            {Object.entries(stats.moods)
                                .sort(([, a], [, b]) => b - a)
                                .map(([mood, count]) => (
                                    <div key={mood} className="mood-bar-item">
                                        <div className="mood-bar-label">
                                            <span>{MOOD_EMOJIS[mood]} {mood}</span>
                                            <span className="mood-bar-count">{count}</span>
                                        </div>
                                        <div className="mood-bar-track">
                                            <div
                                                className="mood-bar-fill"
                                                style={{
                                                    width: `${(count / stats.totalMemories) * 100}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
