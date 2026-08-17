import { API, renkler, turAdlari, turIkonlari, alanYaz, mesafeYaz, rengiSoluklastir } from './config.js';

const detayPanel = document.getElementById('detay-panel');
const detayIcerik = document.getElementById('detay-icerik');

document.getElementById('detay-kapat').addEventListener('click', () => {
  detayPanel.classList.remove('acik');
});

export async function parkDetayGoster(parkId, merkezLatLng) {
  detayPanel.classList.add('acik');
  detayIcerik.innerHTML = '<p class="yukleniyor-yazi">Yükleniyor...</p>';

  const detay = await fetch(`${API}/yesil-alanlar/${parkId}`).then(r => r.json());
  const o = detay.tesis_ozeti;
  const ek = detay.ek_ozellikler || {};

  const [lon, lat] = merkezLatLng;
  const yolTarifiUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;

  const turler = ['tuvalet', 'cocuk_oyun_alani', 'spor_sahasi', 'cesme', 'kafeterya', 'otopark'];
  const satirlar = [];

  for (const tur of turler) {
    const adet = o[tur] || 0;
    const renk = renkler[tur];

    if (adet > 0) {
      satirlar.push(`
        <div class="madde-satir var-durum">
          <div class="madde-ikon" style="background:${rengiSoluklastir(renk, 0.18)}">${turIkonlari[tur]}</div>
          <div class="madde-metin"><b>${turAdlari[tur]} var</b>${adet > 1 ? `<span class="alt-bilgi">${adet} tane</span>` : ''}</div>
        </div>`);
    } else {
      const alternatif = await fetch(`${API}/tesisler/en-yakin?lon=${lon}&lat=${lat}&tur=${tur}&limit=1`).then(r => r.json());
      const altYazi = alternatif.length > 0
        ? `<span class="alt-bilgi">En yakını ${alternatif[0].park_adi ? alternatif[0].park_adi : (alternatif[0].ad || turAdlari[tur])} · ${mesafeYaz(alternatif[0].mesafe_m)}</span>`
        : '';
      satirlar.push(`
        <div class="madde-satir yok-durum">
          <div class="madde-ikon" style="background:${rengiSoluklastir(renk, 0.1)}">${turIkonlari[tur]}</div>
          <div class="madde-metin"><b>${turAdlari[tur]} yok</b>${altYazi}</div>
        </div>`);
    }
  }

  const ekSatirlar = [];
  if (ek.aydinlatma) ekSatirlar.push(`<div class="madde-satir var-durum"><div class="madde-ikon" style="background:${rengiSoluklastir('#eab308', 0.18)}">💡</div><div class="madde-metin"><b>Aydınlatma var</b></div></div>`);
  if (ek.engelli_erisimi) ekSatirlar.push(`<div class="madde-satir var-durum"><div class="madde-ikon" style="background:${rengiSoluklastir('#0ea5e9', 0.18)}">♿</div><div class="madde-metin"><b>Engelli erişimi var</b></div></div>`);

  detayIcerik.innerHTML = `
    <div class="detay-ust">${detay.mahalle || 'Kayseri'}</div>
    <div class="detay-baslik">${detay.ad}</div>
    <div class="detay-alt">${ek.acilis_saatleri ? ek.acilis_saatleri + ' · ' : ''}${alanYaz(detay.alan_m2)}</div>
    <div class="neler-yapabilirsin">Burada neler yapabilirsin</div>
    ${satirlar.join('')}
    ${ekSatirlar.join('')}
    <a class="yol-tarifi-btn" href="${yolTarifiUrl}" target="_blank" rel="noopener">Yol tarifini aç</a>
  `;
}
