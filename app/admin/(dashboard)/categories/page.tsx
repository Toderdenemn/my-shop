"use client";

import { useEffect, useState } from "react";
import { Category } from "@/types";
import { toast } from "@/components/Toast";
import { Plus, Trash2, Edit, Check, X } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);

  const fetchCategories = async () => {
    const res = await fetch("/api/admin/categories");
    const data = await res.json();
    setCategories(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { fetchCategories(); }, []);

  const slugify = (name: string) => name.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "");

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    try {
      const id = uuidv4();
      const cat: Category = {
        id, name: newName.trim(), slug: slugify(newName), order: categories.length, isActive: true,
      };
      await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cat),
      });
      setCategories((prev) => [...prev, cat]);
      setNewName("");
      toast("Ангилал нэмэгдлээ!");
    } finally {
      setAdding(false);
    }
  };

  const handleEdit = async (id: string) => {
    if (!editName.trim()) return;
    await fetch(`/api/admin/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName.trim(), slug: slugify(editName) }),
    });
    setCategories((prev) => prev.map((c) => c.id === id ? { ...c, name: editName.trim(), slug: slugify(editName) } : c));
    setEditingId(null);
    toast("Өөрчлөлт хадгалагдлаа!");
  };

  const handleDelete = (id: string, name: string) => {
    const deleted = categories.find((c) => c.id === id)!;
    setCategories((prev) => prev.filter((c) => c.id !== id));
    let undone = false;
    const timer = setTimeout(() => {
      if (!undone) fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    }, 4000);
    toast(`"${name}" устгагдлаа`, "success", {
      label: "Буцаах",
      onClick: () => {
        undone = true;
        clearTimeout(timer);
        setCategories((prev) => [...prev, deleted]);
      },
    });
  };

  const handleToggle = async (cat: Category) => {
    await fetch(`/api/admin/categories/${cat.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !cat.isActive }),
    });
    setCategories((prev) => prev.map((c) => c.id === cat.id ? { ...c, isActive: !c.isActive } : c));
  };

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Ангилал</h1>

      <div className="bg-white rounded-xl border overflow-hidden mb-4">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Ачааллаж байна...</div>
        ) : categories.length === 0 ? (
          <div className="p-8 text-center text-gray-400">Ангилал байхгүй байна</div>
        ) : (
          <div className="divide-y">
            {categories.map((cat) => (
              <div key={cat.id} className="flex items-center gap-3 px-5 py-3.5">
                {editingId === cat.id ? (
                  <>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleEdit(cat.id)}
                      autoFocus
                      className="flex-1 border rounded-lg px-3 py-1.5 text-sm outline-none focus:border-yellow-400"
                    />
                    <button onClick={() => handleEdit(cat.id)} className="text-green-500 hover:text-green-700">
                      <Check className="w-5 h-5" />
                    </button>
                    <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600">
                      <X className="w-5 h-5" />
                    </button>
                  </>
                ) : (
                  <>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={cat.isActive} onChange={() => handleToggle(cat)} className="w-4 h-4 accent-yellow-400" />
                    </label>
                    <span className={`flex-1 font-medium ${cat.isActive ? "text-gray-900" : "text-gray-400"}`}>
                      {cat.name}
                    </span>
                    <span className="text-xs text-gray-400 font-mono">{cat.slug}</span>
                    <button onClick={() => { setEditingId(cat.id); setEditName(cat.name); }} className="p-1.5 text-blue-400 hover:text-blue-600 rounded hover:bg-blue-50">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(cat.id, cat.name)} className="p-1.5 text-red-400 hover:text-red-600 rounded hover:bg-red-50">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border p-5">
        <h2 className="font-bold text-gray-900 mb-3">Шинэ ангилал нэмэх</h2>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Ангилалын нэр"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            className="flex-1 border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-yellow-400"
          />
          <button
            onClick={handleAdd}
            disabled={adding || !newName.trim()}
            className="bg-yellow-400 hover:bg-yellow-500 disabled:bg-gray-200 text-gray-900 font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Нэмэх
          </button>
        </div>
      </div>
    </div>
  );
}
