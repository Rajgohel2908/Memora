import React from "react";
import { FaFacebook, FaInstagram, FaLinkedin, FaTwitter } from "react-icons/fa";

const defaultSections = [
    {
        title: "Product",
        links: [
            { name: "Overview", href: "#" },
            { name: "Features", href: "#" },
            { name: "Pricing", href: "#" },
            { name: "Integrations", href: "#" },
        ],
    },
    {
        title: "Company",
        links: [
            { name: "About", href: "#" },
            { name: "Team", href: "#" },
            { name: "Blog", href: "#" },
            { name: "Contact", href: "#" },
        ],
    },
    {
        title: "Legal",
        links: [
            { name: "Privacy Policy", href: "#" },
            { name: "Terms of Service", href: "#" },
            { name: "Cookie Policy", href: "#" },
        ],
    },
];

const defaultSocialLinks = [
    { icon: <FaInstagram className="w-5 h-5" />, href: "#", label: "Instagram" },
    { icon: <FaFacebook className="w-5 h-5" />, href: "#", label: "Facebook" },
    { icon: <FaTwitter className="w-5 h-5" />, href: "#", label: "Twitter" },
    { icon: <FaLinkedin className="w-5 h-5" />, href: "#", label: "LinkedIn" },
];

const defaultLegalLinks = [
    { name: "Terms and Conditions", href: "#" },
    { name: "Privacy Policy", href: "#" },
];

export const Footer7 = ({
    logo = {
        url: "/",
        title: "Memora",
    },
    sections = defaultSections,
    description = "A beautiful space to capture, organize, and revisit the moments that matter most.",
    socialLinks = defaultSocialLinks,
    copyright = "© 2026 Memora. All rights reserved.",
    legalLinks = defaultLegalLinks,
}) => {
    return (
        <section className="py-16 md:py-24 bg-memora-bg text-memora-text">
            <div className="container mx-auto">
                <div className="flex w-full flex-col justify-between gap-10 lg:flex-row lg:items-start lg:text-left">
                    <div className="flex w-full flex-col justify-between gap-6 lg:items-start">
                        {/* Logo */}
                        <div className="flex items-center gap-2 lg:justify-start">
                            <span className="text-memora-card">✦</span>
                            <h2 className="text-xl font-semibold text-memora-text">{logo.title}</h2>
                        </div>
                        <p className="max-w-[70%] text-sm text-memora-text-muted">
                            {description}
                        </p>
                        <ul className="flex items-center space-x-6 text-memora-text-muted">
                            {socialLinks.map((social, idx) => (
                                <li key={idx} className="font-medium hover:text-memora-card transition-colors">
                                    <a href={social.href} aria-label={social.label}>
                                        {social.icon}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="grid w-full gap-6 md:grid-cols-3 lg:gap-20">
                        {sections.map((section, sectionIdx) => (
                            <div key={sectionIdx}>
                                <h3 className="mb-4 font-bold text-memora-text">{section.title}</h3>
                                <ul className="space-y-3 text-sm text-memora-text-muted">
                                    {section.links.map((link, linkIdx) => (
                                        <li
                                            key={linkIdx}
                                            className="font-medium hover:text-memora-card transition-colors"
                                        >
                                            <a href={link.href}>{link.name}</a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="mt-8 flex flex-col justify-between gap-4 border-t border-memora-card/30 py-8 text-xs font-medium text-memora-text-muted md:flex-row md:items-center md:text-left">
                    <p className="order-2 lg:order-1">{copyright}</p>
                    <ul className="order-1 flex flex-col gap-2 md:order-2 md:flex-row md:gap-4">
                        {legalLinks.map((link, idx) => (
                            <li key={idx} className="hover:text-memora-card transition-colors">
                                <a href={link.href}> {link.name}</a>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </section>
    );
};
