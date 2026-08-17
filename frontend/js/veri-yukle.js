import { API, renkler, turAdlari } from './config.js';
import { katmanlar, noktaCiz } from './harita.js';
import { parkDetayGoster } from './detay-panel.js';

export const aramaIndeksi = [];

export function parklariYukle() {
  fetch(`${API}/yesil-alanlar`).then(r => r.json()).then(data => {
    const parkLayer = L.geoJSON(data, {
      style: { color: '#1b4332', weight: 1.5, fillColor: '#2d6a4f', fillOpacity: 0.45 },
      pointToLayer: (feature, latlng) => noktaCiz(latlng, renkler.park)
    });

    parkLayer.eachLayer(layer => {
      const props = layer.feature.properties;
      const merkez = layer.getBounds ? layer.getBounds().getCenter() : layer.getLatLng();

      layer.on('click', () => parkDetayGoster(props.id, [merkez.lng, merkez.lat]));
      katmanlar.park.addLayer(layer);

      aramaIndeksi.push({ ad: props.ad, mahalle: props.mahalle || '', layer, merkez, id: props.id });
    });
  });
}

export function tesisleriYukle() {
  fetch(`${API}/tesisler`).then(r => r.json()).then(data => {
    data.features.forEach(f => {
      const [lon, lat] = f.geometry.coordinates;
      const tur = f.properties.tur;
      const renk = renkler[tur];
      if (!renk) return;
      const marker = noktaCiz([lat, lon], renk)
        .bindPopup(`<b>${f.properties.ad || turAdlari[tur]}</b><br>Park: ${f.properties.park_adi || '-'}`);
      katmanlar[tur].addLayer(marker);
    });
  });
}
