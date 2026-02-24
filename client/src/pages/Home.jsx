import IntroAnimation from '../components/ui/scroll-morph-hero';

export default function Home() {
    return (
        <div style={{ backgroundColor: '#DEDED1', width: '100vw', height: '100vh', overflow: 'hidden', position: 'fixed', inset: 0 }}>
            {/* ─── Translucent Navbar ─── */}
            <nav style={{
                position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 32px',
                background: 'rgba(222, 222, 209, 0.4)',
                backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                borderBottom: '1px solid rgba(182, 174, 159, 0.15)',
            }}>
                <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1.25rem', fontWeight: 600, color: '#3f3a34', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: '#B6AE9F' }}>✦</span> Memora
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <a href="/auth" style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.85rem', fontWeight: 500, color: '#5C554D', textDecoration: 'none', padding: '8px 16px', borderRadius: 8 }}>Login</a>
                    <a href="/auth" style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.85rem', fontWeight: 500, color: '#DEDED1', background: 'linear-gradient(135deg, #B6AE9F, #9A9285)', textDecoration: 'none', padding: '8px 20px', borderRadius: 8, boxShadow: '0 2px 8px rgba(58,53,48,0.15)' }}>Sign Up</a>
                </div>
            </nav>

            {/* ─── Full-Page Scroll Hero (contains all sections) ─── */}
            <section style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}>
                <IntroAnimation />
            </section>
        </div>
    );
}
