import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { G } from '../lib/theme';
import { Page, Card, Badge, LevelBadge, Btn, Spinner, PlayerCard, Empty } from '../components/UI';

export default function GameDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [game, setGame] = useState(null);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joined, setJoined] = useState(false);

  useEffect(() => { fetchGame(); }, [id]);

  async function fetchGame() {
    const { data: g } = await supabase.from('games').select('*').eq('id', id).single();
    const { data: gp } = await supabase.from('game_players').select('players(id,first_name,last_name,avatar,level,city,rating)').eq('game_id', id);
    setGame(g);
    const ps = (gp || []).map(r => r.players).filter(Boolean);
    setPlayers(ps);
    setJoined(ps.some(p => p.id === user.id));
    setLoading(false);
  }

  async function joinGame() {
    await supabase.from('game_players').insert({ game_id: id, player_id: user.id });
    setJoined(true);
    fetchGame();
  }

  async function leaveGame() {
    await supabase.from('game_players').delete().eq('game_id', id).eq('player_id', user.id);
    setJoined(false);
    fetchGame();
  }

  async function deleteGame() {
    if (!window.confirm('Supprimer cette partie ?')) return;
    await supabase.from('game_players').delete().eq('game_id', id);
    await supabase.from('games').delete().eq('id', id);
    navigate('/games');
  }

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}><Spinner size={32} /></div>;
  if (!game) return <div style={{ padding: '2rem', textAlign: 'center' }}>Partie introuvable.</div>;

  const date = new Date(game.date);
  const spots = (game.max_players || 4) - players.length;
  const isCreator = game.creator_id === user.id;

  return (
    <Page maxWidth={700}>
      <button onClick={() => navigate('/games')} style={{ fontSize: 13, color: G.textMuted, background: 'none', border: 'none', cursor: 'pointer', marginBottom: '1rem', fontFamily: G.font }}>← Retour aux parties</button>

      <Card style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: G.green, textTransform: 'uppercase', marginBottom: 6 }}>
              {date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              {' à '}
              {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: G.text, margin: '0 0 8px' }}>📍 {game.location}</h1>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {game.level && <LevelBadge level={game.level} />}
              <Badge text={`${players.length}/${game.max_players || 4} joueurs`} bg="#F3F4F6" color="#374151" />
              <Badge text={spots > 0 ? `${spots} place${spots > 1 ? 's' : ''} libre${spots > 1 ? 's' : ''}` : 'Complet'} bg={spots > 0 ? G.greenLight : G.redLight} color={spots > 0 ? G.green : G.red} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexDirection: 'column', alignItems: 'flex-end' }}>
            {!joined && spots > 0 && <Btn onClick={joinGame}>Rejoindre</Btn>}
            {joined && !isCreator && <Btn variant="ghost" onClick={leaveGame}>Quitter</Btn>}
            {isCreator && <Btn variant="danger" onClick={deleteGame}>Supprimer</Btn>}
          </div>
        </div>
        {game.description && <p style={{ fontSize: 13, color: G.textMuted, marginTop: 12, paddingTop: 12, borderTop: `0.5px solid ${G.border}` }}>{game.description}</p>}
      </Card>

      <Card>
        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: '0.75rem' }}>👥 Participants ({players.length})</div>
        {players.length === 0
          ? <Empty icon="👥" text="Aucun participant pour l'instant" />
          : players.map(p => <PlayerCard key={p.id} player={p} onClick={() => navigate(`/profile/${p.id}`)} />)
        }
      </Card>
    </Page>
  );
}
