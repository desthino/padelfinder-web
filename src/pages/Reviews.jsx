import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { G } from '../lib/theme';
import { Page, Card, Btn } from '../components/UI';

export default function Reviews() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    await supabase.from('reviews').upsert({ reviewer_id: user.id, reviewed_id: id, rating, comment }, { onConflict: 'reviewer_id,reviewed_id' });
    // Met à jour la note moyenne
    const { data: allReviews } = await supabase.from('reviews').select('rating').eq('reviewed_id', id);
    if (allReviews?.length) {
      const avg = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length;
      await supabase.from('players').update({ rating: avg }).eq('id', id);
    }
    setSaving(false);
    setDone(true);
    setTimeout(() => navigate(`/profile/${id}`), 1500);
  }

  return (
    <Page maxWidth={500}>
      <button onClick={() => navigate(`/profile/${id}`)} style={{ fontSize: 13, color: G.textMuted, background: 'none', border: 'none', cursor: 'pointer', marginBottom: '1rem', fontFamily: G.font }}>← Retour au profil</button>
      <Card>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: G.text, margin: '0 0 1.25rem' }}>⭐ Laisser un avis</h2>
        {done ? (
          <div style={{ textAlign: 'center', padding: '1.5rem', color: G.green, fontWeight: 600 }}>✓ Avis envoyé ! Redirection…</div>
        ) : (
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 500, color: G.textMuted, textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Note</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {[1,2,3,4,5].map(n => (
                  <button key={n} type="button" onClick={() => setRating(n)} style={{ fontSize: 28, background: 'none', border: 'none', cursor: 'pointer', opacity: n <= rating ? 1 : 0.3 }}>⭐</button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 500, color: G.textMuted, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Commentaire</label>
              <textarea value={comment} onChange={e => setComment(e.target.value)} rows={4} placeholder="Décrivez votre expérience avec ce joueur..." style={{ width: '100%', boxSizing: 'border-box', padding: '9px 13px', fontSize: 14, border: '0.5px solid #ddd', borderRadius: 8, fontFamily: G.font, resize: 'vertical' }} />
            </div>
            <Btn type="submit" full disabled={saving}>{saving ? 'Envoi…' : 'Envoyer l\'avis'}</Btn>
          </form>
        )}
      </Card>
    </Page>
  );
}
