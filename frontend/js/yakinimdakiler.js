import { API, turAdlari, turIkonlari, mesafeYaz } from './config.js';
import { map } from './harita.js';

let konumMarker = null;

document.getElementById('yakinim-btn').addEventListener('click', () => {
  if (!navigator.geolocation) return alert('Tarayıcınız konum özelliğini desteklemiyor.');

  navigator.geolocation.getCurrentPosition(async pos => {
    const { latitude: lat, longitude: lon } = pos.coords;

    if (konumMarker) map.removeLayer(konumMarker);
    konumMarker = L.marker([lat, lon]).bindPopup('Buradasınız').addTo(map).openPopup();
    map.setView([lat, lon], 15);

    const sonuclar = await fetch(`${API}/yakinimdakiler?lon=${lon}&lat=${lat}&limit=10`).then(r => r.json());

    document.getElementById('yakinimdakiler-liste').innerHTML = sonuclar.map(s => `
      <div class="satir">
        <span>${turIkonlari[s.tur] || '📍'} <span class="isim">${s.ad || turAdlari[s.tur]}</span> <span class="tur">${s.park_adi ? '· ' + s.park_adi : ''}</span></span>
        <span class="mesafe">${mesafeYaz(s.mesafe_m)}</span>
      </div>
    `).join('');
  }, () => alert('Konumunuza erişilemedi.'));
});
