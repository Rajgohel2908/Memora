import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { getMyMemories } from '../services/api';
import { DataSet, Network } from 'vis-network/standalone';
import PageTransition from '../components/PageTransition';
import './NetworkView.css';

const MOOD_COLORS = {
    happy: '#E8C547',
    nostalgic: '#B8A9C9',
    peaceful: '#A3B5A0',
    excited: '#E8915A',
    grateful: '#D4A59A',
    reflective: '#7BA0C4',
    bittersweet: '#C4A3B0',
    adventurous: '#D4B778',
};

export default function NetworkView() {
    const navigate = useNavigate();
    const networkRef = useRef(null);
    const containerRef = useRef(null);
    const networkInstanceRef = useRef(null);
    const controlsRef = useRef(null);

    const [memories, setMemories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [zoomLevel, setZoomLevel] = useState('date'); // 'date', 'month', 'year'
    const [selectedMemory, setSelectedMemory] = useState(null);
    const [hoveredNode, setHoveredNode] = useState(null);

    // Filter states
    const [activeFilterType, setActiveFilterType] = useState('all'); // 'all', 'mood', 'tag'
    const [activeFilterValue, setActiveFilterValue] = useState('');
    const [availableTags, setAvailableTags] = useState([]);
    const [availableMoods, setAvailableMoods] = useState([]);

    useEffect(() => {
        fetchMemories();
    }, []);

    useEffect(() => {
        if (controlsRef.current) {
            gsap.fromTo(controlsRef.current, { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' });
        }
    }, []);

    const fetchMemories = async () => {
        try {
            const res = await getMyMemories({ limit: 200, sort: 'memoryDate' });
            const mems = res.data.memories;
            setMemories(mems);

            const tagsSet = new Set();
            const moodsSet = new Set();
            mems.forEach(m => {
                if (m.mood) moodsSet.add(m.mood);
                if (m.tags) m.tags.forEach(t => tagsSet.add(t));
            });
            setAvailableTags(Array.from(tagsSet).sort());
            setAvailableMoods(Array.from(moodsSet).sort());
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const buildNetwork = useCallback(() => {
        if (!networkRef.current || memories.length === 0) return;

        // Clean up previous network
        if (networkInstanceRef.current) {
            networkInstanceRef.current.destroy();
        }

        let nodesData = [];
        let edgesData = [];

        const getRgba = (hex, alpha) => {
            if (!hex) return `rgba(182, 174, 159, ${alpha})`;
            if (hex.startsWith('rgba')) return hex;
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        };

        const matchesFilter = (m) => {
            if (activeFilterType === 'all') return true;
            if (activeFilterType === 'mood') return m.mood === activeFilterValue;
            if (activeFilterType === 'tag') return m.tags && m.tags.includes(activeFilterValue);
            return false;
        };

        if (zoomLevel === 'date') {
            // Individual memories as nodes
            nodesData = memories.map((m, i) => {
                const hasPhoto = m.photos && m.photos.length > 0;
                const date = new Date(m.memoryDate);
                const color = m.mood ? MOOD_COLORS[m.mood] : '#B6AE9F';

                const isMatch = matchesFilter(m);
                const opacity = isMatch ? 1 : 0.15;
                const bgColor = getRgba(color, opacity);
                const borderColor = getRgba(color, isMatch ? 1 : 0.3);

                return {
                    id: m._id,
                    label: m.title || date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    title: `${m.title || 'Memory'}\n${date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}${m.mood ? '\nMood: ' + m.mood : ''}`,
                    shape: hasPhoto ? 'circularImage' : 'dot',
                    image: hasPhoto ? `http://localhost:5000${m.photos[0]}` : undefined,
                    size: hasPhoto ? 30 : 22,
                    color: {
                        background: bgColor,
                        border: borderColor,
                        highlight: { background: '#FBF3D1', border: color },
                        hover: { background: '#FBF3D1', border: color },
                    },
                    borderWidth: 2,
                    borderWidthSelected: 4,
                    font: {
                        size: 11,
                        color: isMatch ? '#5C554D' : 'rgba(92, 85, 77, 0.3)',
                        face: 'Inter, sans-serif',
                    },
                    shadow: isMatch ? {
                        enabled: true,
                        color: 'rgba(58, 53, 48, 0.1)',
                        size: 8,
                        x: 0,
                        y: 3,
                    } : false,
                    memoryData: m,
                };
            });

            // Connect chronologically adjacent memories
            for (let i = 0; i < memories.length - 1; i++) {
                const m1 = memories[i];
                const m2 = memories[i + 1];
                const bothMatch = matchesFilter(m1) && matchesFilter(m2);

                edgesData.push({
                    from: m1._id,
                    to: m2._id,
                    color: {
                        color: bothMatch ? 'rgba(182, 174, 159, 0.5)' : 'rgba(182, 174, 159, 0.1)',
                        highlight: 'rgba(182, 174, 159, 0.8)'
                    },
                    width: bothMatch ? 1.5 : 1,
                    smooth: { type: 'continuous', roundness: 0.3 },
                });
            }

            // Also connect memories on same date
            const dateMap = {};
            memories.forEach((m) => {
                const key = new Date(m.memoryDate).toDateString();
                if (!dateMap[key]) dateMap[key] = [];
                dateMap[key].push(m._id);
            });
            Object.values(dateMap).forEach((ids) => {
                for (let i = 0; i < ids.length - 1; i++) {
                    edgesData.push({
                        from: ids[i],
                        to: ids[i + 1],
                        color: { color: 'rgba(212, 165, 154, 0.4)' },
                        width: 1,
                        dashes: true,
                    });
                }
            });

        } else if (zoomLevel === 'month') {
            // Group by month
            const monthGroups = {};
            memories.forEach((m) => {
                const date = new Date(m.memoryDate);
                const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                if (!monthGroups[key]) monthGroups[key] = { memories: [], date };
                monthGroups[key].memories.push(m);
            });

            const keys = Object.keys(monthGroups).sort();
            keys.forEach((key, i) => {
                const group = monthGroups[key];
                const date = group.date;
                const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

                const groupMatches = group.memories.some(m => matchesFilter(m));
                const opacity = groupMatches ? 1 : 0.2;

                nodesData.push({
                    id: key,
                    label: `${label}\n(${group.memories.length})`,
                    title: `${label}\n${group.memories.length} memories`,
                    shape: 'dot',
                    size: 20 + Math.min(group.memories.length * 4, 30),
                    color: {
                        background: `rgba(182, 174, 159, ${opacity})`,
                        border: `rgba(154, 146, 133, ${groupMatches ? 1 : 0.3})`,
                        highlight: { background: '#FBF3D1', border: '#9A9285' },
                        hover: { background: '#FBF3D1', border: '#9A9285' },
                    },
                    borderWidth: groupMatches ? 3 : 1,
                    font: {
                        size: 13,
                        color: groupMatches ? '#3A3530' : 'rgba(58, 53, 48, 0.3)',
                        face: 'Inter, sans-serif',
                        bold: { mod: 'bold' },
                    },
                    shadow: groupMatches ? { enabled: true, color: 'rgba(58,53,48,0.12)', size: 12 } : false,
                    monthKey: key,
                });

                if (i > 0) {
                    edgesData.push({
                        from: keys[i - 1],
                        to: key,
                        color: { color: 'rgba(182, 174, 159, 0.4)' },
                        width: 2,
                        smooth: { type: 'continuous', roundness: 0.3 },
                    });
                }
            });

        } else if (zoomLevel === 'year') {
            // Group by year
            const yearGroups = {};
            memories.forEach((m) => {
                const year = new Date(m.memoryDate).getFullYear().toString();
                if (!yearGroups[year]) yearGroups[year] = 0;
                yearGroups[year]++;
            });

            const years = Object.keys(yearGroups).sort();
            years.forEach((year, i) => {
                const yearMatches = memories.filter(m => new Date(m.memoryDate).getFullYear().toString() === year).some(m => matchesFilter(m));
                const opacity = yearMatches ? 1 : 0.2;

                nodesData.push({
                    id: year,
                    label: `${year}\n(${yearGroups[year]} memories)`,
                    shape: 'dot',
                    size: 30 + Math.min(yearGroups[year] * 3, 40),
                    color: {
                        background: `rgba(182, 174, 159, ${opacity})`,
                        border: `rgba(125, 117, 106, ${yearMatches ? 1 : 0.3})`,
                        highlight: { background: '#FBF3D1', border: '#7D756A' },
                        hover: { background: '#FBF3D1', border: '#7D756A' },
                    },
                    borderWidth: yearMatches ? 4 : 2,
                    font: {
                        size: 16,
                        color: yearMatches ? '#3A3530' : 'rgba(58, 53, 48, 0.4)',
                        face: '"Playfair Display", serif',
                        bold: { mod: 'bold' },
                    },
                    shadow: yearMatches ? { enabled: true, color: 'rgba(58,53,48,0.15)', size: 16 } : false,
                    yearKey: year,
                });

                if (i > 0) {
                    edgesData.push({
                        from: years[i - 1],
                        to: year,
                        color: { color: 'rgba(182, 174, 159, 0.5)' },
                        width: 3,
                        smooth: { type: 'continuous', roundness: 0.3 },
                    });
                }
            });
        }

        const nodes = new DataSet(nodesData);
        const edges = new DataSet(edgesData);

        const options = {
            nodes: {
                shape: 'dot',
                font: { multi: 'md' },
            },
            edges: {
                smooth: {
                    type: 'continuous',
                    roundness: 0.3,
                },
            },
            physics: {
                enabled: true,
                solver: 'forceAtlas2Based',
                forceAtlas2Based: {
                    gravitationalConstant: -40,
                    centralGravity: 0.008,
                    springLength: 120,
                    springConstant: 0.04,
                    damping: 0.5,
                },
                stabilization: {
                    iterations: 150,
                    fit: true,
                },
            },
            interaction: {
                hover: true,
                tooltipDelay: 200,
                zoomView: true,
                dragView: true,
                navigationButtons: false,
            },
            layout: {
                improvedLayout: true,
            },
        };

        const network = new Network(networkRef.current, { nodes, edges }, options);
        networkInstanceRef.current = network;

        // Click handler
        network.on('click', (params) => {
            if (params.nodes.length > 0) {
                const nodeId = params.nodes[0];

                if (zoomLevel === 'date') {
                    const node = nodesData.find((n) => n.id === nodeId);
                    if (node?.memoryData) {
                        setSelectedMemory(node.memoryData);
                    }
                } else if (zoomLevel === 'month') {
                    // Zoom into date level
                    gsap.to(networkRef.current, {
                        opacity: 0,
                        scale: 0.95,
                        duration: 0.3,
                        onComplete: () => {
                            setZoomLevel('date');
                            gsap.to(networkRef.current, { opacity: 1, scale: 1, duration: 0.4 });
                        },
                    });
                } else if (zoomLevel === 'year') {
                    gsap.to(networkRef.current, {
                        opacity: 0,
                        scale: 0.95,
                        duration: 0.3,
                        onComplete: () => {
                            setZoomLevel('month');
                            gsap.to(networkRef.current, { opacity: 1, scale: 1, duration: 0.4 });
                        },
                    });
                }
            } else {
                setSelectedMemory(null);
            }
        });

        network.on('hoverNode', (params) => {
            const nodeId = params.node;
            if (zoomLevel === 'date') {
                const node = nodesData.find((n) => n.id === nodeId);
                setHoveredNode(node?.memoryData || null);
            }
        });

        network.on('blurNode', () => setHoveredNode(null));

        // Stabilization animation
        network.on('stabilized', () => {
            network.fit({ animation: { duration: 800, easingFunction: 'easeInOutQuad' } });
        });

    }, [memories, zoomLevel, activeFilterType, activeFilterValue]);

    useEffect(() => {
        buildNetwork();
        return () => {
            if (networkInstanceRef.current) {
                networkInstanceRef.current.destroy();
            }
        };
    }, [buildNetwork]);

    const handleZoomChange = (level) => {
        gsap.to(networkRef.current, {
            opacity: 0,
            duration: 0.25,
            onComplete: () => {
                setZoomLevel(level);
                setSelectedMemory(null);
                gsap.to(networkRef.current, { opacity: 1, duration: 0.35 });
            },
        });
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'long', day: 'numeric', year: 'numeric',
        });
    };

    return (
        <PageTransition className="network-page">
            <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', flexDirection: 'column' }}>
                {/* Controls */}
                <div className="network-controls" ref={controlsRef}>
                    <div className="network-title-area">
                        <h2 className="network-title">Memory Network</h2>
                        <span className="network-count">{memories.length} memories</span>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div className="zoom-controls">
                            <span className="zoom-label">Zoom Level:</span>
                            <div className="zoom-toggle">
                                {['year', 'month', 'date'].map((level) => (
                                    <button
                                        key={level}
                                        className={`zoom-btn ${zoomLevel === level ? 'active' : ''}`}
                                        onClick={() => handleZoomChange(level)}
                                    >
                                        {level === 'date' ? '📅 Days' : level === 'month' ? '📆 Months' : '📊 Years'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="filter-controls">
                            <span className="filter-label" style={{ marginRight: '0.5rem', fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Filter:</span>
                            <select
                                className="filter-select"
                                value={activeFilterType === 'all' ? 'all' : `${activeFilterType}:${activeFilterValue}`}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === 'all') {
                                        setActiveFilterType('all');
                                        setActiveFilterValue('');
                                    } else {
                                        const [type, ...rest] = val.split(':');
                                        const exactVal = rest.join(':');
                                        setActiveFilterType(type);
                                        setActiveFilterValue(exactVal);
                                    }
                                }}
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: '8px',
                                    border: '1px solid var(--taupe-deeper)',
                                    background: 'var(--warm-taupe)',
                                    color: 'var(--text-primary)',
                                    fontSize: '0.85rem',
                                    outline: 'none',
                                    cursor: 'pointer'
                                }}
                            >
                                <option value="all">All Memories</option>
                                {availableMoods.length > 0 && (
                                    <optgroup label="Moods">
                                        {availableMoods.map(m => <option key={`mood:${m}`} value={`mood:${m}`}>{MOOD_COLORS[m] ? '🎨' : '✨'} {m}</option>)}
                                    </optgroup>
                                )}
                                {availableTags.length > 0 && (
                                    <optgroup label="Tags">
                                        {availableTags.map(t => <option key={`tag:${t}`} value={`tag:${t}`}>🏷️ {t}</option>)}
                                    </optgroup>
                                )}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Network Canvas */}
                {loading ? (
                    <div className="loading-overlay">
                        <div className="spinner"></div>
                        <span>Building your memory network...</span>
                    </div>
                ) : memories.length === 0 ? (
                    <div className="network-empty">
                        <span className="empty-icon">🕸️</span>
                        <h3>No memories to visualize</h3>
                        <p>Create some memories first to see them in the network view.</p>
                        <button className="btn btn-primary" onClick={() => navigate('/create')}>Create Memory</button>
                    </div>
                ) : (
                    <div className="network-canvas-wrapper">
                        <div ref={networkRef} className="network-canvas" />

                        {/* Hover tooltip */}
                        {hoveredNode && (
                            <div className="network-tooltip">
                                <strong>{hoveredNode.title || 'Memory'}</strong>
                                <span>{formatDate(hoveredNode.memoryDate)}</span>
                                {hoveredNode.mood && <span className="tooltip-mood">{hoveredNode.mood}</span>}
                            </div>
                        )}
                    </div>
                )}

                {/* Selected memory panel */}
                {selectedMemory && (
                    <div className="memory-panel">
                        <div className="panel-content">
                            <button className="panel-close" onClick={() => setSelectedMemory(null)}>✕</button>

                            {selectedMemory.photos && selectedMemory.photos.length > 0 && (
                                <div className="panel-image">
                                    <img src={`http://localhost:5000${selectedMemory.photos[0]}`} alt="" />
                                </div>
                            )}

                            <div className="panel-info">
                                <h3>{selectedMemory.title || 'Untitled Memory'}</h3>
                                <span className="panel-date">{formatDate(selectedMemory.memoryDate)}</span>
                                {selectedMemory.content && (
                                    <p className="panel-text">{selectedMemory.content.substring(0, 200)}{selectedMemory.content.length > 200 ? '...' : ''}</p>
                                )}
                                <button
                                    className="btn btn-primary btn-sm"
                                    onClick={() => navigate(`/memory/${selectedMemory._id}`)}
                                >
                                    View Full Memory
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </PageTransition>
    );
}
