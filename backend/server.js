import express from 'express';
import cors from 'cors';
import pkg from 'pg';
import 'dotenv/config';

const { Pool } = pkg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const app = express();
app.use(cors());
app.use(express.json());

// Parklar (yeşil alanlar) - liste
app.get('/api/yesil-alanlar', async (req, res) => {
  const { rows } = await pool.query(`
    SELECT id, ad, tur, mahalle,
           ST_AsGeoJSON(COALESCE(sinir, konum))::json AS geometry
    FROM yesil_alanlar
    WHERE durum = 'aktif'
  `);

  res.json({
    type: 'FeatureCollection',
    features: rows.map(r => ({
      type: 'Feature',
      geometry: r.geometry,
      properties: { id: r.id, ad: r.ad, tur: r.tur, mahalle: r.mahalle }
    }))
  });
});

// Bir parkın detayı + tesis özeti + tesis listesi (silmek için id'leriyle)
app.get('/api/yesil-alanlar/:id', async (req, res) => {
  const { id } = req.params;

  const park = await pool.query(
    `SELECT id, ad, mahalle, ozellikler AS ek_ozellikler,
            ST_AsGeoJSON(COALESCE(sinir, konum))::json AS geometry,
            ROUND(ST_Area(sinir::geography)) AS alan_m2
     FROM yesil_alanlar WHERE id = $1 AND durum = 'aktif'`,
    [id]
  );
  if (park.rows.length === 0) return res.status(404).json({ error: 'Park bulunamadı' });

  const tesisler = await pool.query(
    `SELECT id, tur, ad FROM tesisler WHERE yesil_alan_id = $1 AND durum = 'aktif' ORDER BY tur`,
    [id]
  );

  const ozellikler = { tuvalet: 0, cocuk_oyun_alani: 0, spor_sahasi: 0, cesme: 0, otopark: 0, kafeterya: 0, bank: 0, piknik_alani: 0 };
  tesisler.rows.forEach(r => { ozellikler[r.tur] = (ozellikler[r.tur] || 0) + 1; });

  res.json({ ...park.rows[0], tesis_ozeti: ozellikler, tesis_listesi: tesisler.rows });
});

// Parkın temel bilgilerini güncelle (isim, mahalle)
app.put('/api/yesil-alanlar/:id', async (req, res) => {
  const { ad, mahalle } = req.body;
  await pool.query(
    `UPDATE yesil_alanlar SET ad = $1, mahalle = $2, guncelleme_tarihi = now() WHERE id = $3`,
    [ad, mahalle || null, req.params.id]
  );
  res.sendStatus(204);
});

// Parkın ek özelliklerini güncelle
app.put('/api/yesil-alanlar/:id/ozellikler', async (req, res) => {
  const { id } = req.params;
  const ozellikler = req.body;
  await pool.query(`UPDATE yesil_alanlar SET ozellikler = $1 WHERE id = $2`, [JSON.stringify(ozellikler), id]);
  res.sendStatus(204);
});

// Parkı sil (soft delete)
app.delete('/api/yesil-alanlar/:id', async (req, res) => {
  await pool.query(`UPDATE yesil_alanlar SET durum = 'silindi' WHERE id = $1`, [req.params.id]);
  res.sendStatus(204);
});

// Yeni park ekle
app.post('/api/yesil-alanlar', async (req, res) => {
  const { ad, mahalle, geojson } = req.body;
  if (!ad || !geojson) return res.status(400).json({ error: 'ad ve geojson zorunlu' });

  const { rows } = await pool.query(
    `INSERT INTO yesil_alanlar (ad, mahalle, sinir, konum)
     VALUES ($1, $2, ST_SetSRID(ST_GeomFromGeoJSON($3), 4326), ST_Centroid(ST_SetSRID(ST_GeomFromGeoJSON($3), 4326)))
     RETURNING id`,
    [ad, mahalle || null, JSON.stringify(geojson)]
  );
  res.status(201).json({ id: rows[0].id });
});

// Tesisler - liste, opsiyonel ?tur= filtresi
app.get('/api/tesisler', async (req, res) => {
  const { tur } = req.query;
  const params = [];
  let where = "WHERE t.durum = 'aktif'";
  if (tur) { params.push(tur); where += ` AND t.tur = $${params.length}`; }

  const { rows } = await pool.query(
    `SELECT t.id, t.tur, t.ad, t.mahalle, t.ozellikler, y.ad AS park_adi,
            ST_AsGeoJSON(t.konum)::json AS geometry
     FROM tesisler t LEFT JOIN yesil_alanlar y ON t.yesil_alan_id = y.id
     ${where}`,
    params
  );

  res.json({
    type: 'FeatureCollection',
    features: rows.map(r => ({
      type: 'Feature', geometry: r.geometry,
      properties: { id: r.id, tur: r.tur, ad: r.ad, mahalle: r.mahalle, park_adi: r.park_adi, ozellikler: r.ozellikler }
    }))
  });
});

// Yeni tesis ekle (en yakın parka otomatik bağlanır)
app.post('/api/tesisler', async (req, res) => {
  const { tur, ad, yesil_alan_id, lon, lat } = req.body;
  if (!tur || !lon || !lat) return res.status(400).json({ error: 'tur, lon ve lat zorunlu' });

  let parkId = yesil_alan_id || null;
  if (!parkId) {
    const enYakin = await pool.query(
      `SELECT id FROM yesil_alanlar ORDER BY konum <-> ST_SetSRID(ST_MakePoint($1,$2), 4326) LIMIT 1`,
      [lon, lat]
    );
    if (enYakin.rows.length > 0) parkId = enYakin.rows[0].id;
  }

  const { rows } = await pool.query(
    `INSERT INTO tesisler (tur, ad, yesil_alan_id, konum)
     VALUES ($1, $2, $3, ST_SetSRID(ST_MakePoint($4,$5), 4326))
     RETURNING id`,
    [tur, ad || null, parkId, lon, lat]
  );
  res.status(201).json({ id: rows[0].id });
});

// Tesisi sil (soft delete)
app.delete('/api/tesisler/:id', async (req, res) => {
  await pool.query(`UPDATE tesisler SET durum = 'silindi' WHERE id = $1`, [req.params.id]);
  res.sendStatus(204);
});

// En yakın tesisleri bulma
app.get('/api/tesisler/en-yakin', async (req, res) => {
  const { lon, lat, tur, limit } = req.query;
  if (!lon || !lat) return res.status(400).json({ error: 'lon ve lat gerekli' });

  const params = [lon, lat];
  let where = "WHERE t.durum = 'aktif'";
  if (tur) { params.push(tur); where += ` AND t.tur = $${params.length}`; }
  params.push(limit || 5);

  const { rows } = await pool.query(
    `SELECT t.id, t.tur, t.ad, y.ad AS park_adi,
            ROUND(ST_Distance(t.konum::geography, ST_SetSRID(ST_MakePoint($1,$2),4326)::geography)) AS mesafe_m
     FROM tesisler t LEFT JOIN yesil_alanlar y ON t.yesil_alan_id = y.id
     ${where}
     ORDER BY t.konum <-> ST_SetSRID(ST_MakePoint($1,$2), 4326)
     LIMIT $${params.length}`,
    params
  );
  res.json(rows);
});

// Son eklenenler (park + tesis birlikte, en yeni üstte)
app.get('/api/son-eklenenler', async (req, res) => {
  const parklar = await pool.query(
    `SELECT id, ad, 'park' AS tip, olusturma_tarihi FROM yesil_alanlar WHERE durum = 'aktif' ORDER BY olusturma_tarihi DESC LIMIT 10`
  );
  const tesisler = await pool.query(
    `SELECT id, ad, tur AS tip, olusturma_tarihi FROM tesisler WHERE durum = 'aktif' ORDER BY olusturma_tarihi DESC LIMIT 10`
  );
  const hepsi = [...parklar.rows, ...tesisler.rows]
    .sort((a, b) => new Date(b.olusturma_tarihi) - new Date(a.olusturma_tarihi))
    .slice(0, 10);
  res.json(hepsi);
});

app.listen(process.env.PORT, () => {
  console.log(`API çalışıyor: http://localhost:${process.env.PORT}`);
});