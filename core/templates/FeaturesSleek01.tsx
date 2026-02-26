import React from "react";

/**
 * FEATURES SLEEK 01 - Matrix Template
 * Features: High-density 3-column grid, interactive hover glow, glassmorphism cards.
 */

interface FeatureItem {
    title: string;
    description: string;
    icon: string; // Material or Lucide icon name placeholder
}

interface FeaturesSleek01Props {
    title?: string;
    subtitle?: string;
    features?: FeatureItem[];
}

export const FeaturesSleek01: React.FC<FeaturesSleek01Props> = ({
    title = "Neural Orchestration Suite",
    subtitle = "Exquisite control over your distributed infrastructure with cognitive self-healing and real-time synchronicity.",
    features = [
        { title: "Autonomous Healing", description: "Cortex monitors scan for neural synchronicities and trigger reactive pulses.", icon: "activity" },
        { title: "Ghost Protocol", description: "Encrypted real-time communication via the ghost bridge and secure telemetry links.", icon: "shield" },
        { title: "Sage Insights", description: "Deep-learning analysis of server health with predictive scaling and coherence tracking.", icon: "brain" },
        { title: "Matrix Registry", description: "Unified instance management across local, edge, and cloud environments.", icon: "database" },
        { title: "Immersive View", description: "Pixel-perfect dashboards with glassmorphism and industrial-grade aesthetics.", icon: "layout" },
        { title: "Edge Nexus", description: "Distributed command execution with sub-millisecond latency and global reach.", icon: "zap" },
    ]
}) => {
    return (
        <section className="py-24 bg-[var(--m-bg-secondary)] relative overflow-hidden">
            {/* Background Texture */}
            <div className="absolute inset-0 industrial-grid opacity-[0.05]"></div>

            <div className="container mx-auto px-6 relative z-10">
                <div className="text-center mb-20 flex flex-col items-center gap-4">
                    <span className="text-[var(--m-accent-violet)] text-[var(--m-text-sm)] font-semibold tracking-widest uppercase">
                        Core Capabilities
                    </span>
                    <h2 className="text-[var(--m-text-4xl)] font-bold text-[var(--m-fg-primary)] tracking-tight">
                        {title}
                    </h2>
                    <p className="text-[var(--m-text-lg)] text-[var(--m-fg-secondary)] max-w-2xl">
                        {subtitle}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className="p-8 m-glass rounded-[var(--m-radius-lg)] border border-[var(--m-surface-border)] hover:border-[var(--m-accent-violet)]/30 transition-all duration-700 hover:shadow-glow-violet group cursor-default"
                        >
                            <div className="w-12 h-12 rounded-[var(--m-radius-md)] bg-[var(--m-surface-higher)] flex items-center justify-center mb-6 text-[var(--m-accent-violet)] group-hover:scale-110 transition-transform duration-500 shadow-sm">
                                {/* SVG Placeholder - Replace with lucide-react if available */}
                                <div className="w-6 h-6 border-2 border-current rounded-sm"></div>
                            </div>
                            <h3 className="text-[var(--m-text-xl)] font-semibold text-[var(--m-fg-primary)] mb-4 group-hover:text-[var(--m-accent-violet)] transition-colors duration-300">
                                {feature.title}
                            </h3>
                            <p className="text-[var(--m-text-base)] text-[var(--m-fg-secondary)] leading-relaxed">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
