// Centralised environment configuration.
require("dotenv").config();

const PORT = 8001;
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_ALGORITHM = "HS256";
const JWT_EXPIRES_IN = "12h";
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "admin@restaurant.jp").toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const MONGO_URL = process.env.MONGO_URL;
const DB_NAME = process.env.DB_NAME;
const CORS_ORIGINS = (process.env.CORS_ORIGINS || "*").split(",");

if (!JWT_SECRET || !MONGO_URL || !DB_NAME) {
  console.error("Missing required env vars (JWT_SECRET, MONGO_URL, DB_NAME)");
  process.exit(1);
}

module.exports = {
  PORT,
  JWT_SECRET,
  JWT_ALGORITHM,
  JWT_EXPIRES_IN,
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  MONGO_URL,
  DB_NAME,
  CORS_ORIGINS,
};
