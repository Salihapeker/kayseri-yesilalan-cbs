import { renkler, kayseriSinirlari } from './config.js';

const koyuMod = window.matchMedia('(prefers-color-scheme: dark)').matches;

export const map = L.map('map').setView([38.7312, 35.4787], 12);

map.setMaxBounds(L.latLngBounds(kayseriSinirlari));
map.setMinZoom(9);

const tileUrl = koyuMod
  ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
  : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

L.tileLayer(tileUrl, { attribution: '&copy; OpenStreetMap katkıda bulunanlar &copy; CARTO' }).addTo(map);

export function kumeOlustur(renk) {
  return L.markerClusterGroup({
    iconCreateFunction: cluster => L.divIcon({
      html: `<div style="background:${renk}; color:#fff; width:34px; height:34px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:700; border:2px solid #fff; box-shadow:0 2px 8px rgba(0,0,0,0.25);">${cluster.getChildCount()}</div>`,
      className: '', iconSize: [34, 34]
    })
  });
}

export function noktaCiz(latlng, renk) {
  return L.circleMarker(latlng, { radius: 6, fillColor: renk, color: '#fff', weight: 1.5, fillOpacity: 0.95 });
}

export const katmanlar = {
  park: L.layerGroup().addTo(map),
  tuvalet: kumeOlustur(renkler.tuvalet),
  cocuk_oyun_alani: kumeOlustur(renkler.cocuk_oyun_alani),
  spor_sahasi: kumeOlustur(renkler.spor_sahasi),
  cesme: kumeOlustur(renkler.cesme),
  otopark: kumeOlustur(renkler.otopark),
  kafeterya: kumeOlustur(renkler.kafeterya),
  bank: kumeOlustur(renkler.bank),
  piknik_alani: kumeOlustur(renkler.piknik_alani)
};

export function toggleLayer(tur, acik) {
  if (acik) map.addLayer(katmanlar[tur]);
  else map.removeLayer(katmanlar[tur]);
}
