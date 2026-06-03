import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { supabase } from '../lib/supabaseClient';
import { G } from '../lib/theme';
import { Page, PageHeader, Card, Badge, Empty, Input, Btn, Spinner, useIsMobile } from '../components/UI';

// Fix icône Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Icône verte custom
const greenIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export default function Clubs() {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState('');
  const [selected, setSelected] = useState(null);
  const [view, setView] = useState('map'); // 'map' | 'list'
  const isMobile = useIsMobile();

  useEffect(() => { fetchClubs(); }, []);

  async function fetchClubs() {
    setLoading(true);
    let q = supabase.from('clubs').select('*').order('name');
    if (city) q = q.ilike('city', `%${city}%`);
    const { data } = await q;
    setClubs(data || []);
    setLoading(false);
  }

  // Centre de la carte — France par défaut
  const mapCenter = clubs.find(c => c.lat && c.lng)
    ? [clubs[0].lat, clubs[0].lng]
    : [46.603354, 1.888334];

  return (
    <Page>
      <PageHeader title="Clubs de padel" subtitle="Trouvez un club près de chez vous" />

      {/* Filtres */}
      <Card style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr auto auto', gap: 12, alignItems: 'flex-end' }}>
          <Input label="Ville" value={city} onChange={setCity} placeholder="Paris, Lyon, Marseille..." />
          <Btn onClick={fetchClubs}>🔍 Rechercher</Btn>
          <div style={{ display: 'flex', gap: 4, background: '#f5f5f5', borderRadius: 8, padding: 3 }}>
            <button onClick={() => setView('map')} style={{ padding: '6px 12px', fontSize: 13, border: 'none', borderRadius: 6, cursor: 'pointer', fontFamily: G.font, background: view === 'map' ? '#fff' : 'none', color: view === 'map' ? G.text : G.textMuted, fontWeight: 500 }}>🗺️ Carte</button>
            <button onClick={() => setView('list')} style={{ padding: '6px 12px', fontSize: 13, border: 'none', borderRadius: 6, cursor: 'pointer', fontFamily: G.font, background: view === 'list' ? '#fff' : 'none', color: view === 'list' ? G.text : G.textMuted, fontWeight: 500 }}>📋 Liste</button>
          </div>
        </div>
      </Card>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><Spinner size={32} /></div>
      ) : (
        <>
          {/* Vue Carte */}
          {view === 'map' && (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 340px', gap: '1rem' }}>
              <Card style={{ padding: 0, overflow: 'hidden', height: isMobile ? 350 : 500 }}>
                <MapContainer
                  center={mapCenter}
                  zoom={clubs.some(c => c.lat && c.lng) ? 6 : 5}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {clubs.filter(c => c.lat && c.lng).map(c => (
                    <Marker
                      key={c.id}
                      position={[c.lat, c.lng]}
                      icon={greenIcon}
                      eventHandlers={{ click: () => setSelected(c) }}
                    >
                      <Popup>
                        <div style={{ fontFamily: G.font, minWidth: 160 }}>
                          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>🏟️ {c.name}</div>
                          {c.address && <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>📍 {c.address}</div>}
                          {c.courts && <div style={{ fontSize: 12, color: G.green }}>🎾 {c.courts} terrains</div>}
                          {c.phone && <div style={{ fontSize: 12, marginTop: 4 }}>📞 {c.phone}</div>}
                          {c.website && <a href={c.website} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: G.green, display: 'block', marginTop: 4 }}>🌐 Site web</a>}
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </Card>

              {/* Liste latérale */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: isMobile ? 'none' : 500, overflowY: 'auto' }}>
                {clubs.length === 0 ? (
                  <Card><Empty icon="🏟️" text="Aucun club trouvé" /></Card>
                ) : clubs.map(c => (
                  <Card
                    key={c.id}
                    onClick={() => setSelected(c)}
                    style={{ cursor: 'pointer', border: selected?.id === c.id ? `1.5px solid ${G.green}` : `0.5px solid ${G.border}`, transition: 'all 0.15s' }}
                  >
                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: G.greenLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🏟️</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: G.text }}>{c.name}</div>
                        <div style={{ fontSize: 12, color: G.textMuted }}>📍 {c.address || c.city}</div>
                        <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                          {c.courts && <Badge text={`${c.courts} terrains`} />}
                          {c.indoor && <Badge text="🏠 Indoor" bg="#EDE7F6" color="#4527A0" />}
                          {c.outdoor && <Badge text="☀️ Outdoor" bg="#FFF8E1" color="#F57F17" />}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Vue Liste */}
          {view === 'list' && (
            clubs.length === 0 ? (
              <Card><Empty icon="🏟️" text="Aucun club trouvé" /></Card>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '0.75rem' }}>
                {clubs.map(c => (
                  <Card key={c.id}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <div style={{ width: 48, height: 48, borderRadius: 10, background: G.greenLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>🏟️</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 15, color: G.text, marginBottom: 4 }}>{c.name}</div>
                        <div style={{ fontSize: 12, color: G.textMuted, marginBottom: 6 }}>📍 {c.address || c.city}</div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {c.courts && <Badge text={`${c.courts} terrains`} />}
                          {c.city && <Badge text={c.city} bg="#F3F4F6" color="#374151" />}
                          {c.indoor && <Badge text="🏠 Indoor" bg="#EDE7F6" color="#4527A0" />}
                          {c.outdoor && <Badge text="☀️ Outdoor" bg="#FFF8E1" color="#F57F17" />}
                        </div>
                        {c.phone && <div style={{ fontSize: 12, color: G.textSub, marginTop: 6 }}>📞 {c.phone}</div>}
                        {c.website && <a href={c.website} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: G.green, display: 'block', marginTop: 4 }}>🌐 Site web</a>}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )
          )}

          {clubs.length === 0 && view === 'map' && (
            <Card style={{ marginTop: '1rem' }}>
              <Empty icon="🏟️" text="Aucun club trouvé — ajoutez des clubs dans Supabase avec des colonnes lat/lng !" />
            </Card>
          )}
        </>
      )}
    </Page>
  );
}
