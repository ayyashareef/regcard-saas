import { requireAuth } from "@/lib/auth/session";
import { getRegCards } from "@/lib/actions/reg-cards";
import { RegCardsView } from "@/components/v2/reg-cards/reg-cards-view";

export const dynamic = "force-dynamic";

const VALID_STATUS = new Set(["IN_HOUSE", "PENDING", "CHECKED_IN"]);
const PAGE_SIZE = 12;

function str(v: string | string[] | undefined): string {
  return typeof v === "string" ? v : "";
}

export default async function RegCardsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAuth();
  const sp = await searchParams;
  const q = str(sp.q).trim();
  const status = VALID_STATUS.has(str(sp.status)) ? str(sp.status) : "";
  const page = Math.max(1, parseInt(str(sp.page) || "1", 10) || 1);

  const { regCards, total } = await getRegCards({
    search: q || undefined,
    status: status || undefined,
    page,
    limit: PAGE_SIZE,
  });

  return (
    <RegCardsView
      cards={regCards}
      total={total}
      page={page}
      limit={PAGE_SIZE}
      q={q}
      status={status}
    />
  );
}
