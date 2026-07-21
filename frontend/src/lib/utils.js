import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const BASE62 = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
const OBFUSCATION_MASK = 0x5a3cn;
const RANDOM_OFFSET = 0x7f3d2c1b9a8e6d5c4b3an;
const TOKEN_LENGTH = 14;
const MOD = 62n ** BigInt(TOKEN_LENGTH);
const MULTIPLIER = 0x1f3d5b79e47c9a1bn;

function modInverse(a, m) {
  let [oldR, r] = [a, m];
  let [oldS, s] = [1n, 0n];
  while (r !== 0n) {
    const q = oldR / r;
    [oldR, r] = [r, oldR - q * r];
    [oldS, s] = [s, oldS - q * s];
  }
  return ((oldS % m) + m) % m;
}

const MULTIPLIER_INV = modInverse(MULTIPLIER, MOD);

function encodeBase62(num) {
  if (num < 0n) return "";
  let value = BigInt(num);
  let encoded = "";
  do {
    encoded = BASE62[Number(value % 62n)] + encoded;
    value /= 62n;
  } while (value > 0n);
  return encoded;
}

function decodeBase62(str) {
  if (!str) return NaN;
  return [...str].reduce((acc, ch) => acc * 62n + BigInt(BASE62.indexOf(ch)), 0n);
}

export function encodeTableId(tableNumber) {
  const n = BigInt(tableNumber);
  if (n < 0n) return "";
  const transformed = ((n ^ OBFUSCATION_MASK) * MULTIPLIER + RANDOM_OFFSET) % MOD;
  return encodeBase62(transformed).padStart(TOKEN_LENGTH, "0");
}

export function decodeTableId(value) {
  const decoded = decodeBase62(value);
  if (Number.isNaN(decoded)) return 0;
  const transformed = BigInt(decoded);
  const original = ((transformed - RANDOM_OFFSET + MOD) % MOD) * MULTIPLIER_INV % MOD;
  return Number(original ^ OBFUSCATION_MASK);
}
