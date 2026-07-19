import React, { useEffect, useState } from "react";
import api from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Tag } from "lucide-react";

const emptyForm = { name: "", name_en: "", name_ja: "", name_id: "", description: "" };

export default function CategoryManagement() {
  const [categories, setCategories] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const { data } = await api.get("/categories");
      setCategories(data);
    } catch (err) {
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setOpen(true); };
  const openEdit = (cat) => {
    setEditing(cat);
    setForm({
      name: cat.name || "",
      name_en: cat.name_en || "",
      name_ja: cat.name_ja || "",
      name_id: cat.name_id || "",
      description: cat.description || ""
    });
    setOpen(true);
  };

  const onSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Category name is required");
      return;
    }
    try {
      if (editing) {
        await api.put(`/categories/${editing.id}`, form);
        toast.success("Category updated");
      } else {
        await api.post("/categories", form);
        toast.success("Category added");
      }
      setOpen(false);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Save failed");
    }
  };

  const onDelete = async (cat) => {
    if (!window.confirm(`Delete category "${cat.name}"?`)) return;
    try {
      await api.delete(`/categories/${cat.id}`);
      toast.success("Category deleted");
      load();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Delete failed");
    }
  };

  const menuItemCount = (slug) => {
    // This is purely presentational — we show the slug as identifier
    return slug;
  };

  return (
    <div className="p-4 md:p-8 lg:p-12 fade-up" data-testid="category-management-page">
      <div className="flex items-end justify-between flex-wrap gap-4 mb-8 md:mb-10">
        <div>
          <div className="label-eyebrow mb-3">Category Management</div>
          <h1 className="font-serif-jp text-3xl md:text-4xl lg:text-5xl">Categories</h1>
          <p className="text-sm text-[#8A817C] mt-2">Manage food categories for the menu.</p>
        </div>
        <Button onClick={openAdd} className="btn-aka rounded-sm h-11 px-6" data-testid="category-add-button">
          <Plus size={16} className="mr-2" /> Add Category
        </Button>
      </div>

      {/* Desktop / tablet table */}
      <div className="hidden md:block bg-white border border-[#E5E0D8] rounded-sm overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr className="border-b border-[#E5E0D8] text-left">
              <th className="px-6 py-4 label-eyebrow">Category</th>
              <th className="px-6 py-4 label-eyebrow">Slug</th>
              <th className="px-6 py-4 label-eyebrow">Description</th>
              <th className="px-6 py-4 label-eyebrow">Created</th>
              <th className="px-6 py-4 label-eyebrow text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-sm text-[#8A817C]">Loading...</td></tr>
            )}
            {!loading && categories.length === 0 && (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-sm text-[#8A817C]">No categories yet.</td></tr>
            )}
            {categories.map((cat) => (
              <tr key={cat.id} className="border-b border-[#E5E0D8] last:border-0" data-testid={`category-row-${cat.id}`}>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#F2F0EC] rounded-sm flex items-center justify-center">
                      <Tag size={16} className="text-[#8A817C]" />
                    </div>
                    <div className="font-medium">{cat.name}</div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#F2F4EC] text-[#54662C]">
                    {cat.slug}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-[#8A817C] max-w-xs truncate">{cat.description || "—"}</td>
                <td className="px-6 py-4 text-sm text-[#8A817C]">
                  {cat.created_at ? new Date(cat.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                </td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => openEdit(cat)} data-testid={`category-edit-${cat.id}`}
                    className="inline-flex items-center gap-1 text-xs text-[#5C4033] hover:text-[#C93A3E] mr-4">
                    <Pencil size={14} /> Edit
                  </button>
                  <button onClick={() => onDelete(cat)} data-testid={`category-delete-${cat.id}`}
                    className="inline-flex items-center gap-1 text-xs text-[#8A817C] hover:text-[#C93A3E]">
                    <Trash2 size={14} /> Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card list */}
      <div className="md:hidden space-y-3">
        {loading && (
          <div className="bg-white border border-[#E5E0D8] rounded-sm p-8 text-center text-sm text-[#8A817C]">
            Loading...
          </div>
        )}
        {!loading && categories.length === 0 && (
          <div className="bg-white border border-[#E5E0D8] rounded-sm p-8 text-center text-sm text-[#8A817C]">
            No categories yet.
          </div>
        )}
        {categories.map((cat) => (
          <div key={cat.id} className="bg-white border border-[#E5E0D8] rounded-sm p-4" data-testid={`category-card-${cat.id}`}>
            <div className="flex gap-3">
              <div className="w-12 h-12 bg-[#F2F0EC] rounded-sm flex items-center justify-center flex-shrink-0">
                <Tag size={18} className="text-[#8A817C]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline gap-2">
                  <div className="font-medium truncate">{cat.name}</div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#F2F4EC] text-[#54662C] whitespace-nowrap">
                    {cat.slug}
                  </span>
                </div>
                <div className="text-xs text-[#8A817C] mt-0.5 line-clamp-2">{cat.description || "No description"}</div>
              </div>
            </div>
            <div className="flex gap-4 mt-3 pt-3 border-t border-[#E5E0D8]">
              <button onClick={() => openEdit(cat)} data-testid={`category-edit-${cat.id}`}
                className="inline-flex items-center gap-1 text-xs text-[#5C4033] hover:text-[#C93A3E]">
                <Pencil size={14} /> Edit
              </button>
              <button onClick={() => onDelete(cat)} data-testid={`category-delete-${cat.id}`}
                className="inline-flex items-center gap-1 text-xs text-[#8A817C] hover:text-[#C93A3E]">
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-sm max-w-lg" data-testid="category-form-dialog">
          <DialogHeader>
            <DialogTitle className="font-serif-jp text-2xl">
              {editing ? "Edit Category" : "Add Category"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={onSave} className="space-y-4">
            <div>
              <Label className="label-eyebrow">Name (Default)</Label>
              <Input className="rounded-sm mt-2" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                data-testid="category-form-name" required
                placeholder="e.g. Appetizer" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label className="label-eyebrow">Name (English)</Label>
                <Input className="rounded-sm mt-2" value={form.name_en}
                  onChange={(e) => setForm({ ...form, name_en: e.target.value })}
                  data-testid="category-form-name-en"
                  placeholder="Appetizer (EN)" />
              </div>
              <div>
                <Label className="label-eyebrow">Name (日本語)</Label>
                <Input className="rounded-sm mt-2" value={form.name_ja}
                  onChange={(e) => setForm({ ...form, name_ja: e.target.value })}
                  data-testid="category-form-name-ja"
                  placeholder="前菜 (JA)" />
              </div>
              <div>
                <Label className="label-eyebrow">Name (Indonesia)</Label>
                <Input className="rounded-sm mt-2" value={form.name_id}
                  onChange={(e) => setForm({ ...form, name_id: e.target.value })}
                  data-testid="category-form-name-id"
                  placeholder="Pembuka (ID)" />
              </div>
            </div>

            <div>
              <Label className="label-eyebrow">Description</Label>
              <Textarea className="rounded-sm mt-2" rows={3} value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                data-testid="category-form-description"
                placeholder="Optional description for this category" />
            </div>
            {form.name.trim() && (
              <div className="text-xs text-[#8A817C]">
                Slug: <span className="font-mono text-[#5C4033]">{form.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')}</span>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" className="rounded-sm" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" className="btn-aka rounded-sm" data-testid="category-form-submit">
                {editing ? "Save Changes" : "Add Category"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
