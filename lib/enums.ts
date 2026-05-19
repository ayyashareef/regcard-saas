/**
 * Single source of truth for the value sets that used to be Prisma `enum`s.
 *
 * SQLite (local dev) does not support Prisma enums, so these columns are
 * `String` in schema.prisma. Validity is enforced here in the app layer:
 * - `*_VALUES` arrays are usable directly by `z.enum(...)`.
 * - `*` union types give compile-time safety in TS code.
 *
 * Keep these in sync with schema.prisma. When the production datasource is
 * Postgres these same string values remain valid, so the codebase is portable.
 */

export const ROLE_VALUES = [
  "PLATFORM_ADMIN",
  "SUPER_ADMIN",
  "MANAGER",
  "STAFF",
] as const;
export type Role = (typeof ROLE_VALUES)[number];

export const ORG_STATUS_VALUES = ["ACTIVE", "SUSPENDED"] as const;
export type OrgStatus = (typeof ORG_STATUS_VALUES)[number];

export const ID_TYPE_VALUES = [
  "TOURIST",
  "MALDIVIAN",
  "WORK_PERMIT",
  "DIPLOMAT",
] as const;
export type IdType = (typeof ID_TYPE_VALUES)[number];

export const MEAL_PLAN_VALUES = ["BB", "HB", "FB"] as const;
export type MealPlan = (typeof MEAL_PLAN_VALUES)[number];

export const EXTENSION_STATUS_VALUES = [
  "PENDING",
  "APPROVED",
  "REJECTED",
] as const;
export type ExtensionStatus = (typeof EXTENSION_STATUS_VALUES)[number];

export const AUDIT_ACTION_VALUES = [
  "REG_CARD_CREATED",
  "REG_CARD_UPDATED",
  "REG_CARD_DELETED",
  "REG_CARD_PDF_DOWNLOADED",
  "USER_CREATED",
  "USER_UPDATED",
  "USER_DEACTIVATED",
  "USER_LOGIN",
  "USER_LOGOUT",
  "ROOM_CREATED",
  "ROOM_UPDATED",
  "ROOM_DELETED",
  "EXTENSION_REQUESTED",
  "EXTENSION_APPROVED",
  "EXTENSION_REJECTED",
] as const;
export type AuditAction = (typeof AUDIT_ACTION_VALUES)[number];

export const AUDIT_ENTITY_VALUES = [
  "REG_CARD",
  "USER",
  "ROOM",
  "EXTENSION_REQUEST",
] as const;
export type AuditEntity = (typeof AUDIT_ENTITY_VALUES)[number];
