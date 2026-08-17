import { API } from "./config.js";
import { map, parklariYukle } from "./admin-harita.js";

let parkListesi = [];
let seciliParkId = null;
let sonTesisListesi = [];

const aramaKutu = document.getElementById("arama-kutu");
const aramaSonuc = document.getElementById("arama-sonuc");
const modalOverlay = document.getElementById("modal-overlay");

const TESIS_TURLERI = [
  "tuvalet",
  "cocuk_oyun_alani",
  "spor_sahasi",
  "cesme",
  "otopark",
  "kafeterya",
  "bank",
  "piknik_alani",
];
const TUR_ETIKETLERI = {
  tuvalet: "Tuvalet",
  cocuk_oyun_alani: "Çocuk oyun alanı",
  spor_sahasi: "Spor sahası",
  cesme: "Çeşme",
  otopark: "Otopark",
  kafeterya: "Kafeterya",
  bank: "Bank",
  piknik_alani: "Piknik alanı",
};

export function parklariYenidenYukle() {
  parklariYukle(API, parkSec, (liste) => {
    parkListesi = liste;
  });
}
parklariYenidenYukle();

aramaKutu.addEventListener("input", () => {
  const q = aramaKutu.value.trim().toLocaleLowerCase("tr-TR");
  aramaSonuc.innerHTML = "";
  if (q.length < 2) return;

  parkListesi
    .filter((p) => p.ad.toLocaleLowerCase("tr-TR").includes(q))
    .slice(0, 8)
    .forEach((p) => {
      const div = document.createElement("div");
      div.textContent = p.ad;
      div.addEventListener("click", () => parkSec(p.id, p.ad));
      aramaSonuc.appendChild(div);
    });
});

export async function parkSec(id) {
  seciliParkId = id;
  aramaSonuc.innerHTML = "";
  aramaKutu.value = "";
  document.getElementById("duzenle-durum").textContent = "";
  document.getElementById("modal-tesisler").innerHTML = "Yükleniyor...";
  modalOverlay.classList.add("acik");

  const detay = await fetch(`${API}/yesil-alanlar/${id}`).then((r) => r.json());
  if (detay.error) {
    document.getElementById("modal-tesisler").innerHTML =
      "Bu kayıt bulunamadı (silinmiş olabilir).";
    return;
  }
  const o = detay.tesis_ozeti;
  const ek = detay.ek_ozellikler || {};
  sonTesisListesi = detay.tesis_listesi || [];

  document.getElementById("modal-isim").value = detay.ad || "";
  document.getElementById("modal-mahalle").value = detay.mahalle || "";
  document.getElementById("ozellik-aydinlatma").checked = !!ek.aydinlatma;
  document.getElementById("ozellik-engelli").checked = !!ek.engelli_erisimi;
  document.getElementById("ozellik-saatler").value = ek.acilis_saatleri || "";
  document.getElementById("ozellik-otopark-kapasite").value =
    ek.otopark_kapasitesi || "";

  sayaclariCiz(o);
  document.getElementById("modal-tesis-liste").style.display = "none";
  document.getElementById("detayli-goster-btn").textContent =
    "Tesisleri tek tek isimlendir ▾";
  detayliListeCiz(sonTesisListesi);

  if (detay.geometry) {
    const gecici = L.geoJSON(detay.geometry);
    map.fitBounds(gecici.getBounds(), { maxZoom: 16 });
  }
}

function sayaclariCiz(o) {
  const kutu = document.getElementById("modal-tesisler");
  kutu.innerHTML = TESIS_TURLERI.map((tur) => {
    const adet = o[tur] || 0;
    return `
      <div class="sayac-satir" data-tur="${tur}">
        <span class="sayac-etiket">${adet > 0 ? "🟢" : "⚪"} ${TUR_ETIKETLERI[tur]}</span>
        <div class="sayac-kontrol">
          <button class="sayac-eksi" ${adet === 0 ? "disabled" : ""}>−</button>
          <span class="sayac-deger">${adet}</span>
          <button class="sayac-arti">+</button>
        </div>
      </div>`;
  }).join("");

  kutu.querySelectorAll(".sayac-arti").forEach((btn) => {
    btn.addEventListener("click", () =>
      sayacDegistir(btn.closest(".sayac-satir").dataset.tur, +1),
    );
  });
  kutu.querySelectorAll(".sayac-eksi").forEach((btn) => {
    btn.addEventListener("click", () =>
      sayacDegistir(btn.closest(".sayac-satir").dataset.tur, -1),
    );
  });
}

async function sayacDegistir(tur, yon) {
  if (yon > 0) {
    await fetch(`${API}/yesil-alanlar/${seciliParkId}/tesisler`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tur }),
    });
  } else {
    await fetch(`${API}/yesil-alanlar/${seciliParkId}/tesisler/${tur}`, {
      method: "DELETE",
    });
  }
  document.dispatchEvent(new CustomEvent("kayseri:veri-degisti"));

  const detay = await fetch(`${API}/yesil-alanlar/${seciliParkId}`).then((r) =>
    r.json(),
  );
  sonTesisListesi = detay.tesis_listesi || [];
  sayaclariCiz(detay.tesis_ozeti);
  detayliListeCiz(sonTesisListesi);
}

function detayliListeCiz(tesisler) {
  const kutu = document.getElementById("modal-tesis-liste");
  if (tesisler.length === 0) {
    kutu.innerHTML = '<p class="hint">Bu parka bağlı tesis yok.</p>';
    return;
  }

  kutu.innerHTML = tesisler
    .map(
      (t) => `
    <div class="tesis-satir-detay" data-id="${t.id}">
      <input type="text" class="tesis-isim-input" value="${t.ad || ""}" placeholder="${TUR_ETIKETLERI[t.tur]} (isimsiz)" />
      <button class="tesis-kaydet-mini">Kaydet</button>
    </div>
  `,
    )
    .join("");

  kutu.querySelectorAll(".tesis-kaydet-mini").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const satir = btn.closest(".tesis-satir-detay");
      const id = satir.dataset.id;
      const ad = satir.querySelector(".tesis-isim-input").value.trim();
      await fetch(`${API}/tesisler/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ad }),
      });
      btn.textContent = "Kaydedildi ✓";
      setTimeout(() => {
        btn.textContent = "Kaydet";
      }, 1200);
    });
  });
}

document.getElementById("detayli-goster-btn").addEventListener("click", () => {
  const liste = document.getElementById("modal-tesis-liste");
  const acik = liste.style.display !== "none";
  liste.style.display = acik ? "none" : "block";
  document.getElementById("detayli-goster-btn").textContent = acik
    ? "Tesisleri tek tek isimlendir ▾"
    : "Tesisleri tek tek isimlendir ▴";
});

document.getElementById("modal-kapat").addEventListener("click", () => {
  modalOverlay.classList.remove("acik");
  seciliParkId = null;
});

document
  .getElementById("ozellik-kaydet-btn")
  .addEventListener("click", async () => {
    if (!seciliParkId) return;
    const durum = document.getElementById("duzenle-durum");

    const ad = document.getElementById("modal-isim").value.trim();
    const mahalle = document.getElementById("modal-mahalle").value.trim();
    const ozellikler = {
      aydinlatma: document.getElementById("ozellik-aydinlatma").checked,
      engelli_erisimi: document.getElementById("ozellik-engelli").checked,
      acilis_saatleri: document.getElementById("ozellik-saatler").value.trim(),
      otopark_kapasitesi: document.getElementById("ozellik-otopark-kapasite")
        .value
        ? parseInt(document.getElementById("ozellik-otopark-kapasite").value)
        : null,
    };

    try {
      await fetch(`${API}/yesil-alanlar/${seciliParkId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ad, mahalle }),
      });
      await fetch(`${API}/yesil-alanlar/${seciliParkId}/ozellikler`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ozellikler),
      });
      durum.textContent = "Güncellendi ✓";
      durum.style.color = "var(--basari)";
      parklariYenidenYukle();
      document.dispatchEvent(new CustomEvent("kayseri:veri-degisti"));
    } catch (err) {
      durum.textContent = "Hata: " + err.message;
      durum.style.color = "var(--tehlike)";
    }
  });

document.getElementById("park-sil-btn").addEventListener("click", async () => {
  if (!seciliParkId) return;
  if (
    !confirm("Bu parkı silmek istediğine emin misin? Bu işlem geri alınamaz.")
  )
    return;

  try {
    await fetch(`${API}/yesil-alanlar/${seciliParkId}`, { method: "DELETE" });
    modalOverlay.classList.remove("acik");
    seciliParkId = null;
    parklariYenidenYukle();
    document.dispatchEvent(new CustomEvent("kayseri:veri-degisti"));
  } catch (err) {
    document.getElementById("duzenle-durum").textContent =
      "Hata: " + err.message;
  }
});
