import { requireAuth } from "@/lib/auth/session";
import { getRooms } from "@/lib/actions/rooms";
import { RegCardFormComponent } from "@/components/reg-card-form";
import { PageHeaderV2 } from "@/components/v2/page-header";

export const dynamic = "force-dynamic";

const CHECKLIST = [
  "Passport / ID photo",
  "Document number",
  "Room assignment",
  "Guest name",
  "Check-in & check-out dates",
];

export default async function NewRegCardPage() {
  await requireAuth();
  const rooms = await getRooms();
  const year = new Date().getFullYear();

  return (
    <div className="px-4 py-8 pb-16 sm:px-8 lg:px-14 lg:py-12 lg:pb-20">
      <PageHeaderV2
        eyebrow="Front Desk · Intake"
        title="New registration card"
        subtitle="Scan a passport or fill in details manually. The card is auto-numbered once saved."
      />

      <div className="grid grid-cols-1 gap-6 lg:[grid-template-columns:1.6fr_1fr]">
        <div className="min-w-0">
          <RegCardFormComponent rooms={rooms} />
        </div>

        <aside className="hidden flex-col gap-5 lg:flex lg:sticky lg:top-6 lg:self-start">
          <div style={{ background: "var(--color-paper)", border: "1px solid var(--color-line)", borderRadius: 10, overflow: "hidden" }}>
            <div className="flex items-center justify-between" style={{ padding: "16px 22px 12px", borderBottom: "1px solid var(--color-line)" }}>
              <span className="font-serif" style={{ fontSize: 20, fontWeight: 600, color: "var(--color-ink)" }}>Card format</span>
              <small className="font-mono uppercase" style={{ fontSize: 10, letterSpacing: ".2em", color: "var(--color-text-soft)", fontWeight: 500 }}>UG-{year}-NNNNN</small>
            </div>
            <div style={{ padding: "22px" }}>
              <div className="relative overflow-hidden" style={{ background: "linear-gradient(170deg,#fdfaf1,#f6efde)", border: "1px solid var(--color-line)", borderRadius: 10, padding: "26px 24px 22px" }}>
                <span aria-hidden style={{ position: "absolute", top: 0, left: 0, width: 56, height: 56, borderTop: "2px solid var(--color-brand)", borderLeft: "2px solid var(--color-brand)", borderTopLeftRadius: 10 }} />
                <span aria-hidden style={{ position: "absolute", bottom: 0, right: 0, width: 56, height: 56, borderBottom: "2px solid var(--color-brand)", borderRight: "2px solid var(--color-brand)", borderBottomRightRadius: 10 }} />
                <span aria-hidden className="grid place-items-center font-serif" style={{ position: "absolute", top: 22, right: 22, width: 38, height: 38, borderRadius: "50%", border: "1.5px solid var(--color-brand)", color: "var(--color-brand-deep)", fontWeight: 600, fontSize: 13, letterSpacing: ".04em" }}>UG</span>
                <div className="font-mono uppercase" style={{ fontSize: 9.5, letterSpacing: ".24em", color: "var(--color-brand-deep)", fontWeight: 600 }}>Registration card</div>
                <div className="font-mono" style={{ fontSize: 13, color: "var(--color-ink-2)", fontWeight: 600, letterSpacing: ".06em", marginTop: 4 }}>UG-{year}-•••••</div>
                <div className="font-serif" style={{ fontSize: 24, fontWeight: 600, color: "var(--color-ink)", lineHeight: 1.1, margin: "18px 0", letterSpacing: "-.005em" }}>Auto-assigned on save</div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3.5" style={{ paddingTop: 14, borderTop: "1px dashed var(--color-line-2)" }}>
                  {["Guest name", "Nationality", "Room", "Check-in / out", "ID number", "Signature"].map((f) => (
                    <div key={f} className="flex flex-col gap-1">
                      <span className="font-mono uppercase" style={{ fontSize: 9, letterSpacing: ".18em", color: "var(--color-text-soft)", fontWeight: 500 }}>{f}</span>
                      <b style={{ fontSize: 13, color: "var(--color-text-soft)" }}>—</b>
                    </div>
                  ))}
                </div>
                <div className="font-mono uppercase text-center" style={{ marginTop: 18, paddingTop: 12, borderTop: "1px dashed var(--color-line-2)", fontSize: 9.5, letterSpacing: ".16em", color: "var(--color-text-soft)", fontWeight: 500 }}>Issued by Front Desk · Unima Grand</div>
              </div>
            </div>
          </div>

          <div style={{ background: "var(--color-paper)", border: "1px solid var(--color-line)", borderRadius: 10, overflow: "hidden" }}>
            <div className="flex items-center" style={{ padding: "16px 22px 12px", borderBottom: "1px solid var(--color-line)" }}>
              <span className="font-serif" style={{ fontSize: 20, fontWeight: 600, color: "var(--color-ink)" }}>Before you save</span>
            </div>
            <div className="flex flex-col gap-2.5" style={{ padding: "18px 22px 20px" }}>
              {CHECKLIST.map((item) => (
                <div key={item} className="flex items-center gap-2.5" style={{ fontSize: 13, color: "var(--color-ink-2)" }}>
                  <span aria-hidden style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-brand)", flexShrink: 0 }} />
                  {item}
                </div>
              ))}
              <p style={{ fontSize: 11.5, color: "var(--color-text-soft)", marginTop: 6, lineHeight: 1.4 }}>
                ID type drives the document-number label (PP / NID / WP). MRZ scanning is available for Tourist passports.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
