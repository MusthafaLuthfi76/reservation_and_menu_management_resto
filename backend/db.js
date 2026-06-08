// MongoDB connection: connect once, share `db` across all modules.
const { MongoClient } = require("mongodb");
const { MONGO_URL, DB_NAME } = require("./config");

const client = new MongoClient(MONGO_URL);
let db = null;

async function connect() {
  if (db) return db;
  await client.connect();
  db = client.db(DB_NAME);
  console.log(`Connected to MongoDB ${DB_NAME}`);
  return db;
}

function getDb() {
  if (!db) throw new Error("Database not connected. Call connect() first.");
  return db;
}

async function close() {
  try {
    await client.close();
  } catch (_) {
    // ignore
  }
}

module.exports = { connect, getDb, close };
