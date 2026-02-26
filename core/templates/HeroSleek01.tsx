import React from "react";

/**
 * HERO SLEEK 01 - Matrix Template
 * Derived from Treact, refactored for Matrix Design System.
 * Features: Two-column layout, glassmorphism surfacing, fluid typography.
 */

interface HeroSleek01Props {
    heading?: string;
    description?: string;
    primaryButtonText?: string;
    primaryButtonUrl?: string;
    secondaryButtonText?: string;
    secondaryButtonUrl?: string;
    imageSrc?: string;
}

const HeroSleek01: React.FC<HeroSleek01Props> = ({
    heading = "Infrastructure Reimagined for the Neural Era",
    description = "Deploy resilient, high-performance services with automated self-healing and cognitive orchestration. Experience the future of system management.",
    primaryButtonText = "Initialize Core",
    primaryButtonUrl = "/setup",
    secondaryButtonText = "Browse Documentation",
    secondaryButtonUrl = "/docs",
    imageSrc = "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&q=80&w=2832&ixlib=rb-4.0.3"
}) => {
    return (
        <section className="relative min-h-[60vh] flex items-center overflow-hidden py-12 lg:py-24">
            {/* Background Decorative Elemets */}
            <div className="absolute inset-0 -z-10 bg-[var(--m-bg-primary)]">
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[var(--m-accent-cyan)] opacity-[0.03] blur-[120px] animate-pulse-slow"></div>
                <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-[var(--m-accent-violet)] opacity-[0.03] blur-[120px]"></div>
            </div>

            <div className="container mx-auto px-6 lg:px-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">

                    {/* Text Column */}
                    <div className="flex flex-col gap-8 text-center lg:text-left items-center lg:items-start">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--m-surface-border)] text-[var(--m-accent-cyan)] text-[var(--m-text-xs)] font-medium tracking-wide m-glass">
                            <span className="w-2 h-2 rounded-full bg-[var(--m-accent-cyan)] animate-pulse"></span>
                            PROTOCOL VERSION 4.2 ACTIVE
                        </div>

                        <h1 className="text-[var(--m-text-4xl)] font-bold tracking-tight text-[var(--m-fg-primary)] leading-[1.1] max-w-2xl">
                            {heading.split(" ").map((word, i) => (
                                <span key={i} className={i % 3 === 2 ? "text-[var(--m-accent-cyan)]" : ""}>
                                    {word}{" "}
                                </span>
                            ))}
                        </h1>

                        <p className="text-[var(--m-text-lg)] text-[var(--m-fg-secondary)] max-w-xl leading-relaxed">
                            {description}
                        </p>

                        <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                            <a
                                href={primaryButtonUrl}
                                className="px-8 py-4 rounded-[var(--m-radius-md)] bg-[var(--m-primary)] text-[var(--m-primary-fg)] font-semibold transition-all duration-300 hover:scale-105 hover:shadow-glow-cyan"
                            >
                                {primaryButtonText}
                            </a>
                            <a
                                href={secondaryButtonUrl}
                                className="px-8 py-4 rounded-[var(--m-radius-md)] border border-[var(--m-surface-border)] text-[var(--m-fg-primary)] font-semibold transition-all duration-300 hover:bg-[var(--m-surface-hover)] m-glass"
                            >
                                {secondaryButtonText}
                            </a>
                        </div>

                        {/* Social Proof / Metrics */}
                        <div className="flex flex-wrap items-center gap-6 sm:gap-8 mt-4 pt-8 border-t border-[var(--m-surface-border)] w-full justify-center lg:justify-start">
                            <div className="flex flex-col">
                                <span className="text-[var(--m-text-2xl)] font-bold">99.9%</span>
                                <span className="text-[var(--m-text-xs)] text-[var(--m-fg-muted)] uppercase tracking-widest">SLA Uptime</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[var(--m-text-2xl)] font-bold">2.4ms</span>
                                <span className="text-[var(--m-text-xs)] text-[var(--m-fg-muted)] uppercase tracking-widest">Global Latency</span>
                            </div>
                        </div>
                    </div>

                    {/* Illustration/Image Column */}
                    <div className="relative group perspective-2000">
                        <div className="absolute inset-0 bg-gradient-to-tr from-[var(--m-accent-cyan)]/20 to-transparent blur-3xl rounded-full opacity-30 group-hover:opacity-50 transition-opacity duration-1000"></div>
                        <div className="relative m-glass rounded-[var(--m-radius-lg)] p-4 rotate-x-12 group-hover:rotate-0 transition-transform duration-1000 shadow-2xl">
                            <img
                                src={imageSrc}
                                alt="Dashboard Interface"
                                className="rounded-[var(--m-radius-md)] w-full h-auto object-cover"
                            />

                            {/* Floating Overlay Elements */}
                            <div className="absolute -top-8 -right-8 p-4 m-glass rounded-[var(--m-radius-md)] shadow-xl animate-bounce-slow">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-[var(--m-accent-emerald)]/20 flex items-center justify-center">
                                        <div className="w-2 h-2 rounded-full bg-[var(--m-accent-emerald)] shadow-glow-emerald"></div>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[var(--m-text-xs)] font-bold">Secure</span>
                                        <span className="text-[10px] text-[var(--m-fg-muted)] uppercase">Encrypted Pool</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
};

export default HeroSleek01;
