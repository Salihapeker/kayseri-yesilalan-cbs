import pool from "../db.js";

export async function tumunuGetir(tur) {
  const params = [];
  let where = "WHERE t.durum = 'aktif'";
  if (tur) {
    params.push(tur);
    where += ` AND t.tur = $${params.length}`;
  }

  const { rows } = await pool.query(
    `SELECT t.id, t.tur, t.ad, t.mahalle, t.ozellikler, y.ad AS park_adi,
            ST_AsGeoJSON(t.konum)::json AS geometry
     FROM tesisler t LEFT JOIN yesil_alanlar y ON t.yesil_alan_id = y.id
     ${where}`,
    params,
  );
  return rows;
}

export async function enYakinParkiBul(lon, lat) {
  const { rows } = await pool.query(
    `SELECT id FROM yesil_alanlar ORDER BY konum <-> ST_SetSRID(ST_MakePoint($1,$2), 4326) LIMIT 1`,
    [lon, lat],
  );
  return rows[0]?.id || null;
}

export async function olustur({ tur, ad, yesil_alan_id, lon, lat }) {
  const { rows } = await pool.query(
    `INSERT INTO tesisler (tur, ad, yesil_alan_id, konum)
     VALUES ($1, $2, $3, ST_SetSRID(ST_MakePoint($4,$5), 4326))
     RETURNING id`,
    [tur, ad || null, yesil_alan_id, lon, lat],
  );
  return rows[0].id;
}

export async function sil(id) {
  await pool.query(`UPDATE tesisler SET durum = 'silindi' WHERE id = $1`, [id]);
}

export async function enYakiniBul({ lon, lat, tur, limit }) {
  const params = [lon, lat];
  let where = "WHERE t.durum = 'aktif'";
  if (tur) {
    params.push(tur);
    where += ` AND t.tur = $${params.length}`;
  }
  params.push(limit || 5);

  const { rows } = await pool.query(
    `SELECT t.id, t.tur, t.ad, y.ad AS park_adi,
            ROUND(ST_Distance(t.konum::geography, ST_SetSRID(ST_MakePoint($1,$2),4326)::geography)) AS mesafe_m
     FROM tesisler t LEFT JOIN yesil_alanlar y ON t.yesil_alan_id = y.id
     ${where}
     ORDER BY t.konum <-> ST_SetSRID(ST_MakePoint($1,$2), 4326)
     LIMIT $${params.length}`,
    params,
  );
  return rows;
}

export async function yakinimdakileriBul({ lon, lat, limit }) {
  const { rows } = await pool.query(
    `SELECT id, ad, 'park' AS tur, NULL AS park_adi,
            ROUND(ST_Distance(konum::geography, ST_SetSRID(ST_MakePoint($1,$2),4326)::geography)) AS mesafe_m
     FROM yesil_alanlar WHERE durum = 'aktif'
     UNION ALL
     SELECT t.id, t.ad, t.tur, y.ad AS park_adi,
            ROUND(ST_Distance(t.konum::geography, ST_SetSRID(ST_MakePoint($1,$2),4326)::geography)) AS mesafe_m
     FROM tesisler t LEFT JOIN yesil_alanlar y ON t.yesil_alan_id = y.id
     WHERE t.durum = 'aktif'
     ORDER BY mesafe_m ASC
     LIMIT $3`,
    [lon, lat, limit || 10],
  );
  return rows;
}

export async function sonEklenenleriGetir() {
  const parklar = await pool.query(
    `SELECT id, ad, 'park' AS tip, olusturma_tarihi FROM yesil_alanlar WHERE durum = 'aktif' ORDER BY olusturma_tarihi DESC LIMIT 10`,
  );
  const tesisler = await pool.query(
    `SELECT id, ad, tur AS tip, olusturma_tarihi FROM tesisler WHERE durum = 'aktif' ORDER BY olusturma_tarihi DESC LIMIT 10`,
  );
  return [...parklar.rows, ...tesisler.rows]
    .sort((a, b) => new Date(b.olusturma_tarihi) - new Date(a.olusturma_tarihi))
    .slice(0, 10);
}
export async function guncelle(id, { ad }) {
  await pool.query(`UPDATE tesisler SET ad = $1 WHERE id = $2`, [ad, id]);
}
