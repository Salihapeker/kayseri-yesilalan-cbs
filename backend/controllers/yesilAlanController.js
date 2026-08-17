import * as YesilAlanModel from "../models/yesilAlanModel.js";

export async function listele(req, res) {
  const rows = await YesilAlanModel.tumunuGetir();
  res.json({
    type: "FeatureCollection",
    features: rows.map((r) => ({
      type: "Feature",
      geometry: r.geometry,
      properties: { id: r.id, ad: r.ad, tur: r.tur, mahalle: r.mahalle },
    })),
  });
}

export async function detay(req, res) {
  const park = await YesilAlanModel.idIleGetir(req.params.id);
  if (!park) return res.status(404).json({ error: "Park bulunamadı" });

  const { ozellikler, liste } = await YesilAlanModel.tesisOzetiGetir(
    req.params.id,
  );
  res.json({ ...park, tesis_ozeti: ozellikler, tesis_listesi: liste });
}

export async function guncelle(req, res) {
  await YesilAlanModel.guncelle(req.params.id, req.body);
  res.sendStatus(204);
}

export async function ozellikleriGuncelle(req, res) {
  await YesilAlanModel.ozellikleriGuncelle(req.params.id, req.body);
  res.sendStatus(204);
}

export async function sil(req, res) {
  await YesilAlanModel.sil(req.params.id);
  res.sendStatus(204);
}

export async function olustur(req, res) {
  const { ad, geojson } = req.body;
  if (!ad || !geojson)
    return res.status(400).json({ error: "ad ve geojson zorunlu" });
  const id = await YesilAlanModel.olustur(req.body);
  res.status(201).json({ id });
}
export async function hizliTesisEkle(req, res) {
  const id = await YesilAlanModel.hizliTesisEkle(req.params.id, req.body.tur);
  res.status(201).json({ id });
}
export async function tesisSilBirTane(req, res) {
  const id = await YesilAlanModel.tesisSilBirTane(
    req.params.id,
    req.params.tur,
  );
  res.json({ id });
}
