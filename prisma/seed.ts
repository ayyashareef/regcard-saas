import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const prisma = new PrismaClient();

type Role = "PLATFORM_ADMIN" | "SUPER_ADMIN" | "MANAGER" | "STAFF";

interface SeedAccount {
  envVar: string;
  email: string;
  name: string;
  role: Role;
}

// Tenant-scoped accounts for the default development organization.
const ACCOUNTS: SeedAccount[] = [
  { envVar: "SEED_SUPER_ADMIN_PASSWORD", email: process.env.SEED_SUPER_ADMIN_EMAIL || "superadmin@regcard.local", name: "Super Admin", role: "SUPER_ADMIN" },
  { envVar: "SEED_MANAGER_PASSWORD",     email: process.env.SEED_MANAGER_EMAIL     || "manager@regcard.local",     name: "Front Office Manager", role: "MANAGER" },
  { envVar: "SEED_STAFF_PASSWORD",       email: process.env.SEED_STAFF_EMAIL       || "staff@regcard.local",       name: "Reception Staff",      role: "STAFF" },
];

// The SaaS operator account. Lives in the reserved "_platform" organization,
// which is never exposed through tenant signup.
const PLATFORM_ACCOUNT: SeedAccount = {
  envVar: "SEED_PLATFORM_ADMIN_PASSWORD",
  email: process.env.SEED_PLATFORM_ADMIN_EMAIL || "platform@regcard.local",
  name: "Platform Admin",
  role: "PLATFORM_ADMIN",
};

const PLATFORM_ORG = { slug: "_platform", name: "Platform" };
const DEFAULT_ORG = { slug: "unima", name: "Unima Grand", cardNoPrefix: "UG" };

function randomPassword(): string {
  // 24 url-safe characters, ~143 bits of entropy
  return crypto.randomBytes(18).toString("base64url");
}

function resolvePassword(envVar: string, isProd: boolean): { password: string; generated: boolean } {
  const fromEnv = process.env[envVar];
  if (fromEnv && fromEnv.length >= 12) return { password: fromEnv, generated: false };
  if (fromEnv && fromEnv.length < 12) {
    throw new Error(`${envVar} must be at least 12 characters`);
  }
  if (isProd) {
    throw new Error(
      `${envVar} is not set. Refusing to seed production with a generated password — ` +
      `set all SEED_*_PASSWORD env vars explicitly before running.`
    );
  }
  return { password: randomPassword(), generated: true };
}

async function seedUser(
  orgId: string,
  acc: SeedAccount,
  isProd: boolean,
  generatedCredentials: Array<{ email: string; password: string }>
) {
  const { password, generated } = resolvePassword(acc.envVar, isProd);
  const hash = await bcrypt.hash(password, 12);

  // upsert keyed on the composite (orgId, email) unique so re-running seed
  // never overwrites an existing user's password and stays tenant-scoped.
  await prisma.user.upsert({
    where: { orgId_email: { orgId, email: acc.email } },
    update: {},
    create: {
      orgId,
      email: acc.email,
      name: acc.name,
      password: hash,
      role: acc.role,
    },
  });

  console.log(`  ${acc.role}: ${acc.email}`);
  if (generated) generatedCredentials.push({ email: acc.email, password });
}

async function main() {
  const isProd = process.env.NODE_ENV === "production";
  console.log(`Seeding database (NODE_ENV=${process.env.NODE_ENV ?? "development"})...`);

  const generatedCredentials: Array<{ email: string; password: string }> = [];

  // 1. Reserved platform organization + operator account.
  const platformOrg = await prisma.organization.upsert({
    where: { slug: PLATFORM_ORG.slug },
    update: {},
    create: { slug: PLATFORM_ORG.slug, name: PLATFORM_ORG.name },
  });
  console.log(`Organization: ${platformOrg.name} (/${platformOrg.slug})`);
  await seedUser(platformOrg.id, PLATFORM_ACCOUNT, isProd, generatedCredentials);

  // 2. Default development tenant.
  const org = await prisma.organization.upsert({
    where: { slug: DEFAULT_ORG.slug },
    update: {},
    create: {
      slug: DEFAULT_ORG.slug,
      name: DEFAULT_ORG.name,
      cardNoPrefix: DEFAULT_ORG.cardNoPrefix,
    },
  });
  console.log(`Organization: ${org.name} (/${org.slug})`);

  for (const acc of ACCOUNTS) {
    await seedUser(org.id, acc, isProd, generatedCredentials);
  }

  const rooms = [
    { number: "101", floor: "1" },
    { number: "102", floor: "1" },
    { number: "103", floor: "1" },
    { number: "201", floor: "2" },
    { number: "202", floor: "2" },
    { number: "203", floor: "2" },
    { number: "301", floor: "3" },
    { number: "302", floor: "3" },
    { number: "401", floor: "4" },
    { number: "501", floor: "5" },
  ];

  for (const room of rooms) {
    await prisma.room.upsert({
      where: { orgId_number: { orgId: org.id, number: room.number } },
      update: {},
      create: { orgId: org.id, ...room },
    });
  }
  console.log(`  ${rooms.length} rooms`);

  console.log("\nSeed complete.");

  if (generatedCredentials.length > 0) {
    // Only printed in non-production. Capture these now — they cannot be recovered.
    console.log("\nGenerated dev credentials (printed once, not stored anywhere):");
    for (const { email, password } of generatedCredentials) {
      console.log(`  ${email} / ${password}`);
    }
    console.log("\nFor production, set the SEED_*_PASSWORD env vars explicitly.");
  }
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
