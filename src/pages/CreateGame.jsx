import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Page, PageHeader, Card, Btn, Input, Select } from '../components/UI';

const LEVELS = [
  { value: 'debutant', label: '🌱 Débutant' },
  { value: 'intermediaire', label: '⚡ Intermédiaire' },
  { value: 'avance', label: '🔥 Avancé' },
  { value: 'expert', label: '🏆 Expert' },
];

export default function CreateGame() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ location: '', date: '', time: '', level: 'intermediaire', max_players: '4', description: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.location || !form.date) { setError('Remplissez le lieu et la date.'); return; }
    setLoading(true);

    const datetime = form.time ? `${form.date}T${form.time}:00` : `${form.date}T10:00:00`;

    const { data: game, error: err } = await supabase.from('games').insert({
      location: form.location,
      date: datetime,
      level: form.level,
      max_players: parseInt(form.max_players),
      description: form.description,
      creator_id: user.id,
    }).select().single();

    if (err) { setError(err.message); setLoading(false); return; }

    // Ajoute le créateur comme participant
    await supabase.from('game_players').insert({ game_id: game.id, player_id: user.id });

    navigate(`/games/${game.id}`);
  }

  return (
    <Page maxWidth={560}>
      <PageHeader title="Créer une partie" subtitle="Organisez votre prochaine partie de padel" />

      <Card>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input label="Lieu / Club" value={form.location} onChange={v => set('location', v)} placeholder="Padel Club Paris 15e" />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input label="Date" type="date" value={form.date} onChange={v => set('date', v)} />
            <Input label="Heure" type="time" value={form.time} onChange={v => set('time', v)} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Select label="Niveau" value={form.level} onChange={v => set('level', v)} options={LEVELS} />
            <Select label="Joueurs max" value={form.max_players} onChange={v => set('max_players', v)} options={[2,4,6].map(n => ({ value: String(n), label: `${n} joueurs` }))} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, fontWeight: 500, color: '#999', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Description (optionnel)</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="Précisez le terrain, le niveau souhaité..." rows={3}
              style={{ padding: '9px 13px', fontSize: 14, border: '0.5px solid #ddd', borderRadius: 8, fontFamily: "'DM Sans', sans-serif", resize: 'vertical' }} />
          </div>

          {error && <div style={{ fontSize: 13, color: '#DC2626', background: '#FEE2E2', padding: '8px 12px', borderRadius: 8 }}>{error}</div>}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Btn variant="ghost" onClick={() => navigate('/games')}>Annuler</Btn>
            <Btn type="submit" disabled={loading}>{loading ? 'Création…' : '🎾 Créer la partie'}</Btn>
          </div>
        </form>
      </Card>
    </Page>
  );
}
