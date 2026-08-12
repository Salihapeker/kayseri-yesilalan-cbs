import express from "express";
import * as TesisController from "../controllers/tesisController.js";

const router = express.Router();

router.get("/en-yakin", TesisController.enYakini);
router.get("/", TesisController.listele);
router.post("/", TesisController.olustur);
router.delete("/:id", TesisController.sil);

export default router;
