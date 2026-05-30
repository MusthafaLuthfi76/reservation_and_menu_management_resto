"""Backend API tests for Tsuki Restaurant API.
Covers auth, menu, tables, and orders flows.
"""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # fallback to frontend .env
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip().rstrip("/")
                break

API = f"{BASE_URL}/api"
ADMIN_EMAIL = "admin@restaurant.jp"
ADMIN_PASSWORD = "admin123"


@pytest.fixture(scope="session")
def token():
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=30)
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text}"
    data = r.json()
    assert "access_token" in data and "user" in data
    assert data["user"]["email"] == ADMIN_EMAIL
    assert data["user"]["role"] == "admin"
    return data["access_token"]


@pytest.fixture
def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


# -------- Auth --------
def test_login_invalid():
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": "wrong"}, timeout=30)
    assert r.status_code == 401


def test_me_without_token():
    r = requests.get(f"{API}/auth/me", timeout=30)
    assert r.status_code in (401, 403)


def test_me_with_token(auth_headers):
    r = requests.get(f"{API}/auth/me", headers=auth_headers, timeout=30)
    assert r.status_code == 200
    data = r.json()
    assert data["email"] == ADMIN_EMAIL
    assert data["role"] == "admin"


# -------- Menu --------
def test_menu_public_list():
    r = requests.get(f"{API}/menu", timeout=30)
    assert r.status_code == 200
    items = r.json()
    assert isinstance(items, list)
    assert len(items) >= 7
    cats = {i["category"] for i in items}
    assert {"appetizer", "main", "dessert", "drinks"}.issubset(cats)


def test_menu_crud_requires_auth():
    r = requests.post(f"{API}/menu", json={"name": "X", "price": 100, "category": "drinks"}, timeout=30)
    assert r.status_code in (401, 403)


def test_menu_crud_flow(auth_headers):
    payload = {"name": "TEST_Mochi", "description": "test", "price": 999, "category": "dessert", "image_url": "", "available": True}
    r = requests.post(f"{API}/menu", json=payload, headers=auth_headers, timeout=30)
    assert r.status_code == 200, r.text
    item = r.json()
    assert item["name"] == "TEST_Mochi"
    assert item["price"] == 999
    item_id = item["id"]

    # update
    upd = {**payload, "price": 1100, "name": "TEST_Mochi2"}
    r = requests.put(f"{API}/menu/{item_id}", json=upd, headers=auth_headers, timeout=30)
    assert r.status_code == 200
    assert r.json()["price"] == 1100
    assert r.json()["name"] == "TEST_Mochi2"

    # verify persisted via public GET
    r = requests.get(f"{API}/menu", timeout=30)
    assert any(i["id"] == item_id and i["price"] == 1100 for i in r.json())

    # delete
    r = requests.delete(f"{API}/menu/{item_id}", headers=auth_headers, timeout=30)
    assert r.status_code == 200

    r = requests.delete(f"{API}/menu/{item_id}", headers=auth_headers, timeout=30)
    assert r.status_code == 404


# -------- Tables --------
def test_tables_require_auth():
    r = requests.get(f"{API}/tables", timeout=30)
    assert r.status_code in (401, 403)


def test_tables_list_and_crud(auth_headers):
    r = requests.get(f"{API}/tables", headers=auth_headers, timeout=30)
    assert r.status_code == 200
    tables = r.json()
    assert len(tables) >= 6

    new_num = 9000 + (uuid.uuid4().int % 1000)
    r = requests.post(f"{API}/tables", json={"table_number": new_num, "label": "TEST"}, headers=auth_headers, timeout=30)
    assert r.status_code == 200, r.text
    tid = r.json()["id"]

    # duplicate
    r = requests.post(f"{API}/tables", json={"table_number": new_num, "label": "DUP"}, headers=auth_headers, timeout=30)
    assert r.status_code == 400

    # delete
    r = requests.delete(f"{API}/tables/{tid}", headers=auth_headers, timeout=30)
    assert r.status_code == 200


# -------- Orders --------
def _first_two_menu_items():
    items = requests.get(f"{API}/menu", timeout=30).json()
    return items[0], items[1]


def test_order_flow_cashier(auth_headers):
    a, b = _first_two_menu_items()
    table_num = 1
    r = requests.post(f"{API}/orders", json={
        "table_number": table_num,
        "items": [{"menu_item_id": a["id"], "quantity": 2}, {"menu_item_id": b["id"], "quantity": 1}]
    }, timeout=30)
    assert r.status_code == 200, r.text
    order = r.json()
    assert order["status"] == "ordered"
    expected_total = a["price"] * 2 + b["price"] * 1
    assert order["total"] == expected_total
    order_id = order["id"]

    # active
    r = requests.get(f"{API}/orders/active", params={"table_number": table_num}, timeout=30)
    assert r.status_code == 200
    active = r.json()
    assert active is not None
    assert active["id"] == order_id

    # add items
    r = requests.post(f"{API}/orders/{order_id}/items", json={
        "items": [{"menu_item_id": a["id"], "quantity": 1}]
    }, timeout=30)
    assert r.status_code == 200
    assert r.json()["total"] == expected_total + a["price"]

    # list with status
    r = requests.get(f"{API}/orders", params={"status": "ordered"}, headers=auth_headers, timeout=30)
    assert r.status_code == 200
    assert any(o["id"] == order_id for o in r.json())

    # pay cashier
    r = requests.post(f"{API}/orders/{order_id}/pay", json={"payment_method": "cashier"}, timeout=30)
    assert r.status_code == 200
    paid = r.json()
    assert paid["status"] == "paid"
    assert paid["payment_method"] == "cashier"
    assert paid["finish_time"] is not None

    # double pay
    r = requests.post(f"{API}/orders/{order_id}/pay", json={"payment_method": "cashier"}, timeout=30)
    assert r.status_code == 400


def test_order_pay_qris():
    a, _ = _first_two_menu_items()
    r = requests.post(f"{API}/orders", json={
        "table_number": 2,
        "items": [{"menu_item_id": a["id"], "quantity": 1}]
    }, timeout=30)
    assert r.status_code == 200
    oid = r.json()["id"]
    r = requests.post(f"{API}/orders/{oid}/pay", json={"payment_method": "qris"}, timeout=30)
    assert r.status_code == 200
    assert r.json()["status"] == "paid"
    assert r.json()["payment_method"] == "qris"


def test_order_invalid_item():
    r = requests.post(f"{API}/orders", json={
        "table_number": 3,
        "items": [{"menu_item_id": "nonexistent", "quantity": 1}]
    }, timeout=30)
    assert r.status_code == 400


def test_orders_list_requires_auth():
    r = requests.get(f"{API}/orders", timeout=30)
    assert r.status_code in (401, 403)
