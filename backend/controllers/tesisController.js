import * as TesisModel from "../models/tesisModel.js";

export async function listele(req, res) {
  const rows = await TesisModel.tumunuGetir(req.query.tur);
  res.json({
    type: "FeatureCollection",
    features: rows.map((r) => ({
      type: "Feature",
      geometry: r.geometry,
      properties: {
        id: r.id,
        tur: r.tur,
        ad: r.ad,
        mahalle: r.mahalle,
        park_adi: r.park_adi,
        ozellikler: r.ozellikler,
      },
    })),
  });
}

export async function olustur(req, res) {
  const { tur, ad, yesil_alan_id, lon, lat } = req.body;
  if (!tur || !lon || !lat)
    return res.status(400).json({ error: "tur, lon ve lat zorunlu" });

  let parkId = yesil_alan_id || (await TesisModel.enYakinParkiBul(lon, lat));
  const id = await TesisModel.olustur({
    tur,
    ad,
    yesil_alan_id: parkId,
    lon,
    lat,
  });
  res.status(201).json({ id });
}

export async function sil(req, res) {
  await TesisModel.sil(req.params.id);
  res.sendStatus(204);
}

export async function enYakini(req, res) {
  const { lon, lat, tur, limit } = req.query;
  if (!lon || !lat)
    return res.status(400).json({ error: "lon ve lat gerekli" });
  const rows = await TesisModel.enYakiniBul({ lon, lat, tur, limit });
  res.json(rows);
}

export async function yakinimdakiler(req, res) {
  const { lon, lat, limit } = req.query;
  if (!lon || !lat)
    return res.status(400).json({ error: "lon ve lat gerekli" });
  const rows = await TesisModel.yakinimdakileriBul({ lon, lat, limit });
  res.json(rows);
}

export async function sonEklenenler(req, res) {
  const rows = await TesisModel.sonEklenenleriGetir();
  res.json(rows);
}
