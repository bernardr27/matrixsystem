/**
 * MATRIX SYSTEM MANIFEST
 * Source of truth for versioning and building signatures.
 */

export const MATRIX_MANIFEST = {
    version: '5.0.0',
    build: '2026.01.28.AUTONOMOUS',
    signature: 'Aetheric_Pulse_Shift'
};

export const SERVICE_PORTS = {
    REFLECT: 3000,
    NEXUS: 3001,
    GHOST: 5173,
    SENTINEL: 3001 // Sentinel usually lives behind Matrix Hub port for API
};

export const GATE_URLS = {
    NEXUS: process.env.NEXT_PUBLIC_GATE_URL_NEXUS || "",
    REFLECT: process.env.NEXT_PUBLIC_GATE_URL_REFLECT || "",
    GHOST: process.env.NEXT_PUBLIC_GATE_URL_GHOST || ""
};
