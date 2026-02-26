import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, matchPath } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import CreateMemory from './pages/CreateMemory';
import MemoryDetail from './pages/MemoryDetail';
import NetworkView from './pages/NetworkView';
import MapView from './pages/MapView';
import Profile from './pages/Profile';
import Friends from './pages/Friends';
import ToastProvider from './components/ToastProvider';
import GenericPage from './pages/GenericPage';
import NotFound from './pages/NotFound';
import { ThemeProvider } from './context/ThemeContext';
import { AnimatePresence } from 'framer-motion';
import { Footer7 } from './components/ui/footer-7';
import './App.css';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="spinner"></div>
        <span>Loading your memories...</span>
      </div>
    );
  }
  return user ? children : <Navigate to="/auth" />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="spinner"></div>
      </div>
    );
  }
  return !user ? children : <Navigate to="/dashboard" />;
}

function AppContent() {
  const { user } = useAuth();
  const location = useLocation();
  const isPublicRoute = location.pathname === '/' || location.pathname === '/auth';

  const knownRoutes = [
    '/',
    '/auth',
    '/dashboard',
    '/create',
    '/memory/:id',
    '/memory/:id/edit',
    '/network',
    '/map',
    '/profile',
    '/friends',
    '/pages/:pageId'
  ];

  const isNotFound = !knownRoutes.some(pattern => matchPath(pattern, location.pathname));

  return (
    <div className="app">
      {user && !isNotFound && <Navbar />}
      <main className={isPublicRoute || isNotFound ? "main-full" : "main-content"}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<PublicRoute><Home /></PublicRoute>} />
            <Route path="/auth" element={<PublicRoute><Auth /></PublicRoute>} />
            <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/create" element={<PrivateRoute><CreateMemory /></PrivateRoute>} />
            <Route path="/memory/:id" element={<PrivateRoute><MemoryDetail /></PrivateRoute>} />
            <Route path="/memory/:id/edit" element={<PrivateRoute><CreateMemory /></PrivateRoute>} />
            <Route path="/network" element={<PrivateRoute><NetworkView /></PrivateRoute>} />
            <Route path="/map" element={<PrivateRoute><MapView /></PrivateRoute>} />
            <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
            <Route path="/friends" element={<PrivateRoute><Friends /></PrivateRoute>} />
            <Route path="/pages/:pageId" element={<GenericPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AnimatePresence>
      </main>
      {!['/', '/auth'].includes(location.pathname) && !isNotFound && <Footer7 />}
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <AppContent />
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}
