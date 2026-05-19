import { parse as parseMrz } from "mrz";
import sharp from "sharp";
import type { PSM } from "tesseract.js";

export interface ParsedMrz {
  success: true;
  data: {
    surname: string;
    givenNames: string;
    documentNumber: string;
    nationality: string;
    birthDate: string;
    expirationDate: string;
  };
  confidence: number;
}

export interface ScanError {
  success: false;
  reason: "low_confidence" | "checksum_failed" | "parse_error" | "no_mrz_found";
  message: string;
}

export interface ParsedNid {
  success: true;
  type: "nid";
  data: {
    idNumber: string;
  };
  confidence: number;
}

export type ScanResult = ParsedMrz | ParsedNid | ScanError;

function formatMrzDate(yymmdd: string): string {
  if (!yymmdd || yymmdd.length !== 6) return "";
  const yy = parseInt(yymmdd.substring(0, 2));
  const mm = yymmdd.substring(2, 4);
  const dd = yymmdd.substring(4, 6);
  const year = yy > 50 ? 1900 + yy : 2000 + yy;
  return `${year}-${mm}-${dd}`;
}

/**
 * Clean up common OCR misreads in MRZ lines.
 * MRZ only contains A-Z, 0-9, and < so any other chars are errors.
 */
function cleanMrzLine(line: string): string {
  let cleaned = line.toUpperCase().replace(/\s/g, "");
  // Common OCR substitution errors for '<' filler
  cleaned = cleaned.replace(/[LlIi|!1}{)\]]/g, (ch) => {
    // In context of MRZ, sequences of L/l/I at the end or between names are likely '<'
    return ch;
  });

  // Replace characters that can't appear in MRZ
  cleaned = cleaned.replace(/[^A-Z0-9<]/g, "<");

  return cleaned;
}

/**
 * Try to extract valid MRZ lines from OCR text.
 * Handles TD1 (30 chars, 3 lines), TD2 (36, 2 lines), TD3/passport (44, 2 lines).
 */
function extractMrzLines(text: string): string[] {
  const rawLines = text
    .split("\n")
    .map((l) => cleanMrzLine(l))
    .filter((l) => l.length >= 28 && l.includes("<"));

  if (rawLines.length === 0) return [];

  // Try to find TD3 passport lines (44 chars)
  // The first line starts with P
  const td3Candidates = rawLines.filter((l) => l.length >= 42 && l.length <= 46);

  if (td3Candidates.length >= 2) {
    // Normalize to exactly 44 chars
    const normalized = td3Candidates.map((l) => {
      if (l.length > 44) {
        // Try trimming trailing noise first
        const trimmed = l.replace(/<*[^A-Z0-9<]*$/, "");
        if (trimmed.length <= 44) return trimmed.padEnd(44, "<");
        return l.substring(0, 44);
      }
      return l.padEnd(44, "<");
    });

    // Fix common first-line errors: position 1 should be '<' or type char
    if (normalized[0].startsWith("P") && normalized[0][1] !== "<") {
      // Check if position 1 looks like it should be '<'
      const ch = normalized[0][1];
      if ("RLIJ".includes(ch)) {
        normalized[0] = "P<" + normalized[0].substring(2);
      }
    }

    // Fix trailing L/l sequences that should be '<'
    normalized[0] = fixTrailingFillers(normalized[0], 44);
    normalized[1] = fixTrailingFillers(normalized[1], 44);

    return normalized.slice(-2);
  }

  // Try TD1 (30 chars, 3 lines)
  const td1Candidates = rawLines.filter((l) => l.length >= 28 && l.length <= 32);
  if (td1Candidates.length >= 3) {
    return td1Candidates.slice(-3).map((l) => {
      const n = l.length > 30 ? l.substring(0, 30) : l.padEnd(30, "<");
      return fixTrailingFillers(n, 30);
    });
  }

  // Return whatever we have
  return rawLines;
}

/**
 * Replace trailing sequences of L, I, S, etc. that should be '<' filler.
 * In MRZ, the name field is padded with '<' at the end.
 */
function fixTrailingFillers(line: string, targetLen: number): string {
  const chars = line.split("");
  // Common OCR misreads of '<' filler character
  const fillerLike = new Set("LSCIK1".split(""));
  let i = chars.length - 1;

  // Walk backwards replacing filler misreads
  while (i >= 0) {
    if (chars[i] === "<") {
      i--;
      continue;
    }
    if (fillerLike.has(chars[i]) && i > targetLen * 0.5) {
      chars[i] = "<";
      i--;
    } else {
      break;
    }
  }

  // Also fix mixed filler sequences: e.g. "<<<K<LLL" -> "<<<<<<<<"
  // Scan for runs where <, L, K, S, C, I are mixed
  const result = chars.join("");
  return result.replace(/(<[LSCIK1]*){2,}/g, (match) => "<".repeat(match.length));
}

async function ocrImage(buffer: Buffer, psm: string = "6"): Promise<{ text: string; confidence: number }> {
  const { createWorker } = require("tesseract.js") as typeof import("tesseract.js");
  const worker = await createWorker("eng");

  await worker.setParameters({
    tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<",
    tessedit_pageseg_mode: psm as PSM,
  });

  const { data } = await worker.recognize(buffer);
  await worker.terminate();

  return { text: data.text, confidence: data.confidence };
}

/**
 * Create multiple preprocessed versions of the MRZ zone for OCR.
 * Different preprocessing strategies work better for different image qualities.
 */
async function preprocessMrzVariants(buffer: Buffer, imgWidth: number, imgHeight: number, scale: number): Promise<Buffer[]> {
  const variants: Buffer[] = [];
  const w = imgWidth * scale;
  const h = imgHeight * scale;

  // Base: rotated + scaled grayscale
  const base = sharp(buffer).rotate().resize(w, h, { fit: "fill" }).grayscale();

  // Strategy 1: High-contrast normalized + sharpened (bottom 35%)
  try {
    variants.push(
      await base.clone()
        .normalize()
        .sharpen({ sigma: 2 })
        .extract({ left: 0, top: Math.floor(h * 0.65), width: w, height: Math.floor(h * 0.35) })
        .png()
        .toBuffer()
    );
  } catch { /* skip if extract fails */ }

  // Strategy 2: Binary threshold (best for MRZ) — bottom 40%
  try {
    variants.push(
      await base.clone()
        .normalize()
        .threshold(140)
        .extract({ left: 0, top: Math.floor(h * 0.60), width: w, height: Math.floor(h * 0.40) })
        .png()
        .toBuffer()
    );
  } catch { /* skip */ }

  // Strategy 3: Aggressive threshold with negate for dark backgrounds — bottom 40%
  try {
    variants.push(
      await base.clone()
        .normalize()
        .threshold(100)
        .negate()
        .extract({ left: 0, top: Math.floor(h * 0.60), width: w, height: Math.floor(h * 0.40) })
        .png()
        .toBuffer()
    );
  } catch { /* skip */ }

  // Strategy 4: Linear contrast stretch + sharp — bottom 30%
  try {
    variants.push(
      await base.clone()
        .linear(1.5, -30) // increase contrast
        .sharpen({ sigma: 1.5 })
        .extract({ left: 0, top: Math.floor(h * 0.70), width: w, height: Math.floor(h * 0.30) })
        .png()
        .toBuffer()
    );
  } catch { /* skip */ }

  return variants;
}

function buildResult(fields: ReturnType<typeof parseMrz>["fields"], confidence: number): ParsedMrz {
  return {
    success: true,
    data: {
      surname: fields.lastName || "",
      givenNames: fields.firstName || "",
      documentNumber: fields.documentNumber || "",
      nationality: fields.nationality || "",
      birthDate: formatMrzDate(fields.birthDate || ""),
      expirationDate: formatMrzDate(fields.expirationDate || ""),
    },
    confidence,
  };
}

/**
 * Lenient MRZ extraction — manually parse TD3 fields by position
 * when the strict parser rejects due to checksum failures.
 * TD3 Layout:
 *   Line 1 (44 chars): P<ISSSUUURRRNNNNNAAMMMEEE<<GGGIIIVVVEEENNN<<<<
 *   Line 2 (44 chars): DDDDDDDDDCNNNYYMMDDCSSYYMMDDCPPPPPPPPPPPPPPC
 */
function lenientMrzExtract(lines: string[]): ParsedMrz | null {
  if (lines.length < 2) return null;

  const line1 = lines[lines.length - 2].padEnd(44, "<");
  const line2 = lines[lines.length - 1].padEnd(44, "<");

  // Line 1 must start with P
  if (!line1.startsWith("P")) return null;

  // Extract issuing country (positions 2-4)
  const issuer = line1.substring(2, 5).replace(/</g, "");
  if (issuer.length < 2) return null;

  // Names start at position 5
  const nameField = line1.substring(5);
  const nameParts = nameField.split("<<");
  const surname = (nameParts[0] || "").replace(/</g, " ").trim();
  const givenNames = (nameParts[1] || "").replace(/</g, " ").trim();

  if (!surname) return null;

  // Line 2 fields by position
  const documentNumber = line2.substring(0, 9).replace(/</g, "").trim();
  const nationality = line2.substring(10, 13).replace(/</g, "");
  const birthDateRaw = line2.substring(13, 19);
  const expirationDateRaw = line2.substring(21, 27);

  // Validate we got something useful
  if (!documentNumber || documentNumber.length < 5) return null;
  if (!nationality || nationality.length < 2) return null;

  // Validate date-like strings (6 digits)
  const birthDate = /^\d{6}$/.test(birthDateRaw) ? formatMrzDate(birthDateRaw) : "";
  const expirationDate = /^\d{6}$/.test(expirationDateRaw) ? formatMrzDate(expirationDateRaw) : "";

  console.log(`[scan] Lenient extract: ${surname} / ${givenNames}, doc: ${documentNumber}, nat: ${nationality}`);

  return {
    success: true,
    data: {
      surname,
      givenNames,
      documentNumber,
      nationality,
      birthDate,
      expirationDate,
    },
    confidence: 0, // caller sets this
  };
}

/**
 * Lenient MRZ extraction for TD1 (work permits, ID cards) when strict checksum fails.
 * TD1 layout (3 lines × 30 chars):
 *   Line 1: TYPE(2) ISSUER(3) DOCNUM(9) CHK(1) OPT1(15)
 *   Line 2: BIRTH(6) CHK(1) SEX(1) EXPIRY(6) CHK(1) NAT(3) OPT2(11) CHK(1)
 *   Line 3: SURNAME<<GIVEN_NAMES (padded with <)
 */
function lenientTd1Extract(lines: string[]): ParsedMrz | null {
  if (lines.length < 3) return null;
  const line1 = lines[0].padEnd(30, "<");
  const line2 = lines[1].padEnd(30, "<");
  const line3 = lines[2].padEnd(30, "<");

  const documentNumber = line1.substring(5, 14).replace(/</g, "").trim();
  if (!documentNumber || documentNumber.length < 4) return null;

  const birthDateRaw = line2.substring(0, 6);
  const expirationDateRaw = line2.substring(8, 14);
  const nationality = line2.substring(15, 18).replace(/</g, "");

  const nameField = line3.replace(/</g, " ").trim();
  const nameParts = nameField.split(/\s{2,}/);
  const surname = (nameParts[0] || "").trim();
  const givenNames = (nameParts.slice(1).join(" ") || "").trim();

  const birthDate = /^\d{6}$/.test(birthDateRaw) ? formatMrzDate(birthDateRaw) : "";
  const expirationDate = /^\d{6}$/.test(expirationDateRaw) ? formatMrzDate(expirationDateRaw) : "";

  console.log(`[scan] TD1 lenient extract: ${surname} / ${givenNames}, doc: ${documentNumber}`);

  return {
    success: true,
    data: {
      surname,
      givenNames,
      documentNumber,
      nationality,
      birthDate,
      expirationDate,
    },
    confidence: 0,
  };
}

export async function scanPassport(buffer: Buffer): Promise<ScanResult> {
  try {
    const meta = await sharp(buffer).metadata();
    const imgHeight = meta.height!;
    const imgWidth = meta.width!;

    // Upscale small images for better OCR
    const minWidth = 1800;
    const scale = imgWidth < minWidth ? Math.ceil(minWidth / imgWidth) : 1;

    console.log(`[scan] Image ${imgWidth}x${imgHeight}, scale ${scale}x`);

    // Try multiple preprocessing strategies on the MRZ zone
    const variants = await preprocessMrzVariants(buffer, imgWidth, imgHeight, scale);
    
    let bestResult: { lines: string[]; confidence: number; text: string } | null = null;

    for (let i = 0; i < variants.length; i++) {
      try {
        const { text, confidence } = await ocrImage(variants[i]);
        console.log(`[scan] Strategy ${i + 1} OCR confidence: ${confidence}`);
        console.log(`[scan] Strategy ${i + 1} raw text:`, JSON.stringify(text));

        const lines = extractMrzLines(text);
        console.log(`[scan] Strategy ${i + 1} MRZ lines:`, lines);

        // TD1 (3 lines × 30) — work permits and ID cards
        if (lines.length >= 3 && lines[0].length >= 28 && lines[0].length <= 32) {
          try {
            const mrzResult = parseMrz(lines.slice(-3));
            console.log(`[scan] Strategy ${i + 1} TD1 MRZ parsed successfully`);
            return buildResult(mrzResult.fields, confidence);
          } catch {
            // Try lenient TD1
            const lenient = lenientTd1Extract(lines.slice(-3));
            if (lenient) {
              console.log(`[scan] Strategy ${i + 1} TD1 lenient extract OK`);
              return { ...lenient, confidence };
            }
            // fall through to TD3 path tracking
          }
        }

        if (lines.length >= 2) {
          // Try strict parse first (TD3)
          try {
            const mrzResult = parseMrz(lines.slice(-2));
            console.log(`[scan] Strategy ${i + 1} MRZ parsed successfully`);
            return buildResult(mrzResult.fields, confidence);
          } catch {
            // Track best candidate for lenient parse
            if (!bestResult || confidence > bestResult.confidence) {
              bestResult = { lines: lines.slice(-2), confidence, text };
            }
          }
        }
      } catch (e) {
        console.log(`[scan] Strategy ${i + 1} failed:`, e);
      }
    }

    // If we found MRZ lines but strict parse failed, try lenient extraction
    if (bestResult && bestResult.lines.length >= 2) {
      console.log(`[scan] Trying lenient MRZ extraction from best candidate`);
      const lenient = lenientMrzExtract(bestResult.lines);
      if (lenient) {
        return { ...lenient, confidence: bestResult.confidence };
      }
    }

    // Fallback: scan full image
    return await scanFullImage(buffer, scale);
  } catch (error) {
    console.error("[scan] Error:", error);
    return {
      success: false,
      reason: "parse_error",
      message: "Failed to process passport image. Please try again.",
    };
  }
}

async function scanFullImage(buffer: Buffer, scale: number): Promise<ScanResult> {
  try {
    const meta = await sharp(buffer).metadata();
    const imgWidth = meta.width!;
    const imgHeight = meta.height!;

    // Try multiple strategies with different preprocessing and PSM modes
    const preprocessed = [
      { label: "normalized+sharp", psm: "6", buf: sharp(buffer).rotate().resize(imgWidth * scale, imgHeight * scale, { fit: "fill" })
        .grayscale().normalize().sharpen({ sigma: 2 }).png().toBuffer() },
      { label: "threshold", psm: "6", buf: sharp(buffer).rotate().resize(imgWidth * scale, imgHeight * scale, { fit: "fill" })
        .grayscale().normalize().threshold(140).png().toBuffer() },
      { label: "auto-psm", psm: "3", buf: sharp(buffer).rotate().resize(imgWidth * scale, imgHeight * scale, { fit: "fill" })
        .grayscale().normalize().sharpen({ sigma: 2 }).png().toBuffer() },
      { label: "high-contrast-auto", psm: "3", buf: sharp(buffer).rotate().resize(imgWidth * scale, imgHeight * scale, { fit: "fill" })
        .grayscale().linear(1.8, -50).sharpen({ sigma: 1.5 }).png().toBuffer() },
    ];

    let bestLines: string[] = [];
    let bestConfidence = 0;

    for (let i = 0; i < preprocessed.length; i++) {
      try {
        const processed = await preprocessed[i].buf;
        const { text, confidence } = await ocrImage(processed, preprocessed[i].psm);
        console.log(`[scan] Full image strategy ${i + 1} (${preprocessed[i].label}) OCR confidence: ${confidence}`);
        console.log(`[scan] Full image strategy ${i + 1} raw text:`, JSON.stringify(text));

        const lines = extractMrzLines(text);
        console.log(`[scan] Full image strategy ${i + 1} cleaned MRZ lines:`, lines);

        if (lines.length >= 2) {
          // Try strict parse
          try {
            const mrzResult = parseMrz(lines.slice(-2));
            return buildResult(mrzResult.fields, confidence);
          } catch {
            if (confidence > bestConfidence) {
              bestLines = lines.slice(-2);
              bestConfidence = confidence;
            }
          }
        }
      } catch (e) {
        console.log(`[scan] Full image strategy ${i + 1} failed:`, e);
      }
    }

    // Try lenient extraction on best candidate
    if (bestLines.length >= 2) {
      const lenient = lenientMrzExtract(bestLines);
      if (lenient) {
        return { ...lenient, confidence: bestConfidence };
      }
    }

    return {
      success: false,
      reason: "no_mrz_found",
      message:
        "Could not detect MRZ lines. Please try again with a clearer image showing the bottom of the passport.",
    };
  } catch (error) {
    console.error("[scan] Full image error:", error);
    return {
      success: false,
      reason: "parse_error",
      message: "Failed to process passport image. Please try again.",
    };
  }
}

/**
 * Scan a Maldivian National ID card.
 * Extracts the NID number (format: A followed by digits, e.g. A201967).
 */
export async function scanIdCard(buffer: Buffer): Promise<ScanResult> {
  try {
    const meta = await sharp(buffer).metadata();
    const imgWidth = meta.width!;
    const imgHeight = meta.height!;

    const minWidth = 1200;
    const scale = imgWidth < minWidth ? Math.ceil(minWidth / imgWidth) : 1;

    const processed = await sharp(buffer)
      .rotate()
      .resize(imgWidth * scale, imgHeight * scale, { fit: "fill" })
      .grayscale()
      .normalize()
      .sharpen()
      .png()
      .toBuffer();

    const { createWorker } = require("tesseract.js") as typeof import("tesseract.js");
    const worker = await createWorker("eng");
    await worker.setParameters({
      tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ",
    });

    const { data } = await worker.recognize(processed);
    await worker.terminate();

    console.log(`[scan] NID OCR raw text:`, JSON.stringify(data.text));

    // NID format: A followed by 5-9 digits (e.g. A201967)
    const nidMatch = data.text.match(/\bA\d{5,9}\b/i);
    if (nidMatch) {
      const idNumber = nidMatch[0].toUpperCase();
      console.log(`[scan] NID found: ${idNumber}`);
      return {
        success: true,
        type: "nid",
        data: { idNumber },
        confidence: data.confidence,
      };
    }

    return {
      success: false,
      reason: "no_mrz_found",
      message: "Could not find National ID number. Please ensure the ID card is clearly visible.",
    };
  } catch (error) {
    console.error("[scan] NID scan error:", error);
    return {
      success: false,
      reason: "parse_error",
      message: "Failed to process ID card image. Please try again.",
    };
  }
}
