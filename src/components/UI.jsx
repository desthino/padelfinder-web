import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { G, LEVEL_LABEL, LEVEL_COLOR } from '../lib/theme';

// ─── HOOK MOBILE ──────────────────────────────────────────────
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useState(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  });
  return isMobile;
}

// ─── NAVBAR ───────────────────────────────────────────────────
export function Navbar() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const loc = useLocation();
  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    { path: '/dashboard', label: 'Accueil', icon: '🏠' },
    { path: '/search',    label: 'Joueurs', icon: '👥' },
    { path: '/games',     label: 'Parties', icon: '📅' },
    { path: '/clubs',     label: 'Clubs',   icon: '🏟️' },
    { path: '/messages',  label: 'Messages',icon: '💬' },
    { path: '/friends',   label: 'Amis',    icon: '❤️' },
  ];

  async function signOut() {
    await supabase.auth.signOut();
    navigate('/auth');
    setMenuOpen(false);
  }

  function goTo(path) {
    navigate(path);
    setMenuOpen(false);
  }

  return (
    <>
      <nav style={{ background: '#fff', borderBottom: `0.5px solid ${G.border}`, padding: '0 1rem', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 200, fontFamily: G.font }}>
        
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => goTo('/dashboard')}>
          <span style={{ fontSize: 20 }}>🎾</span>
          <span style={{ fontFamily: G.fontTitle, fontWeight: 800, fontSize: 17, color: G.text }}>PadelFinder</span>
        </div>

        {/* Desktop links */}
        {!isMobile && (
          <div style={{ display: 'flex', gap: 4 }}>
            {links.map(l => (
              <button key={l.path} onClick={() => navigate(l.path)} style={{
                padding: '5px 11px', fontSize: 13, fontWeight: 500, border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: G.font,
                background: loc.pathname === l.path ? G.greenLight : 'none',
                color: loc.pathname === l.path ? G.green : G.textSub,
              }}>{l.label}</button>
            ))}
          </div>
        )}

        {/* Desktop right */}
        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Btn onClick={() => navigate('/games/create')} small>+ Créer</Btn>
            <div onClick={() => navigate(`/profile/${user?.id}`)} style={{ width: 32, height: 32, borderRadius: '50%', background: G.greenLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, cursor: 'pointer', border: `2px solid ${G.greenMid}` }}>
              {profile?.avatar || '🧑'}
            </div>
            <button onClick={signOut} style={{ fontSize: 12, color: G.textMuted, background: 'none', border: `0.5px solid ${G.border}`, borderRadius: 8, padding: '5px 10px', cursor: 'pointer', fontFamily: G.font }}>
              Déconnexion
            </button>
          </div>
        )}

        {/* Mobile right */}
        {isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div onClick={() => navigate(`/profile/${user?.id}`)} style={{ width: 32, height: 32, borderRadius: '50%', background: G.greenLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, cursor: 'pointer', border: `2px solid ${G.greenMid}` }}>
              {profile?.avatar || '🧑'}
            </div>
            <button onClick={() => setMenuOpen(!menuOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: G.text, padding: 4 }}>
              {menuOpen ? '✕' : '☰'}
            </button>
          </div>
        )}
      </nav>

      {/* Mobile menu */}
      {isMobile && menuOpen && (
        <div style={{ position: 'fixed', top: 56, left: 0, right: 0, bottom: 0, background: '#fff', zIndex: 199, overflowY: 'auto', fontFamily: G.font }}>
          <div style={{ padding: '1rem' }}>
            {links.map(l => (
              <button key={l.path} onClick={() => goTo(l.path)} style={{
                display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '14px 12px', fontSize: 16, fontWeight: 500, border: 'none', borderRadius: 10, cursor: 'pointer', fontFamily: G.font, marginBottom: 4, textAlign: 'left',
                background: loc.pathname === l.path ? G.greenLight : '#f8f9fa',
                color: loc.pathname === l.path ? G.green : G.text,
              }}>
                <span style={{ fontSize: 20 }}>{l.icon}</span>
                {l.label}
              </button>
            ))}
            <button onClick={() => goTo('/games/create')} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '14px 12px', fontSize: 16, fontWeight: 500, border: 'none', borderRadius: 10, cursor: 'pointer', fontFamily: G.font, marginBottom: 4, background: G.green, color: '#fff' }}>
              <span style={{ fontSize: 20 }}>➕</span> Créer une partie
            </button>
            <button onClick={signOut} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '14px 12px', fontSize: 16, fontWeight: 500, border: 'none', borderRadius: 10, cursor: 'pointer', fontFamily: G.font, background: G.redLight, color: G.red, marginTop: 8 }}>
              <span style={{ fontSize: 20 }}>🚪</span> Déconnexion
            </button>
          </div>
        </div>
      )}

      {/* Mobile bottom nav */}
      {isMobile && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: `0.5px solid ${G.border}`, display: 'flex', zIndex: 198, height: 60 }}>
          {links.slice(0, 5).map(l => (
            <button key={l.path} onClick={() => navigate(l.path)} style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, border: 'none', background: 'none', cursor: 'pointer', fontSize: 10, fontWeight: 500, fontFamily: G.font,
              color: loc.pathname === l.path ? G.green : G.textMuted,
            }}>
              <span style={{ fontSize: 20 }}>{l.icon}</span>
              {l.label}
            </button>
          ))}
        </div>
      )}
    </>
  );
}

// ─── BUTTON ───────────────────────────────────────────────────
export function Btn({ children, onClick, variant = 'primary', small, full, disabled, type = 'button' }) {
  const base = {
    padding: small ? '6px 14px' : '10px 20px',
    fontSize: small ? 13 : 14,
    fontWeight: 500,
    border: 'none',
    borderRadius: G.radiusSm,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: G.font,
    width: full ? '100%' : undefined,
    opacity: disabled ? 0.6 : 1,
    transition: 'all 0.15s',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  };
  const variants = {
    primary: { background: G.green, color: '#fff' },
    secondary: { background: G.greenLight, color: G.green },
    ghost: { background: 'none', color: G.textSub, border: `0.5px solid ${G.border}` },
    danger: { background: G.redLight, color: G.red },
  };
  return <button type={type} onClick={onClick} disabled={disabled} style={{ ...base, ...variants[variant] }}>{children}</button>;
}

// ─── CARD ─────────────────────────────────────────────────────
export function Card({ children, style = {}, onClick }) {
  return (
    <div onClick={onClick} style={{ background: '#fff', border: `0.5px solid ${G.border}`, borderRadius: G.radius, padding: '1rem', cursor: onClick ? 'pointer' : undefined, ...style }}>
      {children}
    </div>
  );
}

// ─── SECTION ──────────────────────────────────────────────────
export function Section({ title, icon, action, onAction, children, style = {} }) {
  return (
    <Card style={{ marginBottom: '1rem', ...style }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <span style={{ fontWeight: 600, fontSize: 15, color: G.text }}>{icon} {title}</span>
        {action && <button onClick={onAction} style={{ fontSize: 12, color: G.green, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, fontFamily: G.font }}>{action} →</button>}
      </div>
      {children}
    </Card>
  );
}

// ─── BADGE ────────────────────────────────────────────────────
export function Badge({ text, bg = G.greenLight, color = G.green }) {
  return <span style={{ fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 20, background: bg, color, whiteSpace: 'nowrap' }}>{text}</span>;
}

// ─── LEVEL BADGE ──────────────────────────────────────────────
export function LevelBadge({ level }) {
  const c = LEVEL_COLOR[level] || {};
  return <Badge text={LEVEL_LABEL[level] || level} bg={c.bg} color={c.color} />;
}

// ─── EMPTY STATE ──────────────────────────────────────────────
export function Empty({ icon = '🔍', text, cta, onClick }) {
  return (
    <div style={{ textAlign: 'center', padding: '1.5rem 1rem', color: G.textMuted, fontSize: 13 }}>
      <div style={{ fontSize: 28, marginBottom: 6 }}>{icon}</div>
      <div>{text}</div>
      {cta && <button onClick={onClick} style={{ marginTop: 8, fontSize: 12, color: G.green, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, fontFamily: G.font }}>{cta} →</button>}
    </div>
  );
}

// ─── INPUT ────────────────────────────────────────────────────
export function Input({ label, value, onChange, type = 'text', placeholder, hint }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {label && <label style={{ fontSize: 11, fontWeight: 500, color: G.textMuted, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{label}</label>}
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ width: '100%', boxSizing: 'border-box', padding: '9px 13px', fontSize: 14, border: `0.5px solid #ddd`, borderRadius: G.radiusSm, fontFamily: G.font, color: G.text, outline: 'none' }}
      />
      {hint && <span style={{ fontSize: 11, color: G.textMuted }}>{hint}</span>}
    </div>
  );
}

// ─── SELECT ───────────────────────────────────────────────────
export function Select({ label, value, onChange, options }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {label && <label style={{ fontSize: 11, fontWeight: 500, color: G.textMuted, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{label}</label>}
      <select value={value} onChange={e => onChange(e.target.value)} style={{ padding: '9px 13px', fontSize: 14, border: `0.5px solid #ddd`, borderRadius: G.radiusSm, fontFamily: G.font, color: G.text, outline: 'none', background: '#fff' }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

// ─── PLAYER CARD ──────────────────────────────────────────────
export function PlayerCard({ player, onClick, actions }) {
  return (
    <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: `0.5px solid #f0f0f0`, cursor: onClick ? 'pointer' : undefined }}>
      <span style={{ fontSize: 28 }}>{player.avatar || '🧑'}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: G.text }}>{player.first_name} {player.last_name}</div>
        <div style={{ display: 'flex', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
          {player.level && <LevelBadge level={player.level} />}
          {player.city && <Badge text={`📍 ${player.city}`} bg="#F3F4F6" color="#374151" />}
        </div>
      </div>
      {player.rating > 0 && <span style={{ fontSize: 12, color: G.yellow, fontWeight: 600, flexShrink: 0 }}>⭐ {Number(player.rating).toFixed(1)}</span>}
      {actions}
    </div>
  );
}

// ─── SPINNER ──────────────────────────────────────────────────
export function Spinner({ size = 20, color = G.green }) {
  return (
    <>
      <style>{`@keyframes pf-spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ width: size, height: size, border: `2px solid ${color}30`, borderTopColor: color, borderRadius: '50%', animation: 'pf-spin 0.7s linear infinite', flexShrink: 0 }} />
    </>
  );
}

// ─── PAGE WRAPPER ─────────────────────────────────────────────
export function Page({ children, maxWidth = 1100 }) {
  const isMobile = useIsMobile();
  return (
    <div style={{ minHeight: '100vh', background: G.bg, fontFamily: G.font, paddingBottom: isMobile ? 70 : 0 }}>
      <Navbar />
      <div style={{ maxWidth, margin: '0 auto', padding: isMobile ? '1rem 0.75rem' : '1.5rem 1rem' }}>
        {children}
      </div>
    </div>
  );
}

// ─── PAGE HEADER ──────────────────────────────────────────────
export function PageHeader({ title, subtitle, action }) {
  const isMobile = useIsMobile();
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap', gap: 8 }}>
      <div>
        <h1 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 700, color: G.text, margin: 0 }}>{title}</h1>
        {subtitle && <p style={{ fontSize: 13, color: G.textMuted, margin: '4px 0 0' }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// ─── RESPONSIVE GRID ──────────────────────────────────────────
export function Grid({ children, cols = 2, mobileCols = 1, gap = '0.75rem' }) {
  const isMobile = useIsMobile();
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${isMobile ? mobileCols : cols}, 1fr)`, gap }}>
      {children}
    </div>
  );
}
