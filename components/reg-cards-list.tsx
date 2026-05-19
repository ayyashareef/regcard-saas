"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

interface RegCard {
  id: string;
  cardNo: string;
  guestName: string | null;
  idNumber: string | null;
  idType: string;
  nationality: string | null;
  date: string;
  dateOfBirth: string | null;
  company: string | null;
  checkInTime: string | null;
  checkOutDate: string | null;
  checkOutTime: string | null;
  arrivalDate: string | null;
  departureDate: string | null;
  room: { number: string } | null;
}

interface RegCardsListProps {
  regCards: RegCard[];
  total: number;
  page: number;
  limit: number;
  userRole: string;
}

function formatCategory(idType: string) {
  switch (idType) {
    case "TOURIST": return "Tourist";
    case "MALDIVIAN": return "Maldivian";
    case "WORK_PERMIT": return "Work Permit Holder";
    case "DIPLOMAT": return "Diplomat";
    default: return idType;
  }
}

function cardToRow(card: RegCard) {
  return {
    "Guest Registration No.": card.cardNo,
    "Name of Guest": card.guestName || "",
    "Category": formatCategory(card.idType),
    "Date of birth": card.dateOfBirth ? new Date(card.dateOfBirth).toLocaleDateString("en-GB") : "",
    "Identification No.": card.idNumber || "",
    "Nationality": card.nationality || "",
    "Booking Method": (["Booking.com", "Agoda", "Expedia", "Mytrip"].includes(card.company || ""))
      ? "OTA (Online Travel Agents)"
      : (card.company || ""),
    "Check-in Date": card.date ? new Date(card.date).toLocaleDateString("en-GB") : "",
    "Check-in Time": card.checkInTime || "",
    "Check-out Date": card.checkOutDate ? new Date(card.checkOutDate).toLocaleDateString("en-GB") : "",
    "Check-out Time": card.checkOutTime || "",
  };
}

export function RegCardsList({ regCards, total, page, limit, userRole }: RegCardsListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFrom, setExportFrom] = useState("");
  const [exportTo, setExportTo] = useState("");
  const [exporting, setExporting] = useState(false);

  // Live search with debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      router.push(`/reg-cards?${params.toString()}`);
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search, router]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    router.push(`/reg-cards?${params.toString()}`);
  }

  async function handleExport() {
    setExporting(true);
    try {
      const XLSX = await import("xlsx");

      // Fetch cards from API with date range
      const params = new URLSearchParams();
      if (exportFrom) params.set("from", exportFrom);
      if (exportTo) params.set("to", exportTo);
      params.set("limit", "10000");

      const res = await fetch(`/api/reg-cards?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const { regCards: cards } = await res.json();

      if (!cards || cards.length === 0) {
        alert("No records found for the selected date range");
        return;
      }

      const exportData = cards.map(cardToRow);

      const ws = XLSX.utils.json_to_sheet(exportData);

      // Auto-size columns
      const colWidths = Object.keys(exportData[0] || {}).map((key: string) => {
        const maxLen = Math.max(key.length, ...exportData.map((row: Record<string, string>) => String(row[key] || "").length));
        return { wch: maxLen + 2 };
      });
      ws["!cols"] = colWidths;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "GRTInfoSheet");

      const fromLabel = exportFrom || "all";
      const toLabel = exportTo || "all";
      XLSX.writeFile(wb, `Guest_Registration_${fromLabel}_to_${toLabel}.xlsx`);
      setShowExportModal(false);
    } catch {
      alert("Export failed");
    } finally {
      setExporting(false);
    }
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      {/* Export Date Range Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-neutral-border w-full max-w-md p-6 space-y-5">
            <h3 className="text-lg font-bold text-brand-deep">Export to Excel</h3>
            <p className="text-sm text-neutral-muted">
              Select a date range to export. Leave empty to export all records.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-text mb-1">From</label>
                <input
                  type="date"
                  value={exportFrom}
                  onChange={(e) => setExportFrom(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-border focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-text mb-1">To</label>
                <input
                  type="date"
                  value={exportTo}
                  onChange={(e) => setExportTo(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-border focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand text-sm"
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 rounded-lg border border-neutral-border text-sm font-medium text-neutral-text hover:bg-neutral-section transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExport}
                disabled={exporting}
                className="bg-brand text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-brand-light disabled:opacity-50 transition"
              >
                {exporting ? "Exporting..." : "Export"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 max-w-md">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, card no, ID..."
            className="flex-1 px-4 py-2 rounded-lg border border-neutral-border focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand text-sm"
          />
          <button
            type="submit"
            className="bg-brand text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-light transition"
          >
            Search
          </button>
        </form>

        <div className="flex gap-2">
          {(userRole === "MANAGER" || userRole === "SUPER_ADMIN") && (
            <button
              onClick={() => setShowExportModal(true)}
              className="px-4 py-2 rounded-lg border border-neutral-border text-sm font-medium text-neutral-text hover:bg-neutral-section transition"
            >
              Export Excel
            </button>
          )}
          <Link
            href="/reg-cards/new"
            className="bg-brand text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-light transition"
          >
            + New Card
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-neutral-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-border bg-neutral-section/50">
                <th className="text-left px-5 py-3 font-medium text-neutral-muted">Card No</th>
                <th className="text-left px-5 py-3 font-medium text-neutral-muted">Guest Name</th>
                <th className="text-left px-5 py-3 font-medium text-neutral-muted">ID Number</th>
                <th className="text-left px-5 py-3 font-medium text-neutral-muted">Nationality</th>
                <th className="text-left px-5 py-3 font-medium text-neutral-muted">Room</th>
                <th className="text-left px-5 py-3 font-medium text-neutral-muted">Arrival</th>
                <th className="text-left px-5 py-3 font-medium text-neutral-muted">Departure</th>
              </tr>
            </thead>
            <tbody>
              {regCards.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-neutral-muted">
                    No registration cards found
                  </td>
                </tr>
              ) : (
                regCards.map((card) => (
                  <tr key={card.id} className="border-b border-neutral-border last:border-0 hover:bg-neutral-section/30 transition">
                    <td className="px-5 py-3">
                      <Link href={`/reg-cards/${card.id}`} className="text-brand font-medium hover:text-brand-dark">
                        {card.cardNo}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-neutral-text font-medium">
                      {card.guestName}
                    </td>
                    <td className="px-5 py-3 text-neutral-muted font-mono text-xs">{card.idNumber || "—"}</td>
                    <td className="px-5 py-3 text-neutral-muted">{card.nationality || "—"}</td>
                    <td className="px-5 py-3 text-neutral-muted">{card.room?.number || "—"}</td>
                    <td className="px-5 py-3 text-neutral-muted">
                      {card.arrivalDate ? new Date(card.arrivalDate).toLocaleDateString("en-GB") : "—"}
                    </td>
                    <td className="px-5 py-3 text-neutral-muted">
                      {card.departureDate ? new Date(card.departureDate).toLocaleDateString("en-GB") : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-neutral-border">
            <div className="text-sm text-neutral-muted">
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
            </div>
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    const params = new URLSearchParams(searchParams.toString());
                    params.set("page", p.toString());
                    router.push(`/reg-cards?${params.toString()}`);
                  }}
                  className={`px-3 py-1 rounded text-sm ${
                    p === page
                      ? "bg-brand text-white"
                      : "bg-neutral-section text-neutral-muted hover:bg-neutral-border"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
