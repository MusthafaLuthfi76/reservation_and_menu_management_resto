from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import uuid
import logging
from datetime import datetime, timezone, timedelta
from typing import List, Optional

import bcrypt
import jwt
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, ConfigDict, EmailStr


# ---------- Setup ----------
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGORITHM = "HS256"

app = FastAPI(title="Tsuki Restaurant API")
api_router = APIRouter(prefix="/api")
bearer_scheme = HTTPBearer(auto_error=False)


# ---------- Helpers ----------
def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=12),
        "type": "access",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


async def get_current_user(
    request: Request,
    creds: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> dict:
    token = None
    if creds:
        token = creds.credentials
    else:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# ---------- Models ----------
class LoginInput(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    email: str
    name: str
    role: str


class MenuItemIn(BaseModel):
    name: str
    description: str = ""
    price: int  # JPY - integer
    category: str  # appetizer | main | dessert | drinks
    image_url: str = ""
    available: bool = True


class MenuItem(MenuItemIn):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: str = Field(default_factory=now_iso)


class TableIn(BaseModel):
    table_number: int
    label: str = ""


class TableOut(TableIn):
    id: str


class OrderItemIn(BaseModel):
    menu_item_id: str
    quantity: int = 1
    note: str = ""


class OrderItem(BaseModel):
    menu_item_id: str
    name: str
    price: int
    quantity: int
    note: str = ""
    added_at: str = Field(default_factory=now_iso)


class CreateOrderInput(BaseModel):
    table_number: int
    items: List[OrderItemIn]


class AddItemsInput(BaseModel):
    items: List[OrderItemIn]


class PayInput(BaseModel):
    payment_method: str  # cashier | qris


# ---------- Auth ----------
@api_router.post("/auth/login")
async def login(payload: LoginInput):
    email = payload.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(user["id"], user["email"])
    return {
        "access_token": token,
        "user": {"id": user["id"], "email": user["email"], "name": user["name"], "role": user["role"]},
    }


@api_router.get("/auth/me", response_model=UserOut)
async def me(current=Depends(get_current_user)):
    return current


# ---------- Menu ----------
@api_router.get("/menu", response_model=List[MenuItem])
async def list_menu():
    docs = await db.menu_items.find({}, {"_id": 0}).sort("created_at", 1).to_list(1000)
    return docs


@api_router.post("/menu", response_model=MenuItem)
async def create_menu(item: MenuItemIn, _=Depends(get_current_user)):
    obj = MenuItem(**item.model_dump())
    await db.menu_items.insert_one(obj.model_dump())
    return obj


@api_router.put("/menu/{item_id}", response_model=MenuItem)
async def update_menu(item_id: str, item: MenuItemIn, _=Depends(get_current_user)):
    res = await db.menu_items.update_one({"id": item_id}, {"$set": item.model_dump()})
    if res.matched_count == 0:
        raise HTTPException(404, "Menu item not found")
    doc = await db.menu_items.find_one({"id": item_id}, {"_id": 0})
    return doc


@api_router.delete("/menu/{item_id}")
async def delete_menu(item_id: str, _=Depends(get_current_user)):
    res = await db.menu_items.delete_one({"id": item_id})
    if res.deleted_count == 0:
        raise HTTPException(404, "Menu item not found")
    return {"ok": True}


# ---------- Tables ----------
@api_router.get("/tables", response_model=List[TableOut])
async def list_tables(_=Depends(get_current_user)):
    docs = await db.tables.find({}, {"_id": 0}).sort("table_number", 1).to_list(1000)
    return docs


@api_router.post("/tables", response_model=TableOut)
async def create_table(payload: TableIn, _=Depends(get_current_user)):
    existing = await db.tables.find_one({"table_number": payload.table_number})
    if existing:
        raise HTTPException(400, "Table number already exists")
    doc = {"id": str(uuid.uuid4()), **payload.model_dump()}
    await db.tables.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api_router.delete("/tables/{table_id}")
async def delete_table(table_id: str, _=Depends(get_current_user)):
    res = await db.tables.delete_one({"id": table_id})
    if res.deleted_count == 0:
        raise HTTPException(404, "Table not found")
    return {"ok": True}


# ---------- Orders ----------
async def _build_order_items(items: List[OrderItemIn]) -> List[dict]:
    result = []
    for it in items:
        if it.quantity <= 0:
            continue
        menu = await db.menu_items.find_one({"id": it.menu_item_id}, {"_id": 0})
        if not menu:
            raise HTTPException(400, f"Menu item not found: {it.menu_item_id}")
        result.append(
            OrderItem(
                menu_item_id=menu["id"],
                name=menu["name"],
                price=menu["price"],
                quantity=it.quantity,
                note=it.note,
            ).model_dump()
        )
    return result


def _calc_total(items: List[dict]) -> int:
    return sum(i["price"] * i["quantity"] for i in items)


@api_router.post("/orders")
async def create_order(payload: CreateOrderInput):
    items = await _build_order_items(payload.items)
    if not items:
        raise HTTPException(400, "Order must contain at least one item")
    order = {
        "id": str(uuid.uuid4()),
        "table_number": payload.table_number,
        "items": items,
        "total": _calc_total(items),
        "status": "ordered",
        "payment_method": None,
        "start_time": now_iso(),
        "finish_time": None,
    }
    await db.orders.insert_one(order)
    order.pop("_id", None)
    return order


@api_router.get("/orders/active")
async def get_active_order(table_number: int):
    doc = await db.orders.find_one(
        {"table_number": table_number, "status": "ordered"}, {"_id": 0}
    )
    return doc  # may be null


@api_router.get("/orders")
async def list_orders(status: Optional[str] = None, _=Depends(get_current_user)):
    q = {}
    if status:
        q["status"] = status
    docs = await db.orders.find(q, {"_id": 0}).sort("start_time", -1).to_list(2000)
    return docs


@api_router.get("/orders/{order_id}")
async def get_order(order_id: str):
    doc = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Order not found")
    return doc


@api_router.post("/orders/{order_id}/items")
async def add_items_to_order(order_id: str, payload: AddItemsInput):
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(404, "Order not found")
    if order["status"] != "ordered":
        raise HTTPException(400, "Cannot add items to a paid order")
    new_items = await _build_order_items(payload.items)
    if not new_items:
        raise HTTPException(400, "No valid items to add")
    all_items = order["items"] + new_items
    total = _calc_total(all_items)
    await db.orders.update_one({"id": order_id}, {"$set": {"items": all_items, "total": total}})
    order["items"] = all_items
    order["total"] = total
    return order


@api_router.post("/orders/{order_id}/pay")
async def pay_order(order_id: str, payload: PayInput):
    if payload.payment_method not in ("cashier", "qris"):
        raise HTTPException(400, "Invalid payment method")
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(404, "Order not found")
    if order["status"] == "paid":
        raise HTTPException(400, "Order already paid")
    update = {
        "status": "paid",
        "payment_method": payload.payment_method,
        "finish_time": now_iso(),
    }
    await db.orders.update_one({"id": order_id}, {"$set": update})
    order.update(update)
    return order


# ---------- Health ----------
@api_router.get("/")
async def root():
    return {"message": "Tsuki Restaurant API"}


# ---------- Mount + CORS ----------
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


# ---------- Startup: seed admin, indexes, and demo menu ----------
@app.on_event("startup")
async def on_startup():
    await db.users.create_index("email", unique=True)
    await db.tables.create_index("table_number", unique=True)
    await db.menu_items.create_index("category")
    await db.orders.create_index([("table_number", 1), ("status", 1)])

    admin_email = os.environ.get("ADMIN_EMAIL", "admin@restaurant.jp").lower()
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "email": admin_email,
            "password_hash": hash_password(admin_password),
            "name": "Restaurant Admin",
            "role": "admin",
            "created_at": now_iso(),
        })
        logger.info(f"Seeded admin user {admin_email}")
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one(
            {"email": admin_email}, {"$set": {"password_hash": hash_password(admin_password)}}
        )

    # Seed sample menu if empty
    if await db.menu_items.count_documents({}) == 0:
        samples = [
            {"name": "Edamame", "description": "Lightly salted young soybeans", "price": 480,
             "category": "appetizer",
             "image_url": "https://images.unsplash.com/photo-1564834744159-ff0ea41ba4b9?w=600"},
            {"name": "Salmon Sashimi", "description": "Five slices of premium Norwegian salmon",
             "price": 1380, "category": "appetizer",
             "image_url": "https://static.prod-images.emergentagent.com/jobs/2f57949b-850e-45f2-821a-37f7619e4a5c/images/08b1c802122f6e0809bc06e2d5ba2e6225c1e179ad73930617443be2312b8472.png"},
            {"name": "Tonkotsu Ramen", "description": "Rich pork broth, chashu, ajitsuke tamago",
             "price": 1480, "category": "main",
             "image_url": "https://static.prod-images.emergentagent.com/jobs/2f57949b-850e-45f2-821a-37f7619e4a5c/images/6c3776b3b50b83103f50895f117fbee0b15aa9ba1a50c415ec68b46aca032f50.png"},
            {"name": "Chirashi Don", "description": "Assorted sashimi over seasoned sushi rice",
             "price": 2280, "category": "main",
             "image_url": "https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=600"},
            {"name": "Matcha Warabimochi", "description": "Soft mochi dusted with stone-ground matcha",
             "price": 780, "category": "dessert",
             "image_url": "https://static.prod-images.emergentagent.com/jobs/2f57949b-850e-45f2-821a-37f7619e4a5c/images/0f18be09166263812115f697911d5728030f1f39334d1f13c34ee3f2f6fc0190.png"},
            {"name": "Hojicha Latte", "description": "Roasted green tea with steamed milk",
             "price": 580, "category": "drinks",
             "image_url": "https://images.unsplash.com/photo-1545578474-9a93f4d44a92?w=600"},
            {"name": "Sapporo Draft", "description": "Crisp Japanese lager, 330ml",
             "price": 680, "category": "drinks",
             "image_url": "https://images.unsplash.com/photo-1608270586620-248524c67de9?w=600"},
        ]
        for s in samples:
            obj = MenuItem(**s)
            await db.menu_items.insert_one(obj.model_dump())
        logger.info("Seeded sample menu items")

    # Seed sample tables 1..6
    if await db.tables.count_documents({}) == 0:
        for n in range(1, 7):
            await db.tables.insert_one({
                "id": str(uuid.uuid4()),
                "table_number": n,
                "label": f"Table {n}",
            })
        logger.info("Seeded sample tables")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
