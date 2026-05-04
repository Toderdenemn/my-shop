"use client";

import { useEffect, useState } from "react";
import { DeliveryOption } from "@/types";
import { toast } from "@/components/Toast";
import { Plus, Trash2, Save, KeyRound, Phone, ImageIcon, Upload } from "lucide-react";

interface Settings {
  delivery: { options: DeliveryOption[] };
  bank: { bankName: string; iban: string; accountNumber: string; accountHolder: string };
  sms: { adminPhone: string };
  banner: { imageUrl: string };
}

const DEFAULT: Settings = {
  delivery: {
    options: [
      { id: "mongol-shuudan", name: "Монгол шуудан", price: 5000, description: "Удаан (3-7 хоног)" },
      { id: "ubcab", name: "UBcab", price: 13000, description: "Хурдан (1-2 хоног)" },
    ],
  },
  bank: { bankName: "Худалдаа хөгжлийн банк", iban: "370004000", accountNumber: "459 008 919", accountHolder: "" },
  sms: { adminPhone: "" },
  banner: { imageUrl: "" },
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [creds, setCreds] = useState({ currentPassword: "", newUsername: "", newPassword: "", confirmPassword: "" });
  const [bannerUploading, setBannerUploading] = useState(false);
  const [savingCreds, setSavingCreds] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => {
        setSettings({
          delivery: data.delivery?.options ? data.delivery : DEFAULT.delivery,
          bank: data.bank?.bankName ? data.bank : DEFAULT.bank,
          sms: data.sms ?? { adminPhone: "" },
          banner: data.banner ?? { imageUrl: "" },
        });
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      toast("Тохиргоо хадгалагдлаа!");
    } catch {
      toast("Хадгалахад алдаа гарлаа", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleChangeCreds = async () => {
    if (!creds.currentPassword) { toast("Одоогийн нууц үгийг оруулна уу", "error"); return; }
    if (creds.newPassword && creds.newPassword !== creds.confirmPassword) { toast("Шинэ нууц үг таарахгүй байна", "error"); return; }
    if (!creds.newUsername && !creds.newPassword) { toast("Нэвтрэх нэр эсвэл нууц үг оруулна уу", "error"); return; }
    setSavingCreds(true);
    try {
      const res = await fetch("/api/admin/change-credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: creds.currentPassword,
          newUsername: creds.newUsername || undefined,
          newPassword: creds.newPassword || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast(data.error || "Алдаа гарлаа", "error"); return; }
      toast("Нэвтрэх мэдээлэл шинэчлэгдлээ!");
      setCreds({ currentPassword: "", newUsername: "", newPassword: "", confirmPassword: "" });
    } catch {
      toast("Алдаа гарлаа", "error");
    } finally {
      setSavingCreds(false);
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBannerUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: form });
      const data = await res.json();
      if (data.url) {
        setSettings((p) => ({ ...p, banner: { imageUrl: data.url } }));
        toast("Зураг байршуулагдлаа!");
      }
    } catch {
      toast("Зураг байршуулахад алдаа гарлаа", "error");
    } finally {
      setBannerUploading(false);
    }
  };

  const updateDeliveryOption = (i: number, field: keyof DeliveryOption, value: string | number) => {
    setSettings((prev) => {
      const options = [...prev.delivery.options];
      options[i] = { ...options[i], [field]: value };
      return { ...prev, delivery: { options } };
    });
  };

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-8 bg-gray-200 rounded w-1/3" /></div>;

  return (
    <div className="max-w-xl space-y-5">
      <h1 className="text-2xl font-bold text-gray-900">Тохиргоо</h1>

      {/* Banner */}
      <div className="bg-white rounded-xl border p-5 space-y-4">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-gray-600" />
          <h2 className="font-bold text-gray-900">Нүүр хуудасны баннер</h2>
        </div>

        {settings.banner.imageUrl && (
          <div className="relative w-full h-40 rounded-xl overflow-hidden border">
            <img src={settings.banner.imageUrl} alt="Banner" className="w-full h-full object-cover" />
          </div>
        )}

        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Зураг байршуулах</label>
          <div className="bg-blue-50 rounded-lg px-3 py-2 mb-2 text-xs text-blue-700 space-y-0.5">
            <p>✅ <strong>Хамгийн тохиромжтой:</strong> 1920 × 500px (Full HD өргөн баннер)</p>
            <p>📐 Харьцаа: 4:1 орчим байвал хамгийн сайн харагдана</p>
            <p>📁 Формат: JPG, PNG, WEBP · Хэмжээ: 5MB-аас ихгүй</p>
          </div>
          <label className="flex items-center gap-2 cursor-pointer border-2 border-dashed border-gray-300 hover:border-yellow-400 rounded-xl p-4 transition-colors">
            <Upload className="w-5 h-5 text-gray-400" />
            <span className="text-sm text-gray-500">
              {bannerUploading ? "Байршуулж байна..." : "Зураг сонгох"}
            </span>
            <input type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} disabled={bannerUploading} />
          </label>
        </div>

        {settings.banner.imageUrl && (
          <div>
            <label className="text-xs text-gray-500 block mb-1">Зургийн URL (гараар оруулах)</label>
            <input
              type="text"
              value={settings.banner.imageUrl}
              onChange={(e) => setSettings((p) => ({ ...p, banner: { imageUrl: e.target.value } }))}
              className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-yellow-400"
              placeholder="https://..."
            />
          </div>
        )}
      </div>

      {/* Delivery */}
      <div className="bg-white rounded-xl border p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-gray-900">Хүргэлтийн сонголтууд</h2>
          <button onClick={() => setSettings((p) => ({ ...p, delivery: { options: [...p.delivery.options, { id: `opt-${Date.now()}`, name: "", price: 0, description: "" }] } }))} className="flex items-center gap-1 text-sm text-yellow-600 hover:text-yellow-700 font-medium">
            <Plus className="w-4 h-4" /> Нэмэх
          </button>
        </div>
        {settings.delivery.options.map((opt, i) => (
          <div key={i} className="border rounded-xl p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Нэр</label>
                <input type="text" value={opt.name} onChange={(e) => updateDeliveryOption(i, "name", e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-yellow-400" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Үнэ (₮)</label>
                <input type="number" value={opt.price} onChange={(e) => updateDeliveryOption(i, "price", Number(e.target.value))} className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-yellow-400" />
              </div>
            </div>
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="text-xs text-gray-500 block mb-1">Тайлбар</label>
                <input type="text" value={opt.description} onChange={(e) => updateDeliveryOption(i, "description", e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-yellow-400" />
              </div>
              <button onClick={() => setSettings((p) => ({ ...p, delivery: { options: p.delivery.options.filter((_, j) => j !== i) } }))} className="p-2 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Bank */}
      <div className="bg-white rounded-xl border p-5 space-y-4">
        <h2 className="font-bold text-gray-900">Дансны мэдээлэл</h2>
        {[
          { label: "Банкны нэр", key: "bankName" },
          { label: "IBAN", key: "iban" },
          { label: "Данс дугаар", key: "accountNumber" },
          { label: "Данс эзэмшигч", key: "accountHolder" },
        ].map(({ label, key }) => (
          <div key={key}>
            <label className="text-sm font-medium text-gray-700 block mb-1">{label}</label>
            <input type="text" value={(settings.bank as any)[key]} onChange={(e) => setSettings((p) => ({ ...p, bank: { ...p.bank, [key]: e.target.value } }))} className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-yellow-400" />
          </div>
        ))}
      </div>

      {/* SMS */}
      <div className="bg-white rounded-xl border p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Phone className="w-5 h-5 text-gray-600" />
          <h2 className="font-bold text-gray-900">SMS мэдэгдэл</h2>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Захиалга орох бүрт мэдэгдэл очих дугаар</label>
          <input
            type="text"
            placeholder="88084115"
            value={settings.sms.adminPhone}
            onChange={(e) => setSettings((p) => ({ ...p, sms: { adminPhone: e.target.value } }))}
            className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-yellow-400"
          />
        </div>
      </div>

      <button onClick={handleSave} disabled={saving} className="w-full bg-yellow-400 hover:bg-yellow-500 disabled:bg-gray-200 text-gray-900 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors">
        <Save className="w-5 h-5" />
        {saving ? "Хадгалж байна..." : "Тохиргоо хадгалах"}
      </button>

      {/* Change credentials */}
      <div className="bg-white rounded-xl border p-5 space-y-4">
        <div className="flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-gray-600" />
          <h2 className="font-bold text-gray-900">Нэвтрэх мэдээлэл солих</h2>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Одоогийн нууц үг *</label>
          <input type="password" value={creds.currentPassword} onChange={(e) => setCreds((p) => ({ ...p, currentPassword: e.target.value }))} className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-yellow-400" placeholder="Одоогийн нууц үгийг оруулна уу" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Шинэ нэвтрэх нэр</label>
          <input type="text" value={creds.newUsername} onChange={(e) => setCreds((p) => ({ ...p, newUsername: e.target.value }))} className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-yellow-400" placeholder="Хоосон орхивол өөрчлөгдөхгүй" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Шинэ нууц үг</label>
          <input type="password" value={creds.newPassword} onChange={(e) => setCreds((p) => ({ ...p, newPassword: e.target.value }))} className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-yellow-400" placeholder="Хоосон орхивол өөрчлөгдөхгүй" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Шинэ нууц үг давтах</label>
          <input type="password" value={creds.confirmPassword} onChange={(e) => setCreds((p) => ({ ...p, confirmPassword: e.target.value }))} className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-yellow-400" placeholder="Шинэ нууц үгийг давтна уу" />
        </div>
        <button onClick={handleChangeCreds} disabled={savingCreds} className="w-full bg-gray-900 hover:bg-gray-800 disabled:bg-gray-200 text-white font-bold py-3 rounded-xl transition-colors">
          {savingCreds ? "Хадгалж байна..." : "Нэвтрэх мэдээлэл шинэчлэх"}
        </button>
      </div>
    </div>
  );
}
