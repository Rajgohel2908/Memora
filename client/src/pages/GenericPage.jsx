import { useParams, useNavigate } from 'react-router-dom';
import PageTransition from '../components/PageTransition';

export default function GenericPage() {
    const { pageId } = useParams();
    const navigate = useNavigate();

    // Convert pageId like "privacy-policy" to "Privacy Policy"
    const title = pageId ? pageId.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : 'Page Not Found';

    return (
        <PageTransition className="generic-page">
            <div className="container-wide" style={{ padding: '40px 20px 80px', minHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
                <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => navigate(-1)}
                    style={{ alignSelf: 'flex-start', marginBottom: '20px' }}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                    Back
                </button>
                <div style={{
                    maxWidth: '800px',
                    margin: '0 auto',
                    width: '100%',
                    background: 'var(--warm-taupe)',
                    padding: '40px',
                    borderRadius: '16px',
                    border: '1px solid var(--taupe-light)',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
                }}>
                    <h1 style={{ color: 'var(--cream-beige)', fontFamily: '"Playfair Display", serif', marginBottom: '20px', fontSize: '2.5rem' }}>
                        {title}
                    </h1>
                    <div style={{ color: 'var(--text-secondary)', lineHeight: '1.8', fontSize: '1.1rem' }}>
                        <p style={{ marginBottom: '15px' }}>
                            Welcome to the {title} page. This is a placeholder for your actual policies, terms, or about section.
                        </p>
                        <p>
                            Eventually, you can load real content here dynamically depending on the URL parameter (<code>{pageId}</code>).
                        </p>
                    </div>
                </div>
            </div>
        </PageTransition>
    );
}
