import React, { useEffect, useRef, useState } from "react";
import api from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { QRCodeCanvas } from "qrcode.react";
import { toast } from "sonner";
import { Plus, Trash2, Download, QrCode } from "lucide-react";

export default function TableManagement() {
  const [tables, setTables] = useState([]);
  const [num, setNum] = useState("");
  const [label, setLabel] = useState("");
  const [selectedTable, setSelectedTable] = useState(null);
  const qrRef = useRef(null);

  const load = async () => {
    const { data } = await api.get("/tables");
    setTables(data);
  };
  useEffect(() => { load(); }, []);

  const onAdd = async (e) => {
    e.preventDefault();
    try {
      await api.post("/tables", { table_number: parseInt(num, 10), label });
      toast.success("Table added");
      setNum(""); setLabel("");
      load();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to add");
    }
  };

  const onDelete = async (t) => {
    if (!window.confirm(`Delete Table #${t.table_number}?`)) return;
    await api.delete(`/tables/${t.id}`);
    load();
  };

  const baseUrl = `${window.location.origin}/menu`;
  const qrUrlFor = (n) => `${baseUrl}?table=${n}`;

  const downloadQR = () => {
    const canvas = qrRef.current?.querySelector("canvas");
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `tsuki-table-${selectedTable.table_number}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="p-4 md:p-8 lg:p-12 fade-up" data-testid="tables-page">
      <div className="mb-8 md:mb-10">
        <div className="label-eyebrow mb-3">Tables &amp; QR Codes</div>
        <h1 className="font-serif-jp text-3xl md:text-4xl lg:text-5xl">Tables</h1>
        <p className="text-sm text-[#8A817C] mt-2">
          Generate a QR code per table. Scanning opens the menu pre-filled with the table number.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <form onSubmit={onAdd} className="bg-white border border-[#E5E0D8] rounded-sm p-6 space-y-4 h-fit" data-testid="add-table-form">
          <div className="label-eyebrow">Add Table</div>
          <div>
            <Label className="label-eyebrow">Table Number</Label>
            <Input type="number" min="1" required value={num} onChange={(e) => setNum(e.target.value)}
              className="rounded-sm mt-2" data-testid="add-table-number" />
          </div>
          <div>
            <Label className="label-eyebrow">Label (optional)</Label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)}
              className="rounded-sm mt-2" placeholder="e.g. Window booth" data-testid="add-table-label" />
          </div>
          <Button type="submit" className="btn-aka rounded-sm w-full h-11" data-testid="add-table-submit">
            <Plus size={16} className="mr-2" /> Add Table
          </Button>
        </form>

        <div className="lg:col-span-2 bg-white border border-[#E5E0D8] rounded-sm overflow-x-auto">
          <table className="w-full min-w-[400px]">
            <thead>
              <tr className="border-b border-[#E5E0D8] text-left">
                <th className="px-4 sm:px-6 py-4 label-eyebrow">No.</th>
                <th className="px-4 sm:px-6 py-4 label-eyebrow">Label</th>
                <th className="px-4 sm:px-6 py-4 label-eyebrow text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tables.length === 0 && (
                <tr><td colSpan={3} className="px-6 py-12 text-center text-sm text-[#8A817C]">No tables.</td></tr>
              )}
              {tables.map((t) => (
                <tr key={t.id} className="border-b border-[#E5E0D8] last:border-0" data-testid={`table-row-${t.id}`}>
                  <td className="px-4 sm:px-6 py-4 font-serif-jp text-xl sm:text-2xl">#{t.table_number}</td>
                  <td className="px-4 sm:px-6 py-4 text-sm text-[#5C4033]">{t.label || "—"}</td>
                  <td className="px-4 sm:px-6 py-4 text-right whitespace-nowrap">
                    <button onClick={() => setSelectedTable(t)} data-testid={`table-qr-${t.id}`}
                      className="inline-flex items-center gap-1 text-xs text-[#5C4033] hover:text-[#C93A3E] mr-3 sm:mr-4">
                      <QrCode size={14} /> QR
                    </button>
                    <button onClick={() => onDelete(t)} data-testid={`table-delete-${t.id}`}
                      className="inline-flex items-center gap-1 text-xs text-[#8A817C] hover:text-[#C93A3E]">
                      <Trash2 size={14} /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!selectedTable} onOpenChange={(o) => !o && setSelectedTable(null)}>
        <DialogContent className="rounded-sm max-w-sm" data-testid="qr-dialog">
          <DialogHeader>
            <DialogTitle className="font-serif-jp text-2xl">
              Table #{selectedTable?.table_number}
            </DialogTitle>
          </DialogHeader>
          {selectedTable && (
            <div className="space-y-4">
              <div ref={qrRef} className="bg-white p-6 flex justify-center border border-[#E5E0D8] rounded-sm">
                <QRCodeCanvas value={qrUrlFor(selectedTable.table_number)} size={220} includeMargin />
              </div>
              <div className="text-xs text-[#8A817C] break-all text-center">
                {qrUrlFor(selectedTable.table_number)}
              </div>
              <Button onClick={downloadQR} className="btn-aka rounded-sm w-full h-11" data-testid="qr-download">
                <Download size={16} className="mr-2" /> Download PNG
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
