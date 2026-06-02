import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { G } from '../lib/theme';
import { Page, PageHeader, Card, Badge, LevelBadge, Empty, Btn, Select, Spinner } from '../components/UI';

const LEVELS = [
  { value: '', label: 'Tous niveaux' },
  { value: 'debutant', label: '🌱 Débutant' },
  { value: 'intermediaire', label: '⚡ Intermédiaire' },
  { value: 'avance', label: '🔥 Avancé' },
  { value: 'expert', label: '🏆 Expert' },
];

export default function Games() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [level, setLevel] = useState('');
  const [tab, setTab] = useState('all'); // all | mine

  useEffect(() => { fetchGames(); }, [tab, level]);

  async function fetchGames() {
    setLoading(true);
    if (tab === 'mine') {
      const { data } = await supabase.from('game_players').select('games(*, players(id,first_name,last_name,avatar))').eq('player_id', user.id);
      setGames((data || []).map(d => d.games).filter(Boolean));
    } else {
      let q = supabase.from('games').select('*, game_players(count)').gte('date', new Date().toISOString()).order('date');
      if (level) q = q.eq('level', level);
      const { data } = await q;
      setGames(data || []);
    }
    setLoading(false);
  }

  async function joinGame(gameId) {
    await supabase.from('game_players').insert({ game_id: gameId, player_id: user.id });
    fetchGames();
  }

  return (
    <Page>
      <PageHeader
        title="Parties de padel"
        subtitle="Rejoignez ou créez une partie"
        action={<Btn onClick={() => navigate('/games/create')}>+ Créer une partie</Btn>}
      />

      {/* Tabs + filtre */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: 4, background: '#fff', border: `0.5px solid ${G.border}`, borderRadius: 10, padding: 3 }}>
          {[['all', 'Toutes les parties'], ['mine', 'Mes parties']].map(([val, label]) => (
            <button key={val} onClick={() => setTab(val)} style={{ padding: '6px 14px', fontSize: 13, fontWeight: 500, border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: G.font, background: tab === val ? G.green : 'none', color: tab === val ? '#fff' : G.textSub }}>
              {label}
            </button>
          ))}
        </div>
        <div style={{ width: 180 }}>
          <Select value={level} onChange={setLevel} options={LEVELS} />
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><Spinner size={32} /></div>
      ) : games.length === 0 ? (
        <Card><Empty icon="📅" text="Aucune partie trouvée" cta="Créer la première" onClick={() => navigate('/games/create')} /></Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          {games.map(g => <GameCard key={g.id} game={g} onJoin={() => joinGame(g.id)} onClick={() => navigate(`/games/${g.id}`)} userId={user.id} />)}
        </div>
      )}
    </Page>
  );
}

function GameCard({ game, onJoin, onClick, userId }) {
  const date = game.date ? new Date(game.date) : null;
  const spots = (game.max_players || 4) - (game.game_players?.[0]?.count || 0);

  return (
    <Card onClick={onClick} style={{ cursor: 'pointer', transition: 'box-shadow 0.15s' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: G.green, textTransform: 'uppercase' }}>
          {date ? date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }) : '—'}
          {date && <span style={{ color: G.textMuted, marginLeft: 6 }}>{date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>}
        </div>
        {game.level && <LevelBadge level={game.level} />}
      </div>
      <div style={{ fontSize: 15, fontWeight: 600, color: G.text, marginBottom: 4 }}>📍 {game.location || 'Lieu non défini'}</div>
      {game.description && <div style={{ fontSize: 12, color: G.textMuted, marginBottom: 8 }}>{game.description}</div>}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
        <Badge text={`${spots > 0 ? spots : 0} place${spots > 1 ? 's' : ''} libre${spots > 1 ? 's' : ''}`} bg={spots > 0 ? G.greenLight : G.redLight} color={spots > 0 ? G.green : G.red} />
        {spots > 0 && (
          <Btn small onClick={e => { e.stopPropagation(); onJoin(); }}>Rejoindre</Btn>
        )}
      </div>
    </Card>
  );
}
