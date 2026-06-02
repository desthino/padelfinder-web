import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { G } from '../lib/theme';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [pwd, setPwd] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  async function handleReset(e) {
    e.preventDefault();
    if (pwd !== confirm) { setMsg('Les mots de passe ne correspondent pas.'); return; }
    if (pwd.length < 8) { setMsg('Minimum 8 caractères.'); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: pwd });
    setLoading(false);
    if (error) { setMsg(error.message); return; }
    setMsg('✓ Mot de passe mis à jour !');
    setTimeout(() => navigate('/dashboard'), 1500);
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8F9FA', fontFamily: G.font, padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: 400, background: '#fff', border: `0.5px solid ${G.border}`, borderRadius: 16, padding: '1.75rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <span style={{ fontSize: 28 }}>🎾</span>
          <h1 style={{ fontFamily: G.fontTitle, fontSize: 22, fontWeight: 800, margin: '8px 0 4px' }}>Nouveau mot de passe</h1>
        </div>
        <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 500, color: G.textMuted, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Nouveau mot de passe</label>
            <input type="password" value={pwd} onChange={e => setPwd(e.target.value)} placeholder="Min. 8 caractères" style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', fontSize: 14, border: '0.5px solid #ddd', borderRadius: 8, fontFamily: G.font, outline: 'none' }} />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 500, color: G.textMuted, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Confirmer</label>
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Répétez le mot de passe" style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', fontSize: 14, border: '0.5px solid #ddd', borderRadius: 8, fontFamily: G.font, outline: 'none' }} />
          </div>
          {msg && <div style={{ fontSize: 13, padding: '8px 12px', borderRadius: 8, background: msg.startsWith('✓') ? G.greenLight : '#FEE2E2', color: msg.startsWith('✓') ? G.green : G.red }}>{msg}</div>}
          <button type="submit" disabled={loading} style={{ padding: '11px', fontSize: 14, fontWeight: 500, border: 'none', borderRadius: 8, background: G.green, color: '#fff', cursor: 'pointer', fontFamily: G.font }}>
            {loading ? 'Mise à jour…' : 'Mettre à jour'}
          </button>
        </form>
      </div>
    </div>
  );
}
