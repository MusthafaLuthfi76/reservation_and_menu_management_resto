// Auth routes: login + current user.
const express = require("express");
const { getDb } = require("../db");
const {
  verifyPassword,
  createAccessToken,
  requireAuth,
  asyncH,
} = require("../lib/auth");

const router = express.Router();

router.post(
  "/login",
  asyncH(async (req, res) => {
    const email = (req.body.email || "").toLowerCase().trim();
    const password = req.body.password || "";
    if (!email || !password) {
      return res.status(400).json({ detail: "Email and password are required" });
    }
    const user = await getDb().collection("users").findOne({ email });
    if (!user || !verifyPassword(password, user.password_hash)) {
      return res.status(401).json({ detail: "Invalid email or password" });
    }
    const token = createAccessToken(user.id, user.email);
    res.json({
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  })
);

router.get(
  "/me",
  requireAuth,
  asyncH(async (req, res) => {
    res.json(req.user);
  })
);

module.exports = router;
