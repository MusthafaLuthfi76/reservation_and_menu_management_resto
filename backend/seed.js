// Seed admin user + sample menu items + sample tables on first startup.
const { randomUUID } = require("crypto");
const { getDb } = require("./db");
const { hashPassword, verifyPassword } = require("./lib/auth");
const { nowIso } = require("./lib/orders");
const { ADMIN_EMAIL, ADMIN_PASSWORD } = require("./config");

const SAMPLE_MENU = [
  {
    name: "Edamame",
    description: "Lightly salted young soybeans",
    price: 480,
    category: "appetizer",
    image_url: "https://images.unsplash.com/photo-1564834744159-ff0ea41ba4b9?w=600",
  },
  {
    name: "Salmon Sashimi",
    description: "Five slices of premium Norwegian salmon",
    price: 1380,
    category: "appetizer",
    image_url:
      "https://static.prod-images.emergentagent.com/jobs/2f57949b-850e-45f2-821a-37f7619e4a5c/images/08b1c802122f6e0809bc06e2d5ba2e6225c1e179ad73930617443be2312b8472.png",
  },
  {
    name: "Tonkotsu Ramen",
    description: "Rich pork broth, chashu, ajitsuke tamago",
    price: 1480,
    category: "main",
    image_url:
      "https://static.prod-images.emergentagent.com/jobs/2f57949b-850e-45f2-821a-37f7619e4a5c/images/6c3776b3b50b83103f50895f117fbee0b15aa9ba1a50c415ec68b46aca032f50.png",
  },
  {
    name: "Chirashi Don",
    description: "Assorted sashimi over seasoned sushi rice",
    price: 2280,
    category: "main",
    image_url: "https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=600",
  },
  {
    name: "Matcha Warabimochi",
    description: "Soft mochi dusted with stone-ground matcha",
    price: 780,
    category: "dessert",
    image_url:
      "https://static.prod-images.emergentagent.com/jobs/2f57949b-850e-45f2-821a-37f7619e4a5c/images/0f18be09166263812115f697911d5728030f1f39334d1f13c34ee3f2f6fc0190.png",
  },
  {
    name: "Hojicha Latte",
    description: "Roasted green tea with steamed milk",
    price: 580,
    category: "drinks",
    image_url: "https://images.unsplash.com/photo-1545578474-9a93f4d44a92?w=600",
  },
  {
    name: "Sapporo Draft",
    description: "Crisp Japanese lager, 330ml",
    price: 680,
    category: "drinks",
    image_url: "https://images.unsplash.com/photo-1608270586620-248524c67de9?w=600",
  },
];

const SAMPLE_TABLE_COUNT = 6;

async function ensureIndexes(db) {
  await db.collection("users").createIndex({ email: 1 }, { unique: true });
  await db.collection("tables").createIndex({ table_number: 1 }, { unique: true });
  await db.collection("menu_items").createIndex({ category: 1 });
  await db.collection("orders").createIndex({ table_number: 1, status: 1 });
}

async function seedAdmin(db) {
  const existing = await db.collection("users").findOne({ email: ADMIN_EMAIL });
  if (!existing) {
    await db.collection("users").insertOne({
      id: randomUUID(),
      email: ADMIN_EMAIL,
      password_hash: hashPassword(ADMIN_PASSWORD),
      name: "Restaurant Admin",
      role: "admin",
      created_at: nowIso(),
    });
    console.log(`Seeded admin user ${ADMIN_EMAIL}`);
  } else if (!verifyPassword(ADMIN_PASSWORD, existing.password_hash)) {
    await db
      .collection("users")
      .updateOne(
        { email: ADMIN_EMAIL },
        { $set: { password_hash: hashPassword(ADMIN_PASSWORD) } }
      );
  }
}

async function seedMenu(db) {
  if ((await db.collection("menu_items").countDocuments()) === 0) {
    for (const s of SAMPLE_MENU) {
      await db.collection("menu_items").insertOne({
        id: randomUUID(),
        available: true,
        created_at: nowIso(),
        ...s,
      });
    }
    console.log("Seeded sample menu items");
  }
}

async function seedTables(db) {
  if ((await db.collection("tables").countDocuments()) === 0) {
    for (let n = 1; n <= SAMPLE_TABLE_COUNT; n++) {
      await db.collection("tables").insertOne({
        id: randomUUID(),
        table_number: n,
        label: `Table ${n}`,
      });
    }
    console.log("Seeded sample tables");
  }
}

async function runSeed() {
  const db = getDb();
  await ensureIndexes(db);
  await seedAdmin(db);
  await seedMenu(db);
  await seedTables(db);
}

module.exports = { runSeed };
