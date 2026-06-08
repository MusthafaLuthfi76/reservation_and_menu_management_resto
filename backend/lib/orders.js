// Order helpers: look up menu items + compute totals.
const { getDb } = require("../db");

const nowIso = () => new Date().toISOString();

async function buildOrderItems(items) {
  const result = [];
  for (const it of items || []) {
    const qty = parseInt(it.quantity, 10) || 0;
    if (qty <= 0) continue;
    const menu = await getDb()
      .collection("menu_items")
      .findOne({ id: it.menu_item_id }, { projection: { _id: 0 } });
    if (!menu) {
      const e = new Error(`Menu item not found: ${it.menu_item_id}`);
      e.status = 400;
      throw e;
    }
    result.push({
      menu_item_id: menu.id,
      name: menu.name,
      price: menu.price,
      quantity: qty,
      note: it.note || "",
      added_at: nowIso(),
    });
  }
  return result;
}

const calcTotal = (items) => items.reduce((s, i) => s + i.price * i.quantity, 0);

module.exports = { buildOrderItems, calcTotal, nowIso };
