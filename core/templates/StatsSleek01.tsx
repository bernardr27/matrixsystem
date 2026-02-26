import React from "react";

/**
 * STATS SLEEK 01 - Matrix Template
 * Features: Horizontal metrics display, glowing accents, glassmorphism containers.
 */

interface StatItem {
    quantity: string;
    description: string;
}

interface StatsSleek01Props {
    stats?: StatItem[];
}

const StatsSleek01: React.FC<StatsSleek01Props> = ({
    stats = [
        { quantity: "1.2M+", description: "Encrypted Sessions" },
        { quantity: "99.99%", description: "Neural Uptime" },
        { quantity: "15ms", description: "Average P50 Latency" },
        { quantity: "24/7", description: "Sage Monitoring" },
    ]
}) => {
    return (
        <section className="py-12 bg-[var(--m-bg-primary)]">
            <div className="container mx-auto px-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8">
                    {stats.map((stat, index) => (
                        <div
                            key={index}
                            className="flex flex-col items-center justify-center p-4 sm:p-8 m-glass rounded-[var(--m-radius-lg)] border-[var(--m-surface-border)] shadow-md transition-all duration-500 hover:shadow-industrial hover:scale-105 group"
                        >
                            <span className="text-lg sm:text-[var(--m-text-2xl)] font-bold text-[var(--m-primary)] tracking-tight group-hover:text-[var(--m-accent-cyan)] transition-colors duration-300">
                                {stat.quantity}
                            </span>
                            <span className="text-[9px] sm:text-[var(--m-text-xs)] text-[var(--m-fg-muted)] uppercase tracking-widest mt-2 text-center leading-tight">
                                {stat.description}
                            </span>
                            {/* Decorative underline */}
                            <div className="w-8 h-[2px] bg-[var(--m-accent-cyan)] mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default StatsSleek01;
