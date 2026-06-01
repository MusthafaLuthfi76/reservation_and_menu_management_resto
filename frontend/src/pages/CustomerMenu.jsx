import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api, { formatJPY } from "../lib/api";
import { Button } from "../components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { toast } from "sonner";
import { Plus, Minus, ShoppingBag, X, ArrowLeft } from "lucide-react";



export default function CustomerMenu() {
  const [params] = useSearchParams();
  const tableNumber = parseInt(params.get("table") || "0", 10);
  const nav = useNavigate();

  const [menu, setMenu] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cart, setCart] = useState({}); // {menu_item_id: qty}
  const [activeOrder, setActiveOrder] = useState(null);
  const [activeCategory, setActiveCategory] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [qrisOpen, setQrisOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadAll = async () => {
    const [m, o, c] = await Promise.all([
      api.get("/menu"),
      api.get(`/orders/active`, { params: { table_number: tableNumber } }),
      api.get("/categories"),
    ]);
    setMenu(m.data.filter((i) => i.available !== false));
    setActiveOrder(o.data || null);
    const cats = c.data.map(cat => ({ value: cat.slug, label: cat.name }));
    setCategories(cats);
    if (cats.length > 0 && !activeCategory) setActiveCategory(cats[0].value);
  };

  useEffect(() => {
    if (tableNumber) loadAll();
  }, [tableNumber]);

  const grouped = useMemo(() => {
    const g = {};
    categories.forEach((c) => (g[c.value] = []));
    menu.forEach((i) => { if (g[i.category]) g[i.category].push(i); });
    return g;
  }, [menu, categories]);

  const cartItems = Object.entries(cart)
    .map(([id, qty]) => {
      const m = menu.find((x) => x.id === id);
      return m && qty > 0 ? { ...m, quantity: qty } : null;
    })
    .filter(Boolean);

  const cartTotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const cartCount = cartItems.reduce((s, i) => s + i.quantity, 0);

  const inc = (id) => setCart((c) => ({ ...c, [id]: (c[id] || 0) + 1 }));
  const dec = (id) => setCart((c) => {
    const next = { ...c, [id]: Math.max(0, (c[id] || 0) - 1) };
    if (next[id] === 0) delete next[id];
    return next;
  });

  const submitOrder = async () => {
    if (cartItems.length === 0) return;
    setSubmitting(true);
    const hadActiveOrder = !!activeOrder;
    try {
      const items = cartItems.map((i) => ({ menu_item_id: i.id, quantity: i.quantity }));
      if (activeOrder) {
        const { data } = await api.post(`/orders/${activeOrder.id}/items`, { items });
        setActiveOrder(data);
        toast.success("Items added to your order");
      } else {
        const { data } = await api.post(`/orders`, { table_number: tableNumber, items });
        setActiveOrder(data);
        toast.success("Order placed");
      }
      setCart({});
      setCartOpen(false);
      if (!hadActiveOrder) setPayOpen(true);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Order failed");
    } finally {
      setSubmitting(false);
    }
  };

  const choosePayment = async (method) => {
    if (method === "qris") {
      setQrisOpen(true);
      return;
    }
    await api.post(`/orders/${activeOrder.id}/pay`, { payment_method: "cashier" });
    toast.success("Please proceed to the cashier");
    setPayOpen(false);
    loadAll();
  };

  const confirmQris = async () => {
    await api.post(`/orders/${activeOrder.id}/pay`, { payment_method: "qris" });
    toast.success("Payment confirmed");
    setQrisOpen(false);
    setPayOpen(false);
    loadAll();
  };

  if (!tableNumber) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9F8F6] p-8" data-testid="no-table">
        <div className="max-w-sm text-center">
          <div className="label-eyebrow mb-3">月 Tsuki</div>
          <h1 className="font-serif-jp text-3xl mb-2">Welcome</h1>
          <p className="text-sm text-[#8A817C] mb-6">
            Please scan the QR code on your table to view the menu.
          </p>
        </div>
      </div>
    );
  }

  if (activeOrder && ["paid", "complete"].includes(activeOrder.status)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9F8F6] p-8" data-testid="paid-screen">
        <div className="max-w-sm text-center">
          <div className="label-eyebrow mb-3">Arigatou Gozaimasu</div>
          <h1 className="font-serif-jp text-4xl mb-3">Thank you.</h1>
          <p className="text-sm text-[#8A817C]">
            Your payment for Table #{tableNumber} has been received via {activeOrder.payment_method}.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F8F6] pb-32" data-testid="customer-menu-page">
      {/* Hero */}
      <div className="relative h-56 sm:h-64 md:h-80 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1512132411229-c30391241dd8?w=1600&q=80"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/60" />
        <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-10 text-white">
          <div className="label-eyebrow text-white/70 mb-2">月 · Tsuki Restaurant</div>
          <h1 className="font-serif-jp text-4xl md:text-5xl" data-testid="customer-table-title">
            Table #{tableNumber} · Irasshaimase
          </h1>
          <p className="text-white/80 text-sm mt-2 max-w-md">
            Browse the menu, build your order, and we will prepare it with care.
          </p>
        </div>
      </div>

      {/* Active order banner */}
      {activeOrder && (
        <div className="bg-[#FDF6E3] border-y border-[#E5E0D8] px-4 sm:px-6 py-3 flex items-center justify-between gap-3" data-testid="active-order-banner">
          <div className="text-xs sm:text-sm text-[#8B5A2B] min-w-0">
            <span className="font-semibold">Order in progress</span>
            <span className="hidden sm:inline"> · {activeOrder.items.reduce((s, i) => s + i.quantity, 0)} item(s)</span>
            <span> · {formatJPY(activeOrder.total)}</span>
          </div>
          <Button onClick={() => setPayOpen(true)} size="sm" className="btn-aka rounded-sm h-9 px-4 text-xs flex-shrink-0" data-testid="open-payment-button">
            Pay Now
          </Button>
        </div>
      )}

      {/* Category nav */}
      <div className="sticky top-0 z-20 bg-[#F9F8F6]/95 backdrop-blur border-b border-[#E5E0D8]">
        <div className="flex gap-1 overflow-x-auto no-scrollbar px-4 py-3">
          {categories.map((c) => (
            <button
              key={c.value}
              onClick={() => {
                setActiveCategory(c.value);
                document.getElementById(`cat-${c.value}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              data-testid={`category-${c.value}`}
              className={`whitespace-nowrap px-4 py-2 text-xs tracking-wider uppercase border-b-2 transition-colors ${
                activeCategory === c.value
                  ? "border-[#C93A3E] text-[#1C1C1C]"
                  : "border-transparent text-[#8A817C]"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Items */}
      <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-12">
        {categories.map((c) => (
          <section key={c.value} id={`cat-${c.value}`}>
            <div className="label-eyebrow mb-4">{c.label}</div>
            <div className="space-y-4">
              {grouped[c.value].length === 0 && (
                <div className="text-sm text-[#8A817C]">Nothing here yet.</div>
              )}
              {grouped[c.value].map((item) => (
                <div key={item.id} className="bg-white border border-[#E5E0D8] rounded-sm p-4 flex gap-4" data-testid={`menu-item-${item.id}`}>
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="w-24 h-24 md:w-28 md:h-28 object-cover rounded-sm flex-shrink-0" />
                  ) : (
                    <div className="w-24 h-24 md:w-28 md:h-28 bg-[#F2F0EC] rounded-sm flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline gap-3">
                      <h3 className="font-serif-jp text-xl md:text-2xl">{item.name}</h3>
                      <div className="font-serif-jp text-lg whitespace-nowrap">{formatJPY(item.price)}</div>
                    </div>
                    <p className="text-xs text-[#8A817C] mt-1 line-clamp-2">{item.description}</p>
                    <div className="mt-3 flex justify-end">
                      {cart[item.id] ? (
                        <div className="flex items-center gap-3 border border-[#E5E0D8] rounded-sm">
                          <button onClick={() => dec(item.id)} className="w-9 h-9 flex items-center justify-center hover:bg-[#F2F0EC]" data-testid={`dec-${item.id}`}><Minus size={14} /></button>
                          <span className="text-sm font-semibold w-6 text-center">{cart[item.id]}</span>
                          <button onClick={() => inc(item.id)} className="w-9 h-9 flex items-center justify-center hover:bg-[#F2F0EC]" data-testid={`inc-${item.id}`}><Plus size={14} /></button>
                        </div>
                      ) : (
                        <Button onClick={() => inc(item.id)} variant="outline"
                          className="rounded-sm h-9 px-4 text-xs border-[#1C1C1C] hover:bg-[#1C1C1C] hover:text-white"
                          data-testid={`add-to-cart-${item.id}`}>
                          Add
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Floating cart FAB */}
      {cartCount > 0 && (
        <button
          onClick={() => setCartOpen(true)}
          data-testid="cart-fab"
          className="fixed bottom-4 sm:bottom-6 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 btn-aka rounded-sm px-5 py-3 sm:px-6 sm:py-4 shadow-xl flex items-center justify-between sm:justify-start gap-4 z-30 max-w-md mx-auto"
        >
          <span className="flex items-center gap-2">
            <ShoppingBag size={18} />
            <span className="text-sm font-semibold">{cartCount} item(s)</span>
          </span>
          <span className="font-serif-jp text-xl">{formatJPY(cartTotal)}</span>
        </button>
      )}

      {/* Cart drawer */}
      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent side="bottom" className="rounded-t-sm max-h-[85vh] bg-[#F9F8F6]" data-testid="cart-drawer">
          <SheetHeader>
            <SheetTitle className="font-serif-jp text-2xl text-left">
              {activeOrder ? "Add to Order" : "Your Order"} · Table #{tableNumber}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-3 max-h-[50vh] overflow-y-auto">
            {cartItems.map((i) => (
              <div key={i.id} className="flex justify-between items-center bg-white border border-[#E5E0D8] p-3 rounded-sm">
                <div className="flex-1">
                  <div className="font-medium text-sm">{i.name}</div>
                  <div className="text-xs text-[#8A817C]">{formatJPY(i.price)} each</div>
                </div>
                <div className="flex items-center gap-2 border border-[#E5E0D8] rounded-sm">
                  <button onClick={() => dec(i.id)} className="w-8 h-8 flex items-center justify-center"><Minus size={14} /></button>
                  <span className="text-sm font-semibold w-6 text-center">{i.quantity}</span>
                  <button onClick={() => inc(i.id)} className="w-8 h-8 flex items-center justify-center"><Plus size={14} /></button>
                </div>
                <div className="font-serif-jp text-lg ml-4 w-20 text-right">{formatJPY(i.price * i.quantity)}</div>
              </div>
            ))}
          </div>
          <div className="divider-sumi my-4" />
          <div className="flex justify-between items-baseline mb-4">
            <div className="label-eyebrow">Subtotal</div>
            <div className="font-serif-jp text-3xl">{formatJPY(cartTotal)}</div>
          </div>
          <Button onClick={submitOrder} disabled={submitting || cartItems.length === 0}
            className="btn-aka w-full h-12 rounded-sm tracking-wide" data-testid="place-order-button">
            {submitting ? "Placing…" : activeOrder ? "Add to Order" : "Place Order"}
          </Button>
        </SheetContent>
      </Sheet>

      {/* Payment selection */}
      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent className="rounded-sm max-w-md" data-testid="payment-dialog">
          <DialogHeader>
            <DialogTitle className="font-serif-jp text-2xl">Settle the Bill</DialogTitle>
          </DialogHeader>
          {activeOrder && (
            <div className="space-y-4">
              <div className="bg-white border border-[#E5E0D8] rounded-sm p-4 space-y-2 max-h-60 overflow-y-auto">
                {activeOrder.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span>{it.quantity}× {it.name}</span>
                    <span className="font-serif-jp">{formatJPY(it.price * it.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-baseline">
                <div className="label-eyebrow">Total</div>
                <div className="font-serif-jp text-3xl">{formatJPY(activeOrder.total)}</div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Button variant="outline" onClick={() => choosePayment("cashier")}
                  className="rounded-sm h-12" data-testid="pay-cashier-button">
                  Pay at Cashier
                </Button>
                <Button onClick={() => choosePayment("qris")}
                  className="btn-aka rounded-sm h-12" data-testid="pay-qris-button">
                  Pay via QRIS
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* QRIS modal */}
      <Dialog open={qrisOpen} onOpenChange={setQrisOpen}>
        <DialogContent className="rounded-sm max-w-sm" data-testid="qris-dialog">
          <DialogHeader>
            <DialogTitle className="font-serif-jp text-2xl">QRIS Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-center">
            <p className="text-xs text-[#8A817C]">Scan this with any QRIS-enabled app to complete payment.</p>
            <div className="bg-white p-6 border border-[#E5E0D8] rounded-sm flex justify-center">
              <img
                src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=TSUKI-DEMO-QRIS"
                alt="QRIS"
                className="w-56 h-56"
              />
            </div>
            <div className="font-serif-jp text-2xl">{formatJPY(activeOrder?.total || 0)}</div>
            <Button onClick={confirmQris} className="btn-aka w-full h-11 rounded-sm" data-testid="qris-confirm-button">
              I have paid
            </Button>
            <p className="text-[10px] text-[#8A817C]">Demo simulation · no real transaction is processed.</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
