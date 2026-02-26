import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getFriends, searchUsers, sendFriendRequest, acceptFriendRequest, rejectFriendRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastProvider';
import PageTransition from '../components/PageTransition';
import './Friends.css';

// Reusable avatar component
const UserAvatar = ({ user, size = 44 }) => {
    const src = user?.profileImage
        ? `http://localhost:5000${user.profileImage}`
        : '/default-avatar.png';
    return (
        <img
            src={src}
            alt={user?.displayName || user?.username || 'User'}
            className="fr-avatar-img"
            style={{ width: size, height: size }}
        />
    );
};

export default function Friends() {
    const [friends, setFriends] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('network');
    const { user: currentUser } = useAuth();
    const toast = useToast();

    useEffect(() => {
        const fetchFriends = async () => {
            try {
                const res = await getFriends();
                setFriends(res.data.friends || []);
            } catch (err) {
                toast.error("Failed to load friend connections");
            } finally {
                setLoading(false);
            }
        };
        fetchFriends();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const fetchSearch = async () => {
            if (searchQuery.length < 2) {
                setSearchResults([]);
                setIsSearching(false);
                return;
            }
            setIsSearching(true);
            try {
                const res = await searchUsers(searchQuery);
                setSearchResults(res.data.users || []);
            } catch (err) {
                console.error(err);
            } finally {
                setIsSearching(false);
            }
        };
        const timer = setTimeout(fetchSearch, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleAction = async (actionFn, id, successMessage) => {
        try {
            await actionFn(id);
            toast.success(successMessage);
            const res = await getFriends();
            setFriends(res.data.friends || []);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Error completing action');
        }
    };

    const acceptedFriends = friends.filter(f => f.status === 'accepted');
    // sentBy must explicitly be someone else's ID for incoming; if missing or === mine, it's outgoing
    const myId = currentUser?._id;
    const incomingRequests = friends.filter(f => f.status === 'pending' && f.sentBy && String(f.sentBy) !== String(myId));
    const outgoingRequests = friends.filter(f => f.status === 'pending' && (!f.sentBy || String(f.sentBy) === String(myId)));
    const totalPending = incomingRequests.length + outgoingRequests.length;

    const cardVariants = {
        hidden: { opacity: 0, y: 12 },
        visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.3, ease: [0.4, 0, 0.2, 1] } }),
        exit: { opacity: 0, x: -20, transition: { duration: 0.2 } }
    };

    return (
        <PageTransition className="friends-page">
            <div className="fr-container">
                {/* Hero Header */}
                <div className="fr-hero">
                    <div className="fr-hero-content">
                        <h1 className="fr-title">
                            <span className="fr-title-icon">✦</span>
                            Connections
                        </h1>
                        <p className="fr-subtitle">Find people, build your circle, share memories together.</p>
                    </div>
                    <div className="fr-stats-row">
                        <div className="fr-stat">
                            <span className="fr-stat-num">{acceptedFriends.length}</span>
                            <span className="fr-stat-label">Friends</span>
                        </div>
                        <div className="fr-stat-divider" />
                        <div className="fr-stat">
                            <span className="fr-stat-num">{incomingRequests.length}</span>
                            <span className="fr-stat-label">Incoming</span>
                        </div>
                        <div className="fr-stat-divider" />
                        <div className="fr-stat">
                            <span className="fr-stat-num">{outgoingRequests.length}</span>
                            <span className="fr-stat-label">Sent</span>
                        </div>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="fr-search-wrapper">
                    <div className="fr-search-inner">
                        <svg className="fr-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        <input
                            type="text"
                            className="fr-search-input"
                            placeholder="Search by name or username…"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button className="fr-search-clear" onClick={() => setSearchQuery('')}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            </button>
                        )}
                    </div>
                </div>

                {/* Search Results Dropdown */}
                <AnimatePresence>
                    {searchQuery.length > 1 && (
                        <motion.div
                            className="fr-search-results"
                            initial={{ opacity: 0, y: -8, height: 0 }}
                            animate={{ opacity: 1, y: 0, height: 'auto' }}
                            exit={{ opacity: 0, y: -8, height: 0 }}
                            transition={{ duration: 0.25 }}
                        >
                            <div className="fr-search-results-header">
                                <span>Results</span>
                                {isSearching && <span className="fr-spinner" />}
                            </div>
                            <div className="fr-search-results-list">
                                {searchResults.length > 0 ? searchResults.map((user, i) => {
                                    const conn = friends.find(f => f.user?._id === user._id);
                                    return (
                                        <motion.div
                                            key={user._id}
                                            className="fr-user-row"
                                            custom={i}
                                            variants={cardVariants}
                                            initial="hidden"
                                            animate="visible"
                                        >
                                            <div className="fr-user-info">
                                                <UserAvatar user={user} size={38} />
                                                <div className="fr-user-text">
                                                    <span className="fr-user-name">{user.displayName || user.username}</span>
                                                    <span className="fr-user-handle">@{user.username}</span>
                                                </div>
                                                {!user.isPublic && (
                                                    <span className="fr-badge fr-badge-private">
                                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C9.243 2 7 4.243 7 7v3H6c-1.103 0-2 .897-2 2v8c0 1.103.897 2 2 2h12c1.103 0 2-.897 2-2v-8c0-1.103-.897-2-2-2h-1V7c0-2.757-2.243-5-5-5zm0 2c1.654 0 3 1.346 3 3v3H9V7c0-1.654 1.346-3 3-3z" /></svg>
                                                        Private
                                                    </span>
                                                )}
                                            </div>
                                            <div className="fr-action-col">
                                                {conn ? (
                                                    <span className={`fr-badge fr-badge-${conn.status}`}>{conn.status}</span>
                                                ) : (
                                                    <button className="fr-btn fr-btn-add" onClick={() => handleAction(sendFriendRequest, user._id, 'Request sent!')}>
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                                                        Add
                                                    </button>
                                                )}
                                            </div>
                                        </motion.div>
                                    );
                                }) : (
                                    !isSearching && (
                                        <div className="fr-empty-search">
                                            No users found for "<strong>{searchQuery}</strong>"
                                        </div>
                                    )
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Tab Navigation */}
                {searchQuery.length <= 1 && !loading && (
                    <div className="fr-tabs">
                        <button className={`fr-tab ${activeTab === 'network' ? 'active' : ''}`} onClick={() => setActiveTab('network')}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                            My Network
                            {acceptedFriends.length > 0 && <span className="fr-tab-count">{acceptedFriends.length}</span>}
                        </button>
                        <button className={`fr-tab ${activeTab === 'requests' ? 'active' : ''}`} onClick={() => setActiveTab('requests')}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><polyline points="17 11 19 13 23 9" /></svg>
                            Requests
                            {totalPending > 0 && <span className="fr-tab-count fr-tab-count-alert">{totalPending}</span>}
                        </button>
                    </div>
                )}

                {/* Tab Content */}
                {searchQuery.length <= 1 && !loading && (
                    <AnimatePresence mode="wait">
                        {/* Network Tab */}
                        {activeTab === 'network' && (
                            <motion.div key="network" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }} className="fr-tab-content">
                                {acceptedFriends.length > 0 ? (
                                    <div className="fr-card-grid">
                                        {acceptedFriends.map((f, i) => (
                                            <motion.div
                                                key={f.user?._id}
                                                className="fr-friend-card"
                                                custom={i}
                                                variants={cardVariants}
                                                initial="hidden"
                                                animate="visible"
                                            >
                                                <div className="fr-friend-card-top">
                                                    <UserAvatar user={f.user} size={52} />
                                                    <div className="fr-friend-card-info">
                                                        <span className="fr-user-name">{f.user?.displayName || f.user?.username}</span>
                                                        <span className="fr-user-handle">@{f.user?.username}</span>
                                                    </div>
                                                </div>
                                                <div className="fr-friend-card-actions">
                                                    <button className="fr-btn fr-btn-ghost fr-btn-sm" title="Message" disabled>
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                                                    </button>
                                                    <button
                                                        className="fr-btn fr-btn-ghost fr-btn-sm fr-btn-danger"
                                                        title="Remove"
                                                        onClick={() => handleAction(rejectFriendRequest, f.user?._id, 'Connection removed')}
                                                    >
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="18" y1="8" x2="23" y2="13" /><line x1="23" y1="8" x2="18" y2="13" /></svg>
                                                    </button>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="fr-empty-state">
                                        <div className="fr-empty-icon">
                                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                                        </div>
                                        <h3 className="fr-empty-title">Your network awaits</h3>
                                        <p className="fr-empty-desc">Search for people above to start building your circle of memory keepers.</p>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* Requests Tab */}
                        {activeTab === 'requests' && (
                            <motion.div key="requests" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }} className="fr-tab-content">
                                {/* Incoming */}
                                {incomingRequests.length > 0 && (
                                    <div className="fr-request-section">
                                        <h4 className="fr-section-label">
                                            <span className="fr-pulse-dot" />
                                            Incoming Requests
                                        </h4>
                                        {incomingRequests.map((f, i) => (
                                            <motion.div key={f.user?._id} className="fr-request-card fr-request-incoming" custom={i} variants={cardVariants} initial="hidden" animate="visible">
                                                <div className="fr-user-info">
                                                    <UserAvatar user={f.user} size={44} />
                                                    <div className="fr-user-text">
                                                        <span className="fr-user-name">{f.user?.displayName || f.user?.username}</span>
                                                        <span className="fr-user-handle">@{f.user?.username}</span>
                                                    </div>
                                                </div>
                                                <div className="fr-request-actions">
                                                    <button className="fr-btn fr-btn-accept" onClick={() => handleAction(acceptFriendRequest, f.user?._id, 'Request accepted!')}>
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                                        Accept
                                                    </button>
                                                    <button className="fr-btn fr-btn-ghost fr-btn-sm" onClick={() => handleAction(rejectFriendRequest, f.user?._id, 'Request declined')}>
                                                        Decline
                                                    </button>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}

                                {/* Outgoing */}
                                {outgoingRequests.length > 0 && (
                                    <div className="fr-request-section">
                                        <h4 className="fr-section-label">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                                            Sent Requests
                                        </h4>
                                        {outgoingRequests.map((f, i) => (
                                            <motion.div key={f.user?._id} className="fr-request-card fr-request-outgoing" custom={i} variants={cardVariants} initial="hidden" animate="visible">
                                                <div className="fr-user-info">
                                                    <UserAvatar user={f.user} size={44} />
                                                    <div className="fr-user-text">
                                                        <span className="fr-user-name">{f.user?.displayName || f.user?.username}</span>
                                                        <span className="fr-user-handle">@{f.user?.username}</span>
                                                    </div>
                                                </div>
                                                <div className="fr-request-actions">
                                                    <button className="fr-btn fr-btn-cancel" onClick={() => handleAction(rejectFriendRequest, f.user?._id, 'Request cancelled')}>
                                                        Cancel
                                                    </button>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}

                                {totalPending === 0 && (
                                    <div className="fr-empty-state">
                                        <div className="fr-empty-icon">
                                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                                        </div>
                                        <h3 className="fr-empty-title">All caught up</h3>
                                        <p className="fr-empty-desc">No pending requests at the moment.</p>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                )}
            </div>
        </PageTransition>
    );
}
