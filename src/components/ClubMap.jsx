import { useEffect, useRef } from 'react';
import { G } from '../lib/theme';

export default function ClubMap({ clubs }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    // Charger Leaflet depuis le CDN
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    if (!window.L) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      script.onload = () => setTimeout(initMap, 300);
      document.head.appendChild(script);
    } else {
      initMap();
    }

    return () => {
      markersRef.current.forEach(m => mapInstance.current?.removeLayer(m));
      markersRef.current = [];
    };
  }, [clubs]);

  function initMap() {
    if (!mapRef.current || !window.L) return;

    // Nettoyer l'ancienne carte
    if (mapInstance.current) {
      mapInstance.current.remove();
      mapInstance.current = null;
    }

    const center = { lat: 48.8566, lng: 2.3522 }; // Paris par défaut

    mapInstance.current = window.L.map(mapRef.current).setView([center.lat, center.lng], 6);

    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(mapInstance.current);

    markersRef.current = [];

    clubs.forEach(club => {
      if (!club.lat || !club.lng) return;
      const marker = window.L.marker([Number(club.lat), Number(club.lng)])
        .addTo(mapInstance.current)
        .bindPopup(`<b>${club.name}</b><br/>${club.address || club.city || ''}`);
      markersRef.current.push(marker);
    });

    // Ajuster le zoom pour voir tous les marqueurs
    if (markersRef.current.length > 0) {
      const group = window.L.featureGroup(markersRef.current);
      mapInstance.current.fitBounds(group.getBounds().pad(0.1));
    }
  }

  return (
    <div style={{ marginTop: 16 }}>
      <div
        ref={mapRef}
        style={{
          width: '100%',
          height: '350px',
          borderRadius: 12,
          overflow: 'hidden',
          border: `0.5px solid ${G.border}`,
          zIndex: 1,
        }}
      />
      <p style={{ fontSize: 12, color: G.textMuted, marginTop: 6 }}>
        🗺️ Carte OpenStreetMap — 100% gratuite
      </p>
    </div>
  );
}