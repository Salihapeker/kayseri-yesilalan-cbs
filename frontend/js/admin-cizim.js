import { API } from './config.js';
import { map, cizimKatmani } from './admin-harita.js';
import { parklariYenidenYukle } from './admin-duzenle.js';
import { tesisleriYukle } from './admin-harita.js';

let sayac = 0;

map.on(L.Draw.Event.CREATED, (e) => {
  const layer = e.layer;
  const tip = e.layerType;
  const kimlik = 'sekil-' + (sayac++);

  cizimKatmani.addLayer(layer);

  const formHtml = tip === 'polygon'
    ? `
      <div class="mini-form" data-id="${kimlik}">
        <b>Yeni park sınırı</b>
        <label>İsim</label>
        <input type="text" id="isim-${kimlik}" placeholder="Park adı" />
        <label>Mahalle</label>
        <input type="text" id="mahalle-${kimlik}" placeholder="Opsiyonel" />
        <button id="kaydet-${kimlik}">Kaydet</button>
        <div class="durum" id="durum-${kimlik}"></div>
      </div>`
    : `
      <div class="mini-form" data-id="${kimlik}">
        <b>Yeni nokta</b>
        <label>Tür</label>
        <select id="tur-${kimlik}">
          <option value="tuvalet">Tuvalet</option>
          <option value="cocuk_oyun_alani">Çocuk oyun alanı</option>
          <option value="spor_sahasi">Spor sahası</option>
          <option value="cesme">Çeşme</option>
          <option value="otopark">Otopark</option>
          <option value="kafeterya">Kafeterya</option>
          <option value="bank">Bank</option>
          <option value="piknik_alani">Piknik alanı</option>
        </select>
        <label>İsim</label>
        <input type="text" id="isim-${kimlik}" placeholder="Opsiyonel" />
        <button id="kaydet-${kimlik}">Kaydet</button>
        <div class="durum" id="durum-${kimlik}"></div>
      </div>`;

  layer.on('popupopen', () => {
    const kaydetBtn = document.getElementById(`kaydet-${kimlik}`);
    if (!kaydetBtn || kaydetBtn.dataset.baglandi) return;
    kaydetBtn.dataset.baglandi = '1';

    kaydetBtn.addEventListener('click', async () => {
      const durum = document.getElementById(`durum-${kimlik}`);
      const isim = document.getElementById(`isim-${kimlik}`).value.trim();

      try {
        if (tip === 'polygon') {
          if (!isim) { durum.textContent = 'İsim gerekli.'; durum.style.color = 'crimson'; return; }
          const mahalle = document.getElementById(`mahalle-${kimlik}`).value.trim();
          const geojson = layer.toGeoJSON().geometry;
          await fetch(`${API}/yesil-alanlar`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ad: isim, mahalle, geojson })
          });
          cizimKatmani.removeLayer(layer);
          parklariYenidenYukle();
        } else {
          const tur = document.getElementById(`tur-${kimlik}`).value;
          const latlng = layer.getLatLng();
          await fetch(`${API}/tesisler`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tur, ad: isim || null, lon: latlng.lng, lat: latlng.lat })
          });
          cizimKatmani.removeLayer(layer);
          tesisleriYukle(API);
        }

        durum.textContent = 'Kaydedildi ✓';
        document.dispatchEvent(new CustomEvent('kayseri:veri-degisti'));
      } catch (err) {
        durum.textContent = 'Hata: ' + err.message;
        durum.style.color = 'crimson';
      }
    });
  });

  layer.bindPopup(formHtml, { closeOnClick: false, autoClose: false, minWidth: 200 });
  layer.openPopup();
});
