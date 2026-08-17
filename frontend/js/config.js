export const API = 'http://localhost:3000/api';

export const renkler = {
  park: '#2d6a4f', tuvalet: '#1d4ed8', cocuk_oyun_alani: '#f97316', spor_sahasi: '#9333ea',
  cesme: '#06b6d4', otopark: '#6b7280', kafeterya: '#a16207', bank: '#78716c', piknik_alani: '#65a30d'
};

export const turAdlari = {
  tuvalet: 'Tuvalet', cocuk_oyun_alani: 'Çocuk oyun alanı', spor_sahasi: 'Spor sahası',
  cesme: 'Çeşme', otopark: 'Otopark', kafeterya: 'Kafeterya', bank: 'Bank', piknik_alani: 'Piknik alanı', park: 'Park'
};

export const turIkonlari = {
  tuvalet: '🚻', cocuk_oyun_alani: '🧒', spor_sahasi: '⚽', cesme: '💧',
  otopark: '🅿️', kafeterya: '☕', bank: '🪑', piknik_alani: '🧺', park: '🌳'
};

export const kayseriSinirlari = [[37.5, 34.5], [39.3, 36.8]];

export function alanYaz(m2) {
  if (!m2) return '';
  return m2 > 10000 ? `${(m2 / 10000).toFixed(1)} hektar` : `${m2.toLocaleString('tr-TR')} m²`;
}

export function mesafeYaz(m) {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${m} m`;
}

export function varYok(n) {
  return n > 0 ? `Var (${n})` : 'Yok';
}

export function rengiSoluklastir(hex, opaklik) {
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${opaklik})`;
}
