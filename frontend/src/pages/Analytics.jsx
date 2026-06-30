import React, { useEffect, useMemo, useState } from "react";
import api, { formatJPY } from "../lib/api";
import { toast } from "sonner";
import {
  TrendingUp,
  Receipt,
  Wallet,
  CalendarClock,
  BarChart3,
} from "lucide-react";

const RANGE_OPTIONS = [
  { value: 7, label: "7 Days" },
  { value: 30, label: "30 Days" },
  { value: 90, label: "90 Days" },
];

const STATUS_LABEL = {
  unpaid: "Unpaid",
  ordered: "Unpaid",
  paid: "Paid",
  complete: "Complete",
};

const STATUS_COLOR = {
  unpaid: "bg-[#F3EBEB] text-[#8B4A4A]",
  ordered: "bg-[#F3EBEB] text-[#8B4A4A]",
  paid: "bg-[#F2F4EC] text-[#54662C]",
  complete: "bg-[#EFF1F5] text-[#3D4F66]",
};

function KpiCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="bg-white border border-[#E5E0D8] rounded-sm p-5 md:p-6">
      <div className="flex items-center justify-between mb-3">
        <div className="label-eyebrow">{label}</div>
        <Icon size={16} className="text-[#8A817C]" />
      </div>
      <div className="font-serif-jp text-2xl md:text-3xl">{value}</div>
      {sub && <div className="text-xs text-[#8A817C] mt-1">{sub}</div>}
    </div>
  );
}

function DailyBarChart({ daily }) {
  const max = Math.max(1, ...daily.map((d) => d.revenue));
  // Avoid an unreadable wall of bars when range is large — thin them out.
  const showLabelEvery = daily.length > 31 ? 7 : daily.length > 10 ? 3 : 1;

  return (
    <div className="bg-white border border-[#E5E0D8] rounded-sm p-5 md:p-6">
      <div className="label-eyebrow mb-6">Daily Revenue</div>
      <div className="flex items-end gap-1 h-48" data-testid="analytics-daily-chart">
        {daily.map((d, i) => {
          const h = Math.max(2, Math.round((d.revenue / max) * 100));
          return (
            <div key={d.date} className="flex-1 flex flex-col items-center justify-end h-full group relative">
              <div className="hidden group-hover:block absolute -top-9 z-10 bg-[#1C1C1C] text-white text-[10px] px-2 py-1 rounded-sm whitespace-nowrap">
                {d.date}: {formatJPY(d.revenue)}
              </div>
              <div
                className="w-full bg-[#C93A3E]/80 hover:bg-[#C93A3E] rounded-t-sm transition-colors"
                style={{ height: `${h}%` }}
              />
              {i % showLabelEvery === 0 && (
                <div className="text-[9px] text-[#8A817C] mt-2 whitespace-nowrap">
                  {new Date(d.date).toLocaleDateString("en-US", { day: "2-digit", month: "short" })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RankedBarList({ title, rows, valueKey, labelKey, formatValue, testIdPrefix }) {
  const max = Math.max(1, ...rows.map((r) => r[valueKey]));
  return (
    <div className="bg-white border border-[#E5E0D8] rounded-sm p-5 md:p-6">
      <div className="label-eyebrow mb-5">{title}</div>
      {rows.length === 0 && (
        <div className="text-sm text-[#8A817C] py-6 text-center">No data in this range.</div>
      )}
      <div className="space-y-4">
        {rows.map((r, idx) => (
          <div key={r[labelKey] + idx} data-testid={`${testIdPrefix}-${idx}`}>
            <div className="flex justify-between items-baseline mb-1.5 gap-3">
              <span className="text-sm capitalize truncate">{r[labelKey]}</span>
              <span className="text-xs text-[#8A817C] whitespace-nowrap">{formatValue(r[valueKey])}</span>
            </div>
            <div className="h-1.5 bg-[#F2F0EC] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#1C1C1C]/80 rounded-full"
                style={{ width: `${Math.max(3, Math.round((r[valueKey] / max) * 100))}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Analytics() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async (range) => {
    setLoading(true);
    try {
      const { data: res } = await api.get("/analytics/summary", { params: { days: range } });
      setData(res);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(days); }, [days]);

  const statusBreakdown = useMemo(() => data?.status_breakdown || [], [data]);

  return (
    <div className="p-4 md:p-8 lg:p-12 fade-up" data-testid="analytics-page">
      <div className="flex items-end justify-between flex-wrap gap-4 mb-8 md:mb-10">
        <div>
          <div className="label-eyebrow mb-3">Sales Analytics</div>
          <h1 className="font-serif-jp text-3xl md:text-4xl lg:text-5xl">Dashboard</h1>
          <p className="text-sm text-[#8A817C] mt-2">Revenue, orders, and top sellers at a glance.</p>
        </div>
        <div className="flex gap-2" data-testid="analytics-range-toggle">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setDays(opt.value)}
              data-testid={`analytics-range-${opt.value}`}
              className={`px-4 py-2 text-xs tracking-wider uppercase border rounded-sm transition-colors ${
                days === opt.value
                  ? "bg-[#1C1C1C] text-white border-[#1C1C1C]"
                  : "bg-white text-[#1C1C1C] border-[#E5E0D8] hover:border-[#1C1C1C]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {loading && !data && (
        <div className="bg-white border border-[#E5E0D8] rounded-sm p-12 text-center text-sm text-[#8A817C]">
          Loading analytics...
        </div>
      )}

      {data && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
            <KpiCard
              icon={TrendingUp}
              label="Revenue"
              value={formatJPY(data.totals.revenue)}
              sub={`Last ${data.range.days} days`}
            />
            <KpiCard
              icon={Receipt}
              label="Orders"
              value={data.totals.orders_count}
              sub={`Last ${data.range.days} days`}
            />
            <KpiCard
              icon={Wallet}
              label="Avg. Order Value"
              value={formatJPY(data.totals.avg_order_value)}
              sub="Per paid order"
            />
            <KpiCard
              icon={CalendarClock}
              label="Today"
              value={formatJPY(data.today.revenue)}
              sub={`${data.today.orders_count} order(s) today`}
            />
          </div>

          <div className="mb-6 md:mb-8">
            <DailyBarChart daily={data.daily} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mb-6 md:mb-8">
            <RankedBarList
              title="Top Selling Items"
              rows={data.top_items}
              labelKey="name"
              valueKey="revenue"
              formatValue={formatJPY}
              testIdPrefix="analytics-top-item"
            />
            <RankedBarList
              title="Revenue by Category"
              rows={data.by_category}
              labelKey="category"
              valueKey="revenue"
              formatValue={formatJPY}
              testIdPrefix="analytics-category"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
            <div className="bg-white border border-[#E5E0D8] rounded-sm p-5 md:p-6">
              <div className="label-eyebrow mb-5 flex items-center gap-2">
                <BarChart3 size={14} /> Payment Methods
              </div>
              {data.payment_methods.length === 0 && (
                <div className="text-sm text-[#8A817C] py-6 text-center">No paid orders in this range.</div>
              )}
              <div className="space-y-3">
                {data.payment_methods.map((pm) => (
                  <div
                    key={pm.method}
                    className="flex items-center justify-between border-b border-[#E5E0D8] last:border-0 pb-3 last:pb-0"
                    data-testid={`analytics-payment-${pm.method}`}
                  >
                    <span className="text-sm capitalize">{pm.method}</span>
                    <div className="text-right">
                      <div className="font-serif-jp text-base">{formatJPY(pm.revenue)}</div>
                      <div className="text-xs text-[#8A817C]">{pm.count} order(s)</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-[#E5E0D8] rounded-sm p-5 md:p-6">
              <div className="label-eyebrow mb-5">Order Status (All Time)</div>
              <div className="flex flex-wrap gap-2">
                {statusBreakdown.map((s) => (
                  <span
                    key={s.status}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium ${STATUS_COLOR[s.status] || "bg-[#F2F0EC] text-[#5C4033]"}`}
                    data-testid={`analytics-status-${s.status}`}
                  >
                    {(STATUS_LABEL[s.status] || s.status)}: {s.count}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}