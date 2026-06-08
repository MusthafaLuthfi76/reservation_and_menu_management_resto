// Tables routes: CRUD restaurant tables.
const express = require("express");
const { randomUUID } = require("crypto");
const { getDb } = require("../db");
const { requireAuth, asyncH } = require("../lib/auth");

const router = express.Router();

router.get(
  "/",
  requireAuth,
  asyncH(async (_req, res) => {
    const docs = await getDb()
      .collection("tables")
      .find({}, { projection: { _id: 0 } })
      .sort({ table_number: 1 })
      .toArray();
    res.json(docs);
  })
);

router.post(
  "/",
  requireAuth,
  asyncH(async (req, res) => {
    const table_number = parseInt(req.body.table_number, 10);
    if (!Number.isFinite(table_number)) {
      return res.status(400).json({ detail: "Invalid table_number" });
    }
    const exists = await getDb().collection("tables").findOne({ table_number });
    if (exists) {
      return res.status(400).json({ detail: "Table number already exists" });
    }
    const doc = {
      id: randomUUID(),
      table_number,
      label: req.body.label || "",
    };
    await getDb().collection("tables").insertOne(doc);
    delete doc._id;
    res.json(doc);
  })
);

router.delete(
  "/:id",
  requireAuth,
  asyncH(async (req, res) => {
    const r = await getDb().collection("tables").deleteOne({ id: req.params.id });
    if (r.deletedCount === 0) {
      return res.status(404).json({ detail: "Table not found" });
    }
    res.json({ ok: true });
  })
);

module.exports = router;
