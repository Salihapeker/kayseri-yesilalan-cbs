import { API } from './config.js';
import { parkSec } from './admin-duzenle.js';

export function sonEklenenleriYukle() {
  fetch(`${API}/son-eklenenler`).then(r => r.json()).then(liste => {
    const kutu = document.getElementById('son-eklenenler-liste');
    if (liste.length === 0) { kutu.innerHTML = '<p class="hint">Henüz kayıt yok.</p>'; return; }

    kutu.innerHTML = '';
    liste.forEach(item => {
      const div = document.createElement('div');
      div.innerHTML = `<span>${item.ad || 'İsimsiz'}</span><span class="tur-etiket">${item.tip}</span>`;
      if (item.tip === 'park') div.addEventListener('click', () => parkSec(item.id, item.ad));
      kutu.appendChild(div);
    });
  });
}

sonEklenenleriYukle();
document.addEventListener('kayseri:veri-degisti', sonEklenenleriYukle);
