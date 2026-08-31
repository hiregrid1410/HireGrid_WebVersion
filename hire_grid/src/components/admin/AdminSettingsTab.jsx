import React, { useState, useEffect } from "react";
import { OperationType, db, doc, getDoc, handleFirestoreError, setDoc } from "../../firebase";
import { Save, Shield, CreditCard, HelpCircle, AlertCircle, Sparkles } from "lucide-react";
import { showToast } from "../common/Toast";

export function AdminSettingsTab() {
  const [activeSubTab, setActiveSubTab] = useState("payment"); // payment, qrCode, bank, instructions
  const [settings, setSettings] = useState({
    contactNumber: "",
    whatsappNumber: "",
    upiId: "",
    bankDetails: "",
    instructions:
      "Step 1: Send payment using the provided payment details.\nStep 2: Submit transaction details.\nStep 3: Wait for admin approval.",
    paymentNumber: "",
    qrCode: "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, "settings", "payment");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSettings((prev) => ({ ...prev, ...docSnap.data() }));
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, "settings");
      }
    };
    fetchSettings();
  }, []);

  const handleQrUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showToast("Image is too large. Please select an image smaller than 2MB.", "error");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setSettings((prev) => ({ ...prev, qrCode: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      await setDoc(doc(db, "settings", "payment"), settings);
      showToast("Settings updated successfully.", "success");
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, "settings");
      showToast(`Error saving settings: ${err.message}`, "error");
    } finally {
      setSaving(false);
    }
  };

  const menuItems = [
    { id: "payment", label: "Payment UPI Config", icon: <CreditCard className="w-4 h-4" /> },
    { id: "qrCode", label: "QR Code Asset", icon: <Sparkles className="w-4 h-4" /> },
    { id: "bank", label: "Banking Credentials", icon: <Shield className="w-4 h-4" /> },
    { id: "instructions", label: "Purchase Instructions", icon: <HelpCircle className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Platform Settings</h2>
        <p className="text-sm text-slate-500 mt-1 dark:text-slate-400">
          Configure payment details, QR graphics, bank information, and transaction instructions displayed to students.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Left Side Settings Navigation */}
        <div className="w-full lg:w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-sm shrink-0 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSubTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                activeSubTab === item.id
                  ? "bg-emerald-500/10 text-emerald-500 border-l-2 border-emerald-500"
                  : "text-slate-400 hover:text-slate-655 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40"
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {/* Right Settings Configuration Fields */}
        <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm w-full">
          <form onSubmit={handleSave} className="space-y-6">
            {activeSubTab === "payment" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <h3 className="text-sm font-bold uppercase font-mono tracking-wider text-slate-400 mb-2">UPI & UPI Phone Number</h3>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-slate-455 dark:text-slate-500 font-mono">Mobile Number (PhonePe / GPay / Paytm)</label>
                  <input
                    type="text"
                    value={settings.paymentNumber || ""}
                    onChange={(e) => setSettings({ ...settings, paymentNumber: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-805 bg-white dark:bg-slate-950 text-slate-800 dark:text-white text-sm outline-none focus:border-emerald-500"
                    placeholder="e.g. 9664532860"
                  />
                </div>
              </div>
            )}

            {activeSubTab === "qrCode" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <h3 className="text-sm font-bold uppercase font-mono tracking-wider text-slate-400 mb-2">Payment QR Asset</h3>
                <div className="flex items-center space-x-6 bg-slate-50 dark:bg-slate-950 p-4 border border-dashed border-slate-250 dark:border-slate-800 rounded-2xl">
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleQrUpload}
                      className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-emerald-500/10 file:text-emerald-550 hover:file:bg-emerald-500/20"
                    />
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                      Upload platform checkout QR graphic (PNG/JPG, max 2MB).
                    </p>
                  </div>
                  {settings.qrCode && (
                    <div className="relative w-24 h-24 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shrink-0 bg-white flex items-center justify-center">
                      <img src={settings.qrCode} alt="QR code" className="max-w-full max-h-full object-contain" />
                      <button
                        type="button"
                        onClick={() => setSettings({ ...settings, qrCode: "" })}
                        className="absolute top-1 right-1 bg-rose-500 hover:bg-rose-600 text-white w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold leading-none"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeSubTab === "bank" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <h3 className="text-sm font-bold uppercase font-mono tracking-wider text-slate-400 mb-2">Bank Details</h3>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-slate-455 dark:text-slate-500 font-mono">Bank details</label>
                  <textarea
                    rows={4}
                    value={settings.bankDetails || ""}
                    onChange={(e) => setSettings({ ...settings, bankDetails: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-205 dark:border-slate-805 bg-white dark:bg-slate-950 text-slate-800 dark:text-white text-sm outline-none focus:border-emerald-500"
                    placeholder="Bank Name:&#10;Account No:&#10;IFSC Code:&#10;Account Holder:"
                  />
                </div>
              </div>
            )}

            {activeSubTab === "instructions" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <h3 className="text-sm font-bold uppercase font-mono tracking-wider text-slate-400 mb-2">Purchase Steps & Instructions</h3>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-slate-455 dark:text-slate-500 font-mono">Checkout instructions (Markdown/Plain)</label>
                  <textarea
                    rows={6}
                    value={settings.instructions || ""}
                    onChange={(e) => setSettings({ ...settings, instructions: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-205 dark:border-slate-805 bg-white dark:bg-slate-950 text-slate-800 dark:text-white text-sm outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="border-t border-slate-200 dark:border-slate-800 pt-6 mt-6 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest shadow-md transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? "Saving..." : "Save Settings"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
