# Tsuki Restaurant — PRD

## Original Problem Statement
Build a restaurant reservation & menu management system for a restaurant in Japan (English UI for now).

**Required screens / flows:**
1. **Menu management** — display, edit, add, delete menu.
2. **Reservations** — per-table barcode → scan → display menu → add to cart → checkout (status: ordered) → can add more items → pay (status: payment). Pay options: at cashier or QRIS.
   - Important columns: table number, datetime start order, datetime finish, total, ordered menu.

## User Choices
- Auth: JWT-based custom auth (admin/staff).
- QR per table: scanning auto-fills the table number.
- Payment QRIS: mocked simulation.
- Currency: JPY (¥).
- Menu has categories (appetizer, main course, dessert, drinks).

## Personas
- **Admin / Staff** — manages menu, tables/QR codes, and reservations. Login required.
- **Customer (dine-in)** — scans the QR on their table, browses menu, orders, pays. No login.

## Architecture
- **Backend**: FastAPI + Motor (MongoDB). JWT (PyJWT) + bcrypt. Routes prefixed with `/api`.
  - Collections: `users`, `menu_items`, `tables`, `orders`.
- **Frontend**: React (CRA + craco), shadcn/ui + Tailwind, react-router, axios, sonner, qrcode.react, date-fns.
- **Auth**: `Authorization: Bearer <token>` in localStorage.
- **Customer URL**: `/menu?table=<n>` — table number is read from the QR.

## Implemented (2026-05-30)
- JWT login + auto-seeded admin (`admin@restaurant.jp` / `admin123`).
- Menu CRUD with categories, JPY pricing, image URL, availability.
- Table CRUD + per-table QR code generation (downloadable PNG, encodes the public menu URL).
- Public order lifecycle: create → add items → pay (cashier / QRIS mock) → status `paid`.
- Admin dashboard:
  - **Reservations**: stats cards (active orders, paid count, revenue) + orders table with detail dialog and pay-at-cashier / pay-via-qris actions. Auto-refresh every 10s.
  - **Menu Management**: filterable table, add/edit dialog, delete.
  - **Tables**: add/delete, QR dialog with download.
- Customer flow:
  - Hero with table greeting, sticky category nav, item cards with quantity controls.
  - Floating cart FAB → drawer → place order / add to existing order.
  - Active-order banner with "Pay Now" → payment dialog (cashier or QRIS) → mock QR modal with confirm → "Thank you" screen.
- Seeded sample data on first startup: 7 menu items, 6 tables.

## Tested
- 12/12 backend pytest cases pass (`/app/backend/tests/test_restaurant_api.py`).
- Frontend admin + customer flows verified by testing agent.

## Backlog
- **P1**: Replace static QRIS image with a real PSP (Midtrans/Stripe) when going to production.
- **P1**: Daily sales report / export CSV from Reservations.
- **P2**: Multi-language toggle (EN / JA).
- **P2**: Kitchen Display System view (live ordered tickets).
- **P2**: Per-item modifiers, allergens, photo upload (object storage).
- **P2**: Print QR sheet for all tables in one click.
- **P2**: Rate-limit + restrict CORS origins for production.
