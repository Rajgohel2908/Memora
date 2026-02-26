import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./footer-7.css";

export const Footer7 = () => {
    const [hoveredLink, setHoveredLink] = useState(null);
    const [emailFocused, setEmailFocused] = useState(false);

    const navSections = [
        {
            title: "Explore",
            links: [
                { name: "Dashboard", href: "/dashboard" },
                { name: "Memory Map", href: "/map" },
                { name: "Network View", href: "/network" },
                { name: "Friends", href: "/friends" },
            ],
        },
        {
            title: "Create",
            links: [
                { name: "New Memory", href: "/create" },
                { name: "Time Capsule", href: "#" },
                { name: "Voice Memo", href: "#" },
                { name: "Photo Story", href: "#" },
            ],
        },
        {
            title: "About",
            links: [
                { name: "Our Story", href: "/pages/about" },
                { name: "Privacy", href: "/pages/privacy" },
                { name: "Terms", href: "/pages/terms" },
                { name: "Contact", href: "/pages/contact" },
            ],
        },
    ];

    const currentYear = new Date().getFullYear();

    return (
        <footer className="memora-footer">
            {/* Gradient divider line */}
            <div className="footer-divider">
                <div className="footer-divider-glow" />
            </div>

            <div className="footer-container">
                {/* Top section */}
                <div className="footer-top">
                    {/* Brand column */}
                    <div className="footer-brand">
                        <Link to="/dashboard" className="footer-logo">
                            <span className="footer-logo-icon">✦</span>
                            <span className="footer-logo-text">Memora</span>
                        </Link>
                        <p className="footer-tagline">
                            Where moments become timeless.
                            <br />
                            <span className="tagline-accent">Capture. Relive. Cherish.</span>
                        </p>

                        {/* Social Icons */}
                        <div className="footer-socials">
                            <a href="#" className="social-link" aria-label="Instagram" title="Instagram">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                                </svg>
                            </a>
                            <a href="#" className="social-link" aria-label="Twitter" title="Twitter">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                                </svg>
                            </a>
                            <a href="#" className="social-link" aria-label="GitHub" title="GitHub">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                                </svg>
                            </a>
                            <a href="#" className="social-link" aria-label="LinkedIn" title="LinkedIn">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" />
                                </svg>
                            </a>
                        </div>
                    </div>

                    {/* Navigation columns */}
                    <div className="footer-nav-grid">
                        {navSections.map((section, sIdx) => (
                            <div key={sIdx} className="footer-nav-column">
                                <h4 className="footer-nav-title">{section.title}</h4>
                                <ul className="footer-nav-list">
                                    {section.links.map((link, lIdx) => {
                                        const linkKey = `${sIdx}-${lIdx}`;
                                        return (
                                            <li key={lIdx}>
                                                <Link
                                                    to={link.href}
                                                    className={`footer-nav-link ${hoveredLink === linkKey ? 'hovered' : ''}`}
                                                    onMouseEnter={() => setHoveredLink(linkKey)}
                                                    onMouseLeave={() => setHoveredLink(null)}
                                                >
                                                    <span className="link-arrow">→</span>
                                                    <span className="link-text">{link.name}</span>
                                                </Link>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Newsletter / CTA section */}
                <div className="footer-cta">
                    <div className="cta-content">
                        <h4 className="cta-title">Stay in the moment</h4>
                        <p className="cta-description">Get updates on new features and memory preservation tips.</p>
                    </div>
                    <div className={`cta-input-wrapper ${emailFocused ? 'focused' : ''}`}>
                        <input
                            type="email"
                            placeholder="your@email.com"
                            className="cta-input"
                            onFocus={() => setEmailFocused(true)}
                            onBlur={() => setEmailFocused(false)}
                        />
                        <button className="cta-button">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="footer-bottom">
                    <p className="footer-copyright">
                        © {currentYear} Memora. Crafted with
                        <span className="heart-icon"> ♥ </span>
                        for memory keepers.
                    </p>
                    <div className="footer-bottom-links">
                        <Link to="/pages/privacy">Privacy</Link>
                        <span className="dot-separator">·</span>
                        <Link to="/pages/terms">Terms</Link>
                        <span className="dot-separator">·</span>
                        <Link to="/pages/contact">Support</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};
