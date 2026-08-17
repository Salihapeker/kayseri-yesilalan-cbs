import express from "express";
import * as YesilAlanController from "../controllers/yesilAlanController.js";

const router = express.Router();

router.get("/", YesilAlanController.listele);
router.get("/:id", YesilAlanController.detay);
router.put("/:id", YesilAlanController.guncelle);
router.put("/:id/ozellikler", YesilAlanController.ozellikleriGuncelle);
router.delete("/:id", YesilAlanController.sil);
router.post("/", YesilAlanController.olustur);
router.post("/:id/tesisler", YesilAlanController.hizliTesisEkle);
router.delete("/:id/tesisler/:tur", YesilAlanController.tesisSilBirTane);
export default router;
