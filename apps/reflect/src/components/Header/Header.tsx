'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAccount } from '@/context/AccountContext';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useEffect, useState, useRef, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { usePWA } from '@/lib/hooks/usePWA';
import { useNotifications } from '@/context/NotificationContext';
import { useUI } from '@/context/UIContext';
import { DevOverlay } from './DevOverlay';
import { ProfileIcon } from '../ui/ProfileIcons';
import { Cpu } from 'lucide-react';
import styles from './Header.module.css';

export default function Header() {
  const supabase = useMemo(() => createClient(), []);
  const pathname = usePathname();
  const hubUrl = process.env.NEXT_PUBLIC_MATRIX_HUB_URL || `http://${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}:3001`;

  // All hooks must be called before any conditional return
  const router = useRouter();
  const [userName, setUserName] = useState<string | null>(null);
  const [tier, setTier] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [vaultStatus, setVaultStatus] = useState<string | null>(null);
  const [activeMenu, setActiveMenu] = useState<'profile' | 'notifications' | 'trash' | null>(null);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [linkStatus, setLinkStatus] = useState<'offline' | 'online' | 'connecting'>('connecting');
  const lastHeartbeat = useRef<number>(Date.now());
  const containerRef = useRef<HTMLDivElement>(null);
  const { isInstallable, isInstalled, install } = usePWA();
  const { unreadCount, trashCount, notifications, clearAll, markAsRead, deleteNotification, emptyTrash, addToast } = useNotifications();
  const { isBooting } = useUI();

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      localStorage.clear(); // Security: Wipe all local data
      sessionStorage.clear();
      addToast('Sign out successful', 'success');
      setActiveMenu(null);
      window.location.href = '/';
    } else {
      addToast('Sign out failed', 'alert');
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    };

    if (activeMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeMenu]);

  // --- GHOST RUNNER LISTENER (DESKTOP RECEIVER) ---
  useEffect(() => {
    let channel: any;
    try {
      channel = supabase.channel('ghost_desk_link')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ghost_bridge' }, (payload: any) => {
          if (!payload || !payload.new) return;

          const cmd = payload.new.command;

          // Heartbeat Detection
          if (cmd === 'sys:heartbeat') {
            lastHeartbeat.current = Date.now();
            try {
              // Parse the output JSON if present (it's in payload.new.output)
              // Note: payload.new.output is stringified JSON
              if (payload.new.output) {
                const healthData = JSON.parse(payload.new.output);
                const services = healthData.services || {};
                const isGhostOnline = services.ghost === 'online';
                const isRunnerOnline = services.runner === 'online';

                if (isGhostOnline && isRunnerOnline) {
                  setLinkStatus('online');
                } else {
                  // System is pulsing but critical services are down
                  setLinkStatus('connecting');
                }
              } else {
                setLinkStatus('online'); // Fallback if no output
              }
            } catch (e) {
              setLinkStatus('online'); // Fallback on parse error
            }
            return;
          }

          if (typeof cmd === 'string' && cmd.startsWith('desk:')) {
            const action = cmd.replace('desk:', '').trim();
            // 1. Navigation
            if (action.startsWith('nav ')) {
              const path = action.replace('nav ', '').trim();
              // Use window.location as valid fallback if router fails
              if (window.location.pathname !== path) {
                router.push(path);
                addToast(`Ghost Pilot: Navigating to ${path}`, 'success');
              }
            }
            // 2. Alerts/Toasts
            if (action.startsWith('alert ')) {
              const msg = action.replace('alert ', '').trim();
              addToast(msg, 'info');
            }
            // 3. Refresh
            if (action === 'refresh' || action === 'reload') {
              window.location.reload();
            }
          }
        })
        .subscribe();
    } catch (err) {
      console.error("Ghost Link Error:", err);
    }

    // Watchdog for heartbeats
    const monitor = setInterval(() => {
      const diff = Date.now() - lastHeartbeat.current;
      if (diff > 45000) { // 45s threshold
        setLinkStatus('offline');
      }
    }, 10000);

    return () => {
      if (channel) supabase.removeChannel(channel);
      clearInterval(monitor);
    };
  }, [supabase, addToast, router]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('username, tier, vault_status, avatar_url')
          .eq('id', user.id)
          .maybeSingle();
        if (profile) {
          setUserName(profile.username);
          setTier(profile.tier);
          setVaultStatus(profile.vault_status);
          setAvatarUrl(profile.avatar_url);
        }
      }
    })();
  }, [supabase]);

  // Routes where header should be hidden — checked AFTER all hooks to comply with React rules
  const HIDDEN_ROUTES = ['/', '/auth', '/login', '/setup', '/setup/initial', '/neural-initialize', '/tutorial', '/demo'];
  if (isBooting || HIDDEN_ROUTES.includes(pathname) || pathname === '/dashboard-loading') return null;

  return (
    <div className={styles.headerContainer} ref={containerRef}>
      <header className={styles.glassPill}>
        <div className={styles.leftSection}>
          <Link href={userName ? "/session" : "/"} className={styles.logoLink}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '10px',
              flexShrink: 0,
              background: 'transparent'
            }}>
              <Image
                src="/reflect_logo_unified.png"
                alt="Reflect"
                width={32}
                height={32}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>
            <div className={styles.brandGroup}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minHeight: '44px' }}>
                <span className={styles.brandName}>Reflect</span>
                {/* Neural Link Status Dot */}
                <motion.div
                  animate={linkStatus === 'online' ? { scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] } : {}}
                  transition={{ repeat: Infinity, duration: 2.5 }}
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: linkStatus === 'online' ? '#3b82f6' : (linkStatus === 'connecting' ? '#f59e0b' : '#ff4b4b'),
                    boxShadow: linkStatus === 'online' ? '0 0 8px #3b82f6' : 'none',
                    transition: 'all 1000ms cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                  title={linkStatus === 'online' ? 'Neural Link: Synchronized' : 'Neural Link: Severed'}
                />
              </div>
              <div className={`${styles.tierPill} ${styles[`tier${tier || 'Essence'}`]}`}>
                <span className={styles.tierDot} />
                {tier?.toUpperCase() || 'SEEKER'}
              </div>
            </div>
            {vaultStatus === 'unlocked' && <span className={styles.vaultIconBadge} title="Secure Vault Active">🛡️</span>}
          </Link>

          <DevOverlay />
        </div>

        <div className={styles.rightSection}>
          {isInstallable && !isInstalled && (
            <button onClick={install} className={styles.getAppButton}>
              Get App
            </button>
          )}

          {userName ? (
            <div className={styles.navActions}>
              {/* Trash Icon */}
              <div className={styles.actionContainer}>
                <button
                  onClick={() => setActiveMenu(activeMenu === 'trash' ? null : 'trash')}
                  className={`${styles.iconButton} ${activeMenu === 'trash' ? styles.iconActive : ''}`}
                >
                  <span className={styles.iconVisual}>🗑️</span>
                  {trashCount > 0 && <span className={styles.badge}>{trashCount}</span>}
                </button>

                {activeMenu === 'trash' && (
                  <div className={styles.actionDropdown}>
                    <div className={styles.dropdownHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className={styles.dropdownTitle}>TRASH_MATRIX</span>
                      <button onClick={() => setActiveMenu(null)} className={styles.closeDropdown}>✕</button>
                    </div>
                    <div className={styles.dropdownContent}>
                      <Link href="/trash" className={styles.dropdownItem} onClick={() => setActiveMenu(null)}>
                        <span className={styles.itemIcon}>📂</span> VIEW ALL TRASH
                      </Link>
                      <button className={styles.dropdownItem} onClick={() => { emptyTrash(); setActiveMenu(null); }}>
                        <span className={styles.itemIcon}>🧹</span> EMPTY TRASH
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Notification Bell */}
              <div className={styles.actionContainer}>
                <button
                  onClick={() => setActiveMenu(activeMenu === 'notifications' ? null : 'notifications')}
                  className={`${styles.iconButton} ${activeMenu === 'notifications' ? styles.iconActive : ''}`}
                >
                  <span className={styles.iconVisual}>🔔</span>
                  {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
                </button>

                {activeMenu === 'notifications' && (
                  <div className={styles.actionDropdown}>
                    <div className={styles.dropdownHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className={styles.dropdownTitle}>NEURAL_ALERTS</span>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        {notifications.length > 0 && <button onClick={clearAll} className={styles.clearBtnAlt}>CLEAR ALL</button>}
                        <button onClick={() => setActiveMenu(null)} className={styles.closeDropdown}>✕</button>
                      </div>
                    </div>
                    <div className={styles.notifList}>
                      {notifications.length === 0 ? (
                        <div className={styles.emptyNotifs}>No active signals.</div>
                      ) : (
                        notifications.map(n => (
                          <div key={n.id} className={`${styles.notifItem} ${!n.read ? styles.unread : ''}`} onMouseEnter={() => markAsRead(n.id)}>
                            <div className={styles.notifInfo}>
                              <span className={styles.notifTitle}>{n.title}</span>
                              <span className={styles.notifMsg}>{n.message}</span>
                            </div>
                            <button onClick={() => deleteNotification(n.id)} className={styles.deleteNotif}>✕</button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className={styles.actionContainer}>
                <button
                  onClick={() => window.open(hubUrl, '_blank')}
                  className={styles.iconButton}
                  title="ACCESS_MATRIX_HUB"
                >
                  <Cpu size={18} className="text-cyan-400 opacity-60 hover:opacity-100 transition-opacity" />
                </button>
              </div>

              {/* Profile Avatar */}
              <div className={styles.userSection}>
                <button
                  onClick={() => setActiveMenu(activeMenu === 'profile' ? null : 'profile')}
                  className={`${styles.avatarButton} ${activeMenu === 'profile' ? styles.avatarActive : ''}`}
                  style={{ minWidth: '44px', minHeight: '44px', display: 'flex', alignItems: 'center', justifyItems: 'center' }}
                >
                  <div className={styles.userAvatar} style={{ background: 'transparent', border: 'none', margin: '0 auto' }}>
                    <ProfileIcon
                      type={avatarUrl || 'seeker'}
                      active={activeMenu === 'profile'}
                      size={36}
                      color={tier === 'Transcendence' ? '#8b5cf6' : (tier === 'Synthesis' ? '#f59e0b' : '#3b82f6')}
                    />
                  </div>
                </button>

                {activeMenu === 'profile' && (
                  <div className={styles.navDropdown}>
                    <div className={styles.dropdownHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span className={styles.dropdownUser}>{userName ? userName.toUpperCase() : 'USER'}</span>
                        <span className={styles.dropdownTier}>{tier || 'SEEKER'}</span>
                      </div>
                      <button onClick={() => setActiveMenu(null)} className={styles.closeDropdown}>✕</button>
                    </div>

                    <div className={styles.dropdownLinks}>
                      <Link href="/session" className={styles.dropdownItem} onClick={() => setActiveMenu(null)}>
                        <span className={styles.itemIcon}>⌬</span> DASHBOARD
                      </Link>
                      <Link href="/journal" className={styles.dropdownItem} onClick={() => setActiveMenu(null)}>
                        <span className={styles.itemIcon}>📖</span> JOURNAL
                      </Link>
                      <Link href="/archive" className={styles.dropdownItem} onClick={() => setActiveMenu(null)}>
                        <span className={styles.itemIcon}>📂</span> ARCHIVE
                      </Link>
                      <Link href="/patterns" className={styles.dropdownItem} onClick={() => setActiveMenu(null)}>
                        <span className={styles.itemIcon}>🕸️</span> PATTERNS
                      </Link>
                      <Link href="/graph" className={styles.dropdownItem} onClick={() => setActiveMenu(null)}>
                        <span className={styles.itemIcon}>📊</span> SYNAPTIC GRAPH
                      </Link>
                      <Link href="/insights" className={styles.dropdownItem} onClick={() => setActiveMenu(null)}>
                        <span className={styles.itemIcon}>✨</span> INSIGHTS
                      </Link>
                      <Link href="/growth" className={styles.dropdownItem} onClick={() => setActiveMenu(null)}>
                        <span className={styles.itemIcon}>📈</span> GROWTH
                      </Link>
                      <Link href="/voice" className={styles.dropdownItem} onClick={() => setActiveMenu(null)}>
                        <span className={styles.itemIcon}>🎙️</span> VOICE JOURNAL
                      </Link>
                      <Link href="/sage" className={styles.dropdownItem} onClick={() => setActiveMenu(null)}>
                        <span className={styles.itemIcon}>🧭</span> SAGE CHAT
                      </Link>
                      <Link href="/capsule" className={styles.dropdownItem} onClick={() => setActiveMenu(null)}>
                        <span className={styles.itemIcon}>⏳</span> TIME CAPSULE
                      </Link>
                      <Link href="/search" className={styles.dropdownItem} onClick={() => setActiveMenu(null)}>
                        <span className={styles.itemIcon}>🔎</span> SEARCH
                      </Link>
                      <div className={styles.dropdownDivider} />
                      <Link href="/settings" className={styles.dropdownItem} onClick={() => setActiveMenu(null)}>
                        <span className={styles.itemIcon}>⚙️</span> SETTINGS
                      </Link>

                      <div className={styles.dropdownDivider} />

                      <Link href="/debug" className={styles.dropdownItem} onClick={() => setActiveMenu(null)}>
                        <span className={styles.itemIcon}>🧪</span> COMPONENT LAB
                      </Link>

                      {/* Sign Out Section */}
                      <div className={styles.dropdownDivider} />
                      {showSignOutConfirm ? (
                        <div style={{ padding: '0.4rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <span style={{ fontSize: '0.6rem', fontWeight: 900, color: 'rgba(255,100,100,0.6)', letterSpacing: '0.1em', textAlign: 'center' }}>
                            TERMINATE_SESSION?
                          </span>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button
                              onClick={handleSignOut}
                              style={{
                                flex: 1,
                                background: 'rgba(255,100,100,0.1)',
                                border: '1px solid rgba(255,100,100,0.2)',
                                color: '#ff6b6b',
                                fontSize: '0.6rem',
                                fontWeight: 800,
                                padding: '8px',
                                borderRadius: '8px',
                                cursor: 'pointer'
                              }}
                            >
                              CONFIRM
                            </button>
                            <button
                              onClick={() => setShowSignOutConfirm(false)}
                              style={{
                                flex: 1,
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: 'rgba(255,255,255,0.4)',
                                fontSize: '0.6rem',
                                fontWeight: 800,
                                padding: '8px',
                                borderRadius: '8px',
                                cursor: 'pointer'
                              }}
                            >
                              CANCEL
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          className={styles.dropdownItem}
                          onClick={() => setShowSignOutConfirm(true)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left' }}
                        >
                          <span className={styles.itemIcon}>🏁</span> SIGN OUT
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <Link href="/auth" className={styles.signInButton}>
              Sign In
            </Link>
          )}
        </div>
      </header>
    </div>
  );
}
