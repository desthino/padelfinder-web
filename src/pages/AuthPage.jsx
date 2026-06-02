import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';

// ──────────────────────────────────────────────────────────────
// Constantes
// ──────────────────────────────────────────────────────────────
const LEVELS = [
  { id: 'debutant',      label: '🌱 Débutant' },
  { id: 'intermediaire', label: '⚡ Inter.'   },
  { id: 'avance',        label: '🔥 Avancé'   },
  { id: 'expert',        label: '🏆 Expert'   },
];

const AVATARS = ['🧑', '👩', '🧔', '👱', '🏃', '🎾'];

// ──────────────────────────────────────────────────────────────
// Composant principal
// ──────────────────────────────────────────────────────────────
export default function AuthPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('login'); // 'login' | 'signup' | 'reset'
  const [status, setStatus] = useState({ type: '', msg: '' }); // {type:'error'|'success', msg}
  const [loading, setLoading] = useState(false);

  // ── Champs Login ──
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPwd, setLoginPwd]     = useState('');

  // ── Champs Signup ──
  const [suFirst,   setSuFirst]   = useState('');
  const [suLast,    setSuLast]    = useState('');
  const [suEmail,   setSuEmail]   = useState('');
  const [suPwd,     setSuPwd]     = useState('');
  const [suCity,    setSuCity]    = useState('');
  const [suLevel,   setSuLevel]   = useState('');
  const [suAvatar,  setSuAvatar]  = useState('🧑');

  // ── Reset ──
  const [resetEmail, setResetEmail] = useState('');

  function showErr(msg)  { setStatus({ type: 'error',   msg }); }
  function showOk(msg)   { setStatus({ type: 'success', msg }); }
  function clearStatus() { setStatus({ type: '', msg: '' }); }

  // ──────────────────────────────────────────────────────────────
  // CONNEXION
  // ──────────────────────────────────────────────────────────────
  async function handleLogin(e) {
    e.preventDefault();
    clearStatus();
    if (!loginEmail || !loginPwd) { showErr('Remplissez tous les champs.'); return; }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPwd,
    });
    setLoading(false);
    if (error) { showErr(error.message); return; }
    navigate('/dashboard');
  }

  // ──────────────────────────────────────────────────────────────
  // INSCRIPTION
  // ──────────────────────────────────────────────────────────────
  async function handleSignup(e) {
    e.preventDefault();
    clearStatus();
    if (!suFirst || !suLast || !suEmail || !suPwd) {
      showErr('Remplissez tous les champs obligatoires.'); return;
    }
    if (suPwd.length < 8) { showErr('Mot de passe trop court (min. 8 caractères).'); return; }
    if (!suLevel)         { showErr('Choisissez votre niveau de jeu.'); return; }

    setLoading(true);

    // 1. Création du compte Auth
    const { data: authData, error: authErr } = await supabase.auth.signUp({
      email: suEmail,
      password: suPwd,
      options: {
        data: {
          first_name: suFirst,
          last_name: suLast,
        },
      },
    });

    if (authErr) { setLoading(false); showErr(authErr.message); return; }

    // 2. Création du profil joueur dans la table `players`
    //    (peut aussi être fait via un trigger Supabase côté SQL)
    const userId = authData.user?.id;
    if (userId) {
      const { error: profileErr } = await supabase.from('players').upsert({
        id: userId,
        first_name: suFirst,
        last_name: suLast,
        email: suEmail,
        city: suCity,
        level: suLevel,
        avatar: suAvatar,
        created_at: new Date().toISOString(),
      });
      if (profileErr) console.error('Profil non créé :', profileErr.message);
    }

    setLoading(false);
    showOk('Compte créé ! Vérifiez votre email pour confirmer votre inscription.');
    // Si confirmation email désactivée dans Supabase → navigate('/dashboard')
  }

  // ──────────────────────────────────────────────────────────────
  // MOT DE PASSE OUBLIÉ
  // ──────────────────────────────────────────────────────────────
  async function handleReset(e) {
    e.preventDefault();
    clearStatus();
    if (!resetEmail) { showErr('Entrez votre email.'); return; }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) { showErr(error.message); return; }
    showOk('Email de réinitialisation envoyé !');
  }

  // ──────────────────────────────────────────────────────────────
  // GOOGLE OAuth
  // ──────────────────────────────────────────────────────────────
  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
  }

  // ──────────────────────────────────────────────────────────────
  // RENDU
  // ──────────────────────────────────────────────────────────────
  return (
    <div style={styles.page}>
      <div style={styles.card}>

        {/* Logo */}
        <div style={styles.logoRow}>
          <span style={{ fontSize: 28 }}>🎾</span>
          <span style={styles.logoText}>PadelFinder</span>
        </div>
        <p style={styles.tagline}>Trouvez vos partenaires de padel</p>

        {/* Onglets */}
        {tab !== 'reset' && (
          <div style={styles.tabs}>
            <button style={{ ...styles.tab, ...(tab === 'login'  ? styles.tabActive : {}) }} onClick={() => { setTab('login');  clearStatus(); }}>Connexion</button>
            <button style={{ ...styles.tab, ...(tab === 'signup' ? styles.tabActive : {}) }} onClick={() => { setTab('signup'); clearStatus(); }}>Inscription</button>
          </div>
        )}

        {/* Messages */}
        {status.msg && (
          <div style={status.type === 'error' ? styles.msgError : styles.msgSuccess}>
            {status.msg}
          </div>
        )}

        {/* ──── CONNEXION ──── */}
        {tab === 'login' && (
          <form onSubmit={handleLogin} style={styles.form}>
            <Field label="Email">
              <input style={styles.input} type="email" placeholder="vous@email.com" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} autoComplete="email" />
            </Field>
            <Field label="Mot de passe">
              <input style={styles.input} type="password" placeholder="••••••••" value={loginPwd} onChange={e => setLoginPwd(e.target.value)} autoComplete="current-password" />
              <span style={styles.link} onClick={() => { setTab('reset'); clearStatus(); }}>Mot de passe oublié ?</span>
            </Field>
            <Btn loading={loading}>Se connecter</Btn>
            <Divider />
            <GoogleBtn onClick={handleGoogle} />
          </form>
        )}

        {/* ──── INSCRIPTION ──── */}
        {tab === 'signup' && (
          <form onSubmit={handleSignup} style={styles.form}>
            <div style={styles.row}>
              <Field label="Prénom">
                <input style={styles.input} type="text" placeholder="Marie" value={suFirst} onChange={e => setSuFirst(e.target.value)} />
              </Field>
              <Field label="Nom">
                <input style={styles.input} type="text" placeholder="Dupont" value={suLast} onChange={e => setSuLast(e.target.value)} />
              </Field>
            </div>
            <Field label="Email">
              <input style={styles.input} type="email" placeholder="vous@email.com" value={suEmail} onChange={e => setSuEmail(e.target.value)} autoComplete="email" />
            </Field>
            <Field label="Mot de passe">
              <input style={styles.input} type="password" placeholder="Min. 8 caractères" value={suPwd} onChange={e => setSuPwd(e.target.value)} autoComplete="new-password" />
            </Field>
            <Field label="Ville">
              <input style={styles.input} type="text" placeholder="Paris, Lyon, Marseille..." value={suCity} onChange={e => setSuCity(e.target.value)} />
            </Field>
            <Field label="Niveau de jeu">
              <div style={styles.levelGrid}>
                {LEVELS.map(l => (
                  <button key={l.id} type="button" style={{ ...styles.levelBtn, ...(suLevel === l.id ? styles.levelBtnSel : {}) }} onClick={() => setSuLevel(l.id)}>
                    {l.label}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Avatar">
              <div style={styles.avatarRow}>
                {AVATARS.map(a => (
                  <button key={a} type="button" style={{ ...styles.avatarBtn, ...(suAvatar === a ? styles.avatarBtnSel : {}) }} onClick={() => setSuAvatar(a)}>
                    {a}
                  </button>
                ))}
              </div>
            </Field>
            <Btn loading={loading}>Créer mon compte</Btn>
          </form>
        )}

        {/* ──── RESET MOT DE PASSE ──── */}
        {tab === 'reset' && (
          <form onSubmit={handleReset} style={styles.form}>
            <p style={{ fontSize: 14, color: '#888', marginBottom: 8 }}>
              Entrez votre email pour recevoir un lien de réinitialisation.
            </p>
            <Field label="Email">
              <input style={styles.input} type="email" placeholder="vous@email.com" value={resetEmail} onChange={e => setResetEmail(e.target.value)} />
            </Field>
            <Btn loading={loading}>Envoyer le lien</Btn>
            <span style={{ ...styles.link, textAlign: 'center', marginTop: 4 }} onClick={() => { setTab('login'); clearStatus(); }}>
              ← Retour à la connexion
            </span>
          </form>
        )}

      </div>

      <p style={styles.legal}>
        En continuant, vous acceptez les{' '}
        <a href="/cgu" style={styles.legalLink}>CGU</a> et la{' '}
        <a href="/privacy" style={styles.legalLink}>Politique de confidentialité</a>
      </p>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Sous-composants
// ──────────────────────────────────────────────────────────────
function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={styles.label}>{label}</label>
      {children}
    </div>
  );
}

function Btn({ loading, children }) {
  return (
    <button type="submit" disabled={loading} style={{ ...styles.btnPrimary, opacity: loading ? 0.7 : 1 }}>
      {loading ? <Spinner /> : children}
    </button>
  );
}

function Spinner() {
  return (
    <span style={{ display: 'inline-block', width: 18, height: 18, border: '2px solid rgba(255,255,255,0.35)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
  );
}

function Divider() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#bbb', fontSize: 13, margin: '2px 0' }}>
      <div style={{ flex: 1, height: '0.5px', background: '#e0e0e0' }} />
      ou
      <div style={{ flex: 1, height: '0.5px', background: '#e0e0e0' }} />
    </div>
  );
}

function GoogleBtn({ onClick }) {
  return (
    <button type="button" onClick={onClick} style={styles.googleBtn}>
      <svg width="18" height="18" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      Continuer avec Google
    </button>
  );
}

// ──────────────────────────────────────────────────────────────
// Styles
// ──────────────────────────────────────────────────────────────
const GREEN = '#1D9E75';
const GREEN_DARK = '#0F6E56';

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem 1rem',
    background: '#f8f9fa',
    fontFamily: "'DM Sans', sans-serif",
  },
  card: {
    width: '100%',
    maxWidth: 440,
    background: '#fff',
    border: '0.5px solid #e8e8e8',
    borderRadius: 16,
    padding: '1.75rem',
  },
  logoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 6,
  },
  logoText: {
    fontFamily: "'Syne', sans-serif",
    fontSize: 26,
    fontWeight: 800,
    color: '#111',
  },
  tagline: {
    textAlign: 'center',
    fontSize: 14,
    color: '#888',
    marginBottom: '1.25rem',
  },
  tabs: {
    display: 'flex',
    gap: 0,
    border: '0.5px solid #e8e8e8',
    borderRadius: 12,
    padding: 3,
    background: '#f5f5f5',
    marginBottom: '1.25rem',
  },
  tab: {
    flex: 1,
    padding: '8px 12px',
    fontSize: 14,
    fontWeight: 500,
    border: 'none',
    background: 'transparent',
    color: '#888',
    borderRadius: 9,
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontFamily: "'DM Sans', sans-serif",
  },
  tabActive: {
    background: '#fff',
    color: '#111',
    border: '0.5px solid #e0e0e0',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  label: {
    fontSize: 11,
    fontWeight: 500,
    color: '#888',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  },
  input: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '10px 14px',
    fontSize: 15,
    border: '0.5px solid #ddd',
    borderRadius: 8,
    background: '#fff',
    color: '#111',
    outline: 'none',
    fontFamily: "'DM Sans', sans-serif",
    transition: 'border-color 0.15s, box-shadow 0.15s',
  },
  link: {
    fontSize: 12,
    color: GREEN,
    cursor: 'pointer',
    alignSelf: 'flex-end',
    marginTop: 2,
  },
  btnPrimary: {
    width: '100%',
    padding: '11px',
    fontSize: 15,
    fontWeight: 500,
    border: 'none',
    borderRadius: 8,
    background: GREEN,
    color: '#fff',
    cursor: 'pointer',
    transition: 'background 0.15s',
    fontFamily: "'DM Sans', sans-serif",
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  googleBtn: {
    width: '100%',
    padding: '10px',
    fontSize: 14,
    border: '0.5px solid #ddd',
    borderRadius: 8,
    background: '#fff',
    color: '#333',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    fontFamily: "'DM Sans', sans-serif",
    transition: 'background 0.15s',
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
  },
  levelGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 8,
  },
  levelBtn: {
    padding: '8px 4px',
    fontSize: 12,
    fontWeight: 500,
    border: '0.5px solid #e0e0e0',
    borderRadius: 8,
    background: '#f5f5f5',
    color: '#666',
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'all 0.15s',
    fontFamily: "'DM Sans', sans-serif",
  },
  levelBtnSel: {
    background: '#E1F5EE',
    borderColor: GREEN,
    color: GREEN_DARK,
  },
  avatarRow: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
  },
  avatarBtn: {
    width: 44,
    height: 44,
    borderRadius: '50%',
    border: '2px solid #e0e0e0',
    fontSize: 22,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    background: '#f5f5f5',
    transition: 'all 0.15s',
  },
  avatarBtnSel: {
    borderColor: GREEN,
    boxShadow: `0 0 0 3px rgba(29,158,117,0.2)`,
    background: '#E1F5EE',
  },
  msgError: {
    fontSize: 13,
    color: '#c0392b',
    background: '#fdf0ee',
    border: '0.5px solid #f5c6c0',
    padding: '8px 12px',
    borderRadius: 8,
    marginBottom: 4,
  },
  msgSuccess: {
    fontSize: 13,
    color: '#0F6E56',
    background: '#E1F5EE',
    border: '0.5px solid #5DCAA5',
    padding: '8px 12px',
    borderRadius: 8,
    marginBottom: 4,
  },
  legal: {
    marginTop: '1rem',
    fontSize: 12,
    color: '#aaa',
    textAlign: 'center',
  },
  legalLink: {
    color: GREEN,
    textDecoration: 'none',
  },
};
