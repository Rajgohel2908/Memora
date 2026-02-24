import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getMe } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const checkAuth = useCallback(async () => {
        const token = localStorage.getItem('memora_token');
        if (!token) {
            setUser(null);
            setLoading(false);
            return;
        }
        try {
            const res = await getMe();
            setUser(res.data.user);
        } catch {
            localStorage.removeItem('memora_token');
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    const loginUser = (token, user) => {
        localStorage.setItem('memora_token', token);
        setUser(user);
    };

    const logout = () => {
        localStorage.removeItem('memora_token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, setUser, loading, loginUser, logout, checkAuth }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};
