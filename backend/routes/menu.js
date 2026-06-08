// Menu routes: CRUD menu items.
const express = require("express");
const { randomUUID } = require("crypto");
const { getDb } = require("../db");
const { requireAuth, asyncH } = require("../lib/auth");
const { nowIso } = require("../lib/orders");

const router = express.Router();

const validMenuInput = (b) =>
  b &&
  typeof b.name === "string" &&
  b.name.trim() &&
  Number.isFinite(parseInt(b.price, 10)) &&
  typeof b.category === "string";

router.get(
  "/",
  asyncH(async (_req, res) => {
    const docs = await getDb()
      .collection("menu_items")
      .find({}, { projection: { _id: 0 } })
      .sort({ created_at: 1 })
      .toArray();
    res.json(docs);
  })
);

router.post(
  "/",
  requireAuth,
  asyncH(async (req, res) => {
    if (!validMenuInput(req.body)) {
      return res.status(400).json({ detail: "Invalid input" });
    }
    const doc = {
      id: randomUUID(),
      name: req.body.name,
      description: req.body.description || "",
      price: parseInt(req.body.price, 10),
      category: req.body.category,
      image_url: req.body.image_url || "",
      available: req.body.available !== false,
      created_at: nowIso(),
    };
    await getDb().collection("menu_items").insertOne(doc);
    delete doc._id;
    res.json(doc);
  })
);

router.put(
  "/:id",
  requireAuth,
  asyncH(async (req, res) => {
    if (!validMenuInput(req.body)) {
      return res.status(400).json({ detail: "Invalid input" });
    }
    const update = {
      name: req.body.name,
      description: req.body.description || "",
      price: parseInt(req.body.price, 10),
      category: req.body.category,
      image_url: req.body.image_url || "",
      available: req.body.available !== false,
    };
    const r = await getDb()
      .collection("menu_items")
      .updateOne({ id: req.params.id }, { $set: update });
    if (r.matchedCount === 0) {
      return res.status(404).json({ detail: "Menu item not found" });
    }
    const doc = await getDb()
      .collection("menu_items")
      .findOne({ id: req.params.id }, { projection: { _id: 0 } });
    res.json(doc);
  })
);

router.delete(
  "/:id",
  requireAuth,
  asyncH(async (req, res) => {
    const r = await getDb()
      .collection("menu_items")
      .deleteOne({ id: req.params.id });
    if (r.deletedCount === 0) {
      return res.status(404).json({ detail: "Menu item not found" });
    }
    res.json({ ok: true });
  })
);

module.exports = router;
