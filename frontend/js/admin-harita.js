export const map = L.map('map').setView([38.7312, 35.4787], 12);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap katkıda bulunanlar'
}).addTo(map);

export const cizimKatmani = new L.FeatureGroup();
map.addLayer(cizimKatmani);

export const cizimKontrol = new L.Control.Draw({
  draw: { marker: true, polygon: true, polyline: false, rectangle: false, circle: false, circlemarker: false },
  edit: { featureGroup: cizimKatmani }
});
map.addControl(cizimKontrol);

let parkGosterimKatmani;

// onParkClick: bir parka tıklanınca çağrılacak fonksiyon (id, ad) alır
// onLoaded: park listesi yüklenince çağrılır ([{id, ad}, ...] alır) - arama kutusu için
export function parklariYukle(API, onParkClick, onLoaded) {
  if (parkGosterimKatmani) map.removeLayer(parkGosterimKatmani);

  fetch(`${API}/yesil-alanlar`).then(r => r.json()).then(data => {
    parkGosterimKatmani = L.geoJSON(data, {
      style: { color: '#1b4332', weight: 1.5, fillColor: '#2d6a4f', fillOpacity: 0.35 },
      pointToLayer: (f, latlng) => L.circleMarker(latlng, { radius: 6, fillColor: '#2d6a4f', color: '#fff', weight: 1, fillOpacity: 0.9 }),
      onEachFeature: (feature, layer) => {
        layer.bindTooltip(feature.properties.ad, { permanent: false, className: 'isim-etiket' });
        layer.on('click', () => onParkClick(feature.properties.id, feature.properties.ad));
      }
    }).addTo(map);

    if (onLoaded) onLoaded(data.features.map(f => ({ id: f.properties.id, ad: f.properties.ad })));
  });
}

export function tesisleriYukle(API) {
  const tesisKumesi = L.markerClusterGroup();
  map.addLayer(tesisKumesi);
  fetch(`${API}/tesisler`).then(r => r.json()).then(data => {
    data.features.forEach(f => {
      const [lon, lat] = f.geometry.coordinates;
      const marker = L.circleMarker([lat, lon], { radius: 5, fillColor: '#6b7280', color: '#fff', weight: 1, fillOpacity: 0.9 })
        .bindTooltip(f.properties.ad || f.properties.tur, { className: 'isim-etiket' });
      tesisKumesi.addLayer(marker);
    });
  });
}
