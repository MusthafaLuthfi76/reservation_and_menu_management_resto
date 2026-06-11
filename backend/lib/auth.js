// Auth helpers: password hashing, JWT, middleware, async wrapper.
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { getDb } = require("../db");
const { JWT_SECRET, JWT_ALGORITHM, JWT_EXPIRES_IN } = require("../config");

const hashPassword = (pw) => bcrypt.hashSync(pw, 10);
const verifyPassword = (pw, hash) => bcrypt.compareSync(pw, hash);

const createAccessToken = (userId, email) =>
  jwt.sign(
    { sub: userId, email, type: "access" },
    JWT_SECRET,
    { algorithm: JWT_ALGORITHM, expiresIn: JWT_EXPIRES_IN }
  );

async function requireAuth(req, res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ detail: "Not authenticated" });
  try {
    const payload = jwt.verify(token, JWT_SECRET, { algorithms: [JWT_ALGORITHM] });
    if (payload.type !== "access") {
      return res.status(401).json({ detail: "Invalid token type" });
    }
    const user = await getDb()
      .collection("users")
      .findOne({ id: payload.sub }, { projection: { _id: 0, password_hash: 0 } });
    if (!user) return res.status(401).json({ detail: "User not found" });
    req.user = user;
    next();
  } catch (err) {
    const msg = err.name === "TokenExpiredError" ? "Token expired" : "Invalid token";
    return res.status(401).json({ detail: msg });
  }
}

// Wrap async route handlers so thrown errors hit the central error handler.
const asyncH = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = {
  hashPassword,
  verifyPassword,
  createAccessToken,
  requireAuth,
  asyncH,
};
