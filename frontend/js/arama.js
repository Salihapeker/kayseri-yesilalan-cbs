import { katmanlar, map, toggleLayer } from './harita.js';
import { parkDetayGoster } from './detay-panel.js';
import { aramaIndeksi } from './veri-yukle.js';

const aramaKutu = document.getElementById('arama-kutu');
const aramaSonuc = document.getElementById('arama-sonuc');

aramaKutu.addEventListener('input', () => {
  const q = aramaKutu.value.trim().toLocaleLowerCase('tr-TR');
  aramaSonuc.innerHTML = '';
  if (q.length < 2) return;

  aramaIndeksi
    .filter(p => p.ad.toLocaleLowerCase('tr-TR').includes(q) || p.mahalle.toLocaleLowerCase('tr-TR').includes(q))
    .slice(0, 8)
    .forEach(p => {
      const div = document.createElement('div');
      div.textContent = p.mahalle ? `${p.ad} — ${p.mahalle}` : p.ad;
      div.addEventListener('click', () => {
        if (!katmanlar.park.hasLayer(p.layer)) {
          document.getElementById('chk-park').checked = true;
          toggleLayer('park', true);
        }
        map.setView(p.merkez, 16);
        parkDetayGoster(p.id, [p.merkez.lng, p.merkez.lat]);
        aramaSonuc.innerHTML = '';
        aramaKutu.value = '';
      });
      aramaSonuc.appendChild(div);
    });
});
