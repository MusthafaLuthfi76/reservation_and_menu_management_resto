// Orders routes: customer order lifecycle + admin listing.
const express = require("express");
const { randomUUID } = require("crypto");
const { getDb } = require("../db");
const { requireAuth, asyncH } = require("../lib/auth");
const { buildOrderItems, calcTotal, nowIso } = require("../lib/orders");

const router = express.Router();

// Create a new order (public — customer flow).
router.post(
  "/",
  asyncH(async (req, res) => {
    const table_number = parseInt(req.body.table_number, 10);
    if (!Number.isFinite(table_number)) {
      return res.status(400).json({ detail: "Invalid table_number" });
    }
    const items = await buildOrderItems(req.body.items);
    if (!items.length) {
      return res.status(400).json({ detail: "Order must contain at least one item" });
    }
    const order = {
      id: randomUUID(),
      table_number,
      items,
      total: calcTotal(items),
      status: "ordered",
      payment_method: null,
      start_time: nowIso(),
      finish_time: null,
    };
    await getDb().collection("orders").insertOne(order);
    delete order._id;
    res.json(order);
  })
);

// Get the active (status: ordered) order for a table (public).
router.get(
  "/active",
  asyncH(async (req, res) => {
    const table_number = parseInt(req.query.table_number, 10);
    if (!Number.isFinite(table_number)) {
      return res.status(400).json({ detail: "Invalid table_number" });
    }
    const doc = await getDb()
      .collection("orders")
      .findOne(
        { table_number, status: "ordered" },
        { projection: { _id: 0 } }
      );
    res.json(doc); // may be null
  })
);

// Admin: list all orders (filterable by status).
router.get(
  "/",
  requireAuth,
  asyncH(async (req, res) => {
    const q = {};
    if (req.query.status) q.status = req.query.status;
    const docs = await getDb()
      .collection("orders")
      .find(q, { projection: { _id: 0 } })
      .sort({ start_time: -1 })
      .limit(2000)
      .toArray();
    res.json(docs);
  })
);

// Order detail (public — needed for receipt after payment).
router.get(
  "/:id",
  asyncH(async (req, res) => {
    const doc = await getDb()
      .collection("orders")
      .findOne({ id: req.params.id }, { projection: { _id: 0 } });
    if (!doc) return res.status(404).json({ detail: "Order not found" });
    res.json(doc);
  })
);

// Append items to an existing ordered (unpaid) order.
router.post(
  "/:id/items",
  asyncH(async (req, res) => {
    const order = await getDb()
      .collection("orders")
      .findOne({ id: req.params.id }, { projection: { _id: 0 } });
    if (!order) return res.status(404).json({ detail: "Order not found" });
    if (order.status !== "ordered") {
      return res.status(400).json({ detail: "Cannot add items to a paid order" });
    }
    const newItems = await buildOrderItems(req.body.items);
    if (!newItems.length) {
      return res.status(400).json({ detail: "No valid items to add" });
    }
    const allItems = order.items.concat(newItems);
    const total = calcTotal(allItems);
    await getDb()
      .collection("orders")
      .updateOne({ id: req.params.id }, { $set: { items: allItems, total } });
    order.items = allItems;
    order.total = total;
    res.json(order);
  })
);

// Pay (mark as paid).
router.post(
  "/:id/pay",
  asyncH(async (req, res) => {
    const method = req.body.payment_method;
    if (!["cashier", "qris"].includes(method)) {
      return res.status(400).json({ detail: "Invalid payment method" });
    }
    const order = await getDb()
      .collection("orders")
      .findOne({ id: req.params.id }, { projection: { _id: 0 } });
    if (!order) return res.status(404).json({ detail: "Order not found" });
    if (order.status === "paid") {
      return res.status(400).json({ detail: "Order already paid" });
    }
    const update = {
      status: "paid",
      payment_method: method,
      finish_time: nowIso(),
    };
    await getDb().collection("orders").updateOne({ id: req.params.id }, { $set: update });
    Object.assign(order, update);
    res.json(order);
  })
);

module.exports = router;
