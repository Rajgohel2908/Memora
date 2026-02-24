import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastProvider';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
import * as api from '../services/api';
import './Auth.css';

export default function Auth() {
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        username: '',
        email: '',
        password: '',
        displayName: '',
    });

    const { loginUser } = useAuth();
    const toast = useToast();
    const navigate = useNavigate();
    const formRef = useRef(null);
    const cardRef = useRef(null);

    useEffect(() => {
        gsap.fromTo(
            cardRef.current,
            { opacity: 0, y: 40, scale: 0.95 },
            { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: 'power3.out' }
        );
    }, []);

    const toggleMode = () => {
        gsap.to(cardRef.current, {
            rotateY: 5,
            scale: 0.97,
            duration: 0.2,
            ease: 'power2.in',
            onComplete: () => {
                setIsLogin(!isLogin);
                setForm({ username: '', email: '', password: '', displayName: '' });
                gsap.to(cardRef.current, {
                    rotateY: 0,
                    scale: 1,
                    duration: 0.4,
                    ease: 'power2.out',
                });
            },
        });
    };

    const handleChange = (e) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            let res;
            if (isLogin) {
                res = await api.login({ email: form.email, password: form.password });
            } else {
                res = await api.signup(form);
            }

            loginUser(res.data.token, res.data.user);
            toast.success(isLogin ? 'Welcome back!' : 'Welcome to Memora!');
            navigate('/dashboard');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleAuth = async () => {
        setLoading(true);
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const idToken = await result.user.getIdToken();
            const res = await api.googleLogin(idToken);

            loginUser(res.data.token, res.data.user);
            toast.success('Welcome to Memora!');
            navigate('/dashboard');
        } catch (err) {
            console.error('Google Auth Error:', err);
            toast.error(err.response?.data?.message || 'Google authentication failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-particles">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="auth-particle" style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        animationDelay: `${i * 0.8}s`,
                        animationDuration: `${4 + Math.random() * 4}s`,
                    }} />
                ))}
            </div>

            <div className="auth-card" ref={cardRef}>
                <div className="auth-header">
                    <span className="auth-brand">✦</span>
                    <h2>{isLogin ? 'Welcome Back' : 'Join Memora'}</h2>
                    <p className="auth-desc">
                        {isLogin
                            ? 'Sign in to explore your memories'
                            : 'Create your memory archive'}
                    </p>
                </div>

                <form ref={formRef} onSubmit={handleSubmit} className="auth-form">
                    {!isLogin && (
                        <>
                            <div className="input-group">
                                <label htmlFor="username">Username</label>
                                <input
                                    id="username"
                                    name="username"
                                    type="text"
                                    className="input-field"
                                    placeholder="Choose a unique username"
                                    value={form.username}
                                    onChange={handleChange}
                                    required
                                    minLength={3}
                                />
                            </div>
                            <div className="input-group">
                                <label htmlFor="displayName">Display Name</label>
                                <input
                                    id="displayName"
                                    name="displayName"
                                    type="text"
                                    className="input-field"
                                    placeholder="How should we call you?"
                                    value={form.displayName}
                                    onChange={handleChange}
                                />
                            </div>
                        </>
                    )}

                    <div className="input-group">
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            className="input-field"
                            placeholder="your@email.com"
                            value={form.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            className="input-field"
                            placeholder="••••••••"
                            value={form.password}
                            onChange={handleChange}
                            required
                            minLength={6}
                        />
                    </div>

                    <button type="submit" className="btn btn-primary btn-lg auth-submit" disabled={loading}>
                        {loading ? (
                            <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }}></div>
                        ) : isLogin ? (
                            'Sign In'
                        ) : (
                            'Create Account'
                        )}
                    </button>

                    <div className="auth-divider">
                        <span>OR</span>
                    </div>

                    <button
                        type="button"
                        className="btn btn-outline btn-lg auth-google-btn"
                        onClick={handleGoogleAuth}
                        disabled={loading}
                    >
                        <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Continue with Google
                    </button>
                </form>

                <div className="auth-toggle">
                    <span>
                        {isLogin ? "Don't have an account?" : 'Already have an account?'}
                    </span>
                    <button className="auth-toggle-btn" onClick={toggleMode}>
                        {isLogin ? 'Sign Up' : 'Sign In'}
                    </button>
                </div>
            </div>
        </div>
    );
}
