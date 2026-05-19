import { z } from "zod";

// Strings that may legitimately be empty (UI sends "" for cleared fields).
// Empty / whitespace becomes null at the DB layer (see toNullable).
const optStr = (max: number) => z.string().max(max).optional().nullable();

const idTypeEnum = z.enum(["TOURIST", "MALDIVIAN", "WORK_PERMIT", "DIPLOMAT"]);
const mealPlanEnum = z.enum(["BB", "HB", "FB"]);

const fields = {
  date: optStr(64),
  checkInTime: optStr(32),
  checkOutTime: optStr(32),
  checkOutDate: optStr(64),
  guestName: optStr(200),
  contactNo: optStr(50),
  whatsappNo: optStr(50),
  email: z.union([z.string().email().max(255), z.literal("")]).optional().nullable(),
  company: optStr(200),
  nationality: optStr(100),
  country: optStr(100),
  idType: idTypeEnum.optional().nullable(),
  idNumber: optStr(100),
  dateOfBirth: optStr(64),
  arrivalDate: optStr(64),
  departureDate: optStr(64),
  roomId: optStr(64),
  mealPlan: mealPlanEnum.optional().nullable(),
  signatureData: optStr(2_000_000),
  passportPhoto: optStr(10_000_000),
  chipPhoto: optStr(10_000_000),
  passportImagePath: optStr(500),
  rawMrzData: optStr(500),
};

// Forbidden keys are rejected by .strict() — id, cardNo, createdAt, updatedAt, etc.
export const regCardCreateSchema = z.object(fields).strict();
export const regCardUpdateSchema = z.object(fields).strict();

export type RegCardCreateInput = z.infer<typeof regCardCreateSchema>;
export type RegCardUpdateInput = z.infer<typeof regCardUpdateSchema>;

const DATE_FIELDS = new Set([
  "date",
  "dateOfBirth",
  "arrivalDate",
  "departureDate",
  "checkOutDate",
]);

// Convert validated input to Prisma `data` shape: empty strings → null, ISO strings → Date.
export function toPrismaData(input: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined) continue;
    if (DATE_FIELDS.has(key)) {
      if (typeof value === "string" && value.trim()) {
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) {
          throw new Error(`Invalid date for field "${key}"`);
        }
        out[key] = d;
      } else {
        out[key] = null;
      }
      continue;
    }
    if (typeof value === "string") {
      out[key] = value.trim() === "" ? null : value;
    } else {
      out[key] = value;
    }
  }
  return out;
}
