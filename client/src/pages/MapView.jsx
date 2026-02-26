import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { getMyMemories } from '../services/api';
import PageTransition from '../components/PageTransition';
import { useToast } from '../components/ToastProvider';
import { useTheme } from '../context/ThemeContext';
import './MapView.css';

const MOOD_COLORS = {
    happy: '#E2C07D',
    nostalgic: '#C4766A',
    peaceful: '#8BAF88',
    excited: '#D4B778',
    reflective: '#9BA3C6',
    default: '#B6AE9F'
};

export default function MapView() {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const [memories, setMemories] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const toast = useToast();
    const { theme } = useTheme();

    // Mapbox setup without token using CARTO dark matter
    useEffect(() => {
        loadMemories();
    }, []);

    const loadMemories = async () => {
        try {
            // Fetch all memories (limit 1000)
            const res = await getMyMemories({ limit: 1000 });
            // Filter only memories with lat/lng
            const spatialMemories = res.data.memories.filter(m => m.location?.lat && m.location?.lng);
            setMemories(spatialMemories);
        } catch (error) {
            console.error('Error fetching memories for map:', error);
            toast.error('Failed to load spatial memories');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (loading || !mapContainer.current) return;

        const cartoStyle = theme === 'dark'
            ? 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
            : 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json';

        if (!map.current) {
            map.current = new maplibregl.Map({
                container: mapContainer.current,
                style: cartoStyle,
                center: [0, 20],
                zoom: 1.5,
                pitch: 45,
                renderWorldCopies: false,
            });

            map.current.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');

            map.current.on('load', () => {
                renderMemoriesOnMap(memories);
            });
        } else {
            // Update style dynamically on theme change
            map.current.setStyle(cartoStyle);
        }
    }, [loading, memories, theme]);

    const renderMemoriesOnMap = (spatialMemories) => {
        if (!map.current) return;

        spatialMemories.forEach((memory, index) => {
            const el = document.createElement('div');
            el.className = 'map-marker';
            el.style.backgroundColor = MOOD_COLORS[memory.mood] || MOOD_COLORS.default;
            el.style.boxShadow = `0 0 15px ${MOOD_COLORS[memory.mood] || MOOD_COLORS.default}`;

            // Add popup
            const popup = new maplibregl.Popup({ offset: 25, closeButton: false }).setHTML(`
                <div class="map-popup-content">
                    <h4 style="margin:0 0 5px 0; color:var(--text-primary); font-size:14px;">${memory.title || 'Memory'}</h4>
                    <p style="margin:0; font-size:12px; color:var(--text-secondary);">${new Date(memory.memoryDate).toLocaleDateString()}</p>
                </div>
            `);

            const marker = new maplibregl.Marker(el)
                .setLngLat([memory.location.lng, memory.location.lat])
                .setPopup(popup)
                .addTo(map.current);

            // Click behavior
            el.addEventListener('dblclick', () => {
                navigate(`/memory/${memory._id}`);
            });
        });

        drawArcs(spatialMemories);
    };

    const drawArcs = (spatialMemories) => {
        if (!map.current || spatialMemories.length < 2) return;

        // Sort by date to connect sequentially
        const sorted = [...spatialMemories].sort((a, b) => new Date(a.memoryDate) - new Date(b.memoryDate));

        const coordinates = sorted.map(m => [m.location.lng, m.location.lat]);

        map.current.addSource('route', {
            'type': 'geojson',
            'data': {
                'type': 'Feature',
                'properties': {},
                'geometry': {
                    'type': 'LineString',
                    'coordinates': coordinates
                }
            }
        });

        map.current.addLayer({
            'id': 'route',
            'type': 'line',
            'source': 'route',
            'layout': {
                'line-join': 'round',
                'line-cap': 'round'
            },
            'paint': {
                'line-color': '#fff',
                'line-width': 2,
                'line-opacity': 0.3,
                'line-dasharray': [2, 4]
            }
        });
    };

    return (
        <PageTransition className="map-view-wrapper">
            <div className="map-header">
                <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)} style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 10 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                    Back
                </button>
                <div className="map-title-overlay">
                    <h2>Spatial Memory Map</h2>
                    <p>{memories.length} pinned memories</p>
                </div>
            </div>

            {loading ? (
                <div className="loading-overlay">
                    <div className="spinner"></div>
                    <span>Mapping your journey...</span>
                </div>
            ) : (
                <div ref={mapContainer} className="map-container" />
            )}
        </PageTransition>
    );
}
