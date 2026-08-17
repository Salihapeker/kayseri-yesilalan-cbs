import { toggleLayer } from './harita.js';
import { parklariYukle, tesisleriYukle } from './veri-yukle.js';
import './arama.js';
import './yakinimdakiler.js';

parklariYukle();
tesisleriYukle();

const katmanCheckboxlari = {
  'chk-park': 'park', 'chk-tuvalet': 'tuvalet', 'chk-oyun': 'cocuk_oyun_alani',
  'chk-spor': 'spor_sahasi', 'chk-cesme': 'cesme', 'chk-otopark': 'otopark',
  'chk-kafeterya': 'kafeterya', 'chk-bank': 'bank', 'chk-piknik': 'piknik_alani'
};

Object.entries(katmanCheckboxlari).forEach(([id, tur]) => {
  document.getElementById(id).addEventListener('change', e => toggleLayer(tur, e.target.checked));
});
