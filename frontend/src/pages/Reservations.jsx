import React, { useEffect, useState } from "react";
import api, { formatJPY } from "../lib/api";
import { Button } from "../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { format } from "date-fns";
import { toast } from "sonner";
import { Receipt } from "lucide-react";

export default function Reservations() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);

  const load = async () => {
    const { data } = await api.get("/orders");
    setOrders(data);
  };
  useEffect(() => {
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, []);

  const markStatus = async (order, status, paymentMethod) => {
    try {
      await api.patch(`/orders/${order.id}/status`, {
        status,
        payment_method: paymentMethod,
      });
      toast.success(`Order marked ${status}`);
      setSelected(null);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to update order status");
    }
  };

  const filtered = filter === "all"
    ? orders
    : orders.filter((o) => (filter === "unpaid" ? ["unpaid", "ordered"].includes(o.status) : o.status === filter));

  const activeCount = orders.filter((o) => o.status === "unpaid" || o.status === "ordered").length;
  const paidCount = orders.filter((o) => o.status === "paid").length;
  const completeCount = orders.filter((o) => o.status === "complete").length;
  const todaysRevenue = orders
    .filter((o) => ["paid", "complete"].includes(o.status))
    .reduce((s, o) => s + (o.total || 0), 0);

  return (
    <div className="p-4 md:p-8 lg:p-12 fade-up" data-testid="reservations-page">
      <div className="mb-8 md:mb-10">
        <div className="label-eyebrow mb-3">Service Floor</div>
        <h1 className="font-serif-jp text-3xl md:text-4xl lg:text-5xl">Reservations</h1>
        <p className="text-sm text-[#8A817C] mt-2">Active orders, totals, and payment status — at a glance.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-8 md:mb-10">
        <StatCard label="Active Orders" value={activeCount} testId="stat-active" />
        <StatCard label="Paid Today" value={paidCount} testId="stat-paid" />
        <div className="col-span-2 md:col-span-1">
          <StatCard label="Revenue" value={formatJPY(todaysRevenue)} testId="stat-revenue" mono />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-8 md:mb-10">
        <StatCard label="Unpaid Queue" value={activeCount} testId="stat-unpaid" />
        <StatCard label="Paid" value={paidCount} testId="stat-paid-count" />
        <StatCard label="Complete" value={completeCount} testId="stat-complete" />
      </div>

      <div className="flex gap-2 mb-6">
        {[
          { v: "all", l: "All" },
          { v: "unpaid", l: "Unpaid" },
          { v: "paid", l: "Paid" },
          { v: "complete", l: "Complete" },
        ].map((b) => (
          <button
            key={b.v}
            onClick={() => setFilter(b.v)}
            data-testid={`orders-filter-${b.v}`}
            className={`px-4 py-2 text-xs tracking-wider uppercase border rounded-sm transition-colors ${
              filter === b.v
                ? "bg-[#1C1C1C] text-white border-[#1C1C1C]"
                : "bg-white text-[#1C1C1C] border-[#E5E0D8] hover:border-[#1C1C1C]"
            }`}
          >
            {b.l}
          </button>
        ))}
      </div>

      <div className="hidden md:block bg-white border border-[#E5E0D8] rounded-sm overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="border-b border-[#E5E0D8] text-left">
              <th className="px-6 py-4 label-eyebrow">Table</th>
              <th className="px-6 py-4 label-eyebrow">Started</th>
              <th className="px-6 py-4 label-eyebrow">Finished</th>
              <th className="px-6 py-4 label-eyebrow">Items</th>
              <th className="px-6 py-4 label-eyebrow">Total</th>
              <th className="px-6 py-4 label-eyebrow">Status</th>
              <th className="px-6 py-4 label-eyebrow text-right">Detail</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-6 py-12 text-center text-sm text-[#8A817C]">No orders.</td></tr>
            )}
            {filtered.map((o) => (
              <tr key={o.id} className="border-b border-[#E5E0D8] last:border-0" data-testid={`order-row-${o.id}`}>
                <td className="px-6 py-4 font-serif-jp text-xl">#{o.table_number}</td>
                <td className="px-6 py-4 text-sm">{format(new Date(o.start_time), "MMM d, HH:mm")}</td>
                <td className="px-6 py-4 text-sm text-[#8A817C]">
                  {o.finish_time ? format(new Date(o.finish_time), "MMM d, HH:mm") : "—"}
                </td>
                <td className="px-6 py-4 text-sm">
                  {o.items.reduce((s, i) => s + i.quantity, 0)} item(s)
                </td>
                <td className="px-6 py-4 font-serif-jp text-lg">{formatJPY(o.total)}</td>
                <td className="px-6 py-4">
                  <StatusBadge status={o.status} />
                </td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => setSelected(o)} data-testid={`order-detail-${o.id}`}
                    className="inline-flex items-center gap-1 text-xs text-[#5C4033] hover:text-[#C93A3E]">
                    <Receipt size={14} /> View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile order cards */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 && (
          <div className="bg-white border border-[#E5E0D8] rounded-sm p-8 text-center text-sm text-[#8A817C]">No orders.</div>
        )}
        {filtered.map((o) => (
          <button
            key={o.id}
            onClick={() => setSelected(o)}
            data-testid={`order-card-${o.id}`}
            className="w-full text-left bg-white border border-[#E5E0D8] rounded-sm p-4 hover:border-[#1C1C1C] transition-colors"
          >
            <div className="flex justify-between items-start gap-3">
              <div>
                <div className="font-serif-jp text-2xl leading-none">#{o.table_number}</div>
                <div className="text-xs text-[#8A817C] mt-1">{format(new Date(o.start_time), "MMM d, HH:mm")}</div>
              </div>
              <StatusBadge status={o.status} />
            </div>
            <div className="mt-3 flex justify-between items-baseline">
              <div className="text-xs text-[#5C4033]">{o.items.reduce((s, i) => s + i.quantity, 0)} item(s)</div>
              <div className="font-serif-jp text-xl">{formatJPY(o.total)}</div>
            </div>
          </button>
        ))}
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="rounded-sm max-w-lg" data-testid="order-detail-dialog">
          <DialogHeader>
            <DialogTitle className="font-serif-jp text-2xl">
              Table #{selected?.table_number}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="label-eyebrow mb-1">Started</div>
                  <div>{format(new Date(selected.start_time), "PPp")}</div>
                </div>
                <div>
                  <div className="label-eyebrow mb-1">Status</div>
                  <StatusBadge status={selected.status} />
                </div>
              </div>
              <div className="divider-sumi" />
              <div>
                <div className="label-eyebrow mb-3">Items</div>
                <div className="space-y-2">
                  {selected.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <div>
                        <span className="font-medium">{it.quantity}×</span> {it.name}
                        {it.note && <span className="text-[#8A817C] ml-2">({it.note})</span>}
                      </div>
                      <div className="font-serif-jp">{formatJPY(it.price * it.quantity)}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="divider-sumi" />
              <div className="flex justify-between items-baseline">
                <div className="label-eyebrow">Total</div>
                <div className="font-serif-jp text-3xl">{formatJPY(selected.total)}</div>
              </div>

              {selected.status === "unpaid" || selected.status === "ordered" ? (
                <div className="flex gap-2 pt-4">
                  <Button onClick={() => markStatus(selected, "paid", "verified")} variant="outline"
                    className="flex-1 rounded-sm h-11" data-testid="admin-pay-cashier">
                    Verify Paid
                  </Button>
                </div>
              ) : null}
              {selected.status === "paid" && (
                <div className="flex gap-2 pt-4">
                  <Button onClick={() => markStatus(selected, "complete")} className="btn-aka flex-1 rounded-sm h-11" data-testid="admin-complete">
                    Mark Complete
                  </Button>
                </div>
              )}
              {selected.status === "complete" && (
                <div className="text-xs text-[#8A817C]">
                  Order completed.
                </div>
              )}
              {selected.status === "paid" && selected.payment_method && (
                <div className="text-xs text-[#8A817C]">
                  {selected.payment_method === "verified" ? "Verified by staff." : `Paid via ${selected.payment_method}.`}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({ label, value, mono, testId }) {
  return (
    <div className="bg-white border border-[#E5E0D8] rounded-sm p-4 md:p-6" data-testid={testId}>
      <div className="label-eyebrow mb-2 md:mb-3">{label}</div>
      <div className={`${mono ? "font-serif-jp text-2xl md:text-3xl" : "font-serif-jp text-3xl md:text-4xl"}`}>{value}</div>
    </div>
  );
}

function StatusBadge({ status }) {
  const normalized = status === "ordered" ? "unpaid" : status;
  const isPaid = normalized === "paid";
  const isComplete = normalized === "complete";
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
      isComplete
        ? "bg-[#EEF2F7] text-[#425466]"
        : isPaid
          ? "bg-[#F2F4EC] text-[#54662C]"
          : "bg-[#FDF6E3] text-[#8B5A2B]"
    }`}>
      {isComplete ? "Complete" : isPaid ? "Paid" : "Unpaid"}
    </span>
  );
}
