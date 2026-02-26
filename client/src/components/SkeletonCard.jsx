import React from 'react';

export default function SkeletonCard() {
    return (
        <div className="card memory-card overflow-hidden h-[380px] flex flex-col relative bg-memora-surface/20" style={{ border: '1px solid var(--taupe-light)' }}>
            {/* Shimmer overlay */}
            <div className="absolute inset-0 z-10 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-memora-glow/10 to-transparent" />

            {/* Image Placeholder */}
            <div className="h-48 w-full bg-memora-card/20" />

            {/* Content Placeholder */}
            <div className="flex-1 p-5 flex flex-col gap-3">
                <div className="flex justify-between items-center mb-1">
                    <div className="h-6 w-1/3 bg-memora-card/20 rounded" />
                    <div className="h-5 w-1/4 bg-memora-card/20 rounded-full" />
                </div>

                <div className="h-4 w-full bg-memora-card/10 rounded mt-2" />
                <div className="h-4 w-5/6 bg-memora-card/10 rounded" />

                <div className="mt-auto flex gap-2 pt-4">
                    <div className="h-6 w-16 bg-memora-card/10 rounded-full" />
                    <div className="h-6 w-20 bg-memora-card/10 rounded-full" />
                </div>
            </div>
        </div>
    );
}

// Ensure the shimmer animation is available globally
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.innerHTML = `
        @keyframes shimmer {
            100% {
                transform: translateX(100%);
            }
        }
    `;
    document.head.appendChild(style);
}
