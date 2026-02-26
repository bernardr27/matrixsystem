'use client';

import Link from 'next/link';
import { useState } from 'react';

interface InteractiveLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function InteractiveLink({ href, children, className, style }: InteractiveLinkProps) {
  const [isHovered, setIsHovered] = useState(false);

  const getHoverStyle = () => {
    if (!style) return {};

    const hoverStyle: React.CSSProperties = { ...style, transition: 'all 0.3s ease' };

    if (isHovered) {
      if (style.color === '#888') hoverStyle.color = '#fff';
      if (style.background === '#111') hoverStyle.background = '#222';
      if (style.color === '#444') hoverStyle.color = '#888';
      if (style.background === '#ef44440a') hoverStyle.background = '#ef444411';
    }

    return hoverStyle;
  };

  return (
    <Link
      href={href}
      className={className}
      style={getHoverStyle()}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
    </Link>
  );
}

export function SignOutButton() {
  const [isHovered, setIsHovered] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignOut = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // 1. Aggressive Client Cleanup
    try {
      // Wipe all specific reflect keys
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('reflect.') || key.startsWith('sb-')) {
          localStorage.removeItem(key);
        }
      });
      sessionStorage.clear();

      // Clear cookies aggressively (client side attempt)
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
    } catch (err) {
      console.error("Cleanup warning:", err);
    }

    // 2. Server SignOut via Form Action (fetch)
    try {
      await fetch('/auth/signout', { method: 'POST' });
    } catch { }

    // 3. Nuclear Redirect
    window.location.href = '/login';
  };

  return (
    <button
      onClick={handleSignOut}
      disabled={loading}
      style={{
        width: '100%',
        padding: '1.2rem',
        background: isHovered ? '#ef444411' : '#ef44440a',
        color: '#ef4444',
        border: '1px solid #ef444422',
        borderRadius: '12px',
        cursor: 'pointer',
        fontWeight: 800,
        fontSize: '0.9rem',
        transition: 'all 0.3s',
        opacity: loading ? 0.5 : 1
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {loading ? 'CLEANING SESSION...' : 'Sign Out'}
    </button>
  );
}