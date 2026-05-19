"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createRegCard, updateRegCard } from "@/lib/actions/reg-cards";
import { PassportScanner } from "@/components/passport-scanner";
import { SignaturePad } from "@/components/reg-card-form/signature-pad";
import { DateInput } from "@/components/reg-card-form/date-input";

const regCardSchema = z.object({
  date: z.string().optional(),
  checkInTime: z.string().optional(),
  checkOutTime: z.string().optional(),
  checkOutDate: z.string().optional(),
  guestName: z.string().optional(),
  contactNo: z.string().optional(),
  whatsappNo: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  company: z.string().optional(),
  nationality: z.string().optional(),
  country: z.string().optional(),
  idType: z.enum(["TOURIST", "MALDIVIAN", "WORK_PERMIT", "DIPLOMAT"]),
  idNumber: z.string().optional(),
  dateOfBirth: z.string().optional(),
  arrivalDate: z.string().optional(),
  departureDate: z.string().optional(),
  roomId: z.string().optional(),
  mealPlan: z.enum(["BB", "HB", "FB"]).optional().or(z.literal("")),
  signatureData: z.string().optional(),
  passportPhoto: z.string().optional(),
  chipPhoto: z.string().optional(),
  rawMrzData: z.string().optional(),
});

type RegCardForm = z.infer<typeof regCardSchema>;

interface Room {
  id: string;
  number: string;
  floor: string | null;
  type: string | null;
}

interface RegCardFormProps {
  rooms: Room[];
  initialData?: RegCardForm & { id?: string; cardNo?: string };
  isEdit?: boolean;
}

const idTypeLabels: Record<string, { label: string; fieldLabel: string }> = {
  TOURIST: { label: "Tourist", fieldLabel: "PP No:" },
  MALDIVIAN: { label: "Maldivian", fieldLabel: "NID No:" },
  WORK_PERMIT: { label: "Work Permit Holder", fieldLabel: "WP No:" },
  DIPLOMAT: { label: "Diplomat", fieldLabel: "Passport No:" },
};

export function RegCardFormComponent({ rooms, initialData, isEdit }: RegCardFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [returningGuest, setReturningGuest] = useState<{
    type: string;
    message: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<RegCardForm>({
    resolver: zodResolver(regCardSchema),
    defaultValues: {
      date: initialData?.date || new Date().toISOString().slice(0, 10),
      idType: initialData?.idType || "TOURIST",
      ...initialData,
    },
  });

  const idType = watch("idType");

  const checkReturningGuest = useCallback(async (data: {
    idNumber?: string;
    guestName?: string;
    dateOfBirth?: string;
  }) => {
    if (!data.idNumber && !data.guestName) return;

    try {
      const res = await fetch("/api/reg-cards/returning-guest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (result?.type) {
        setReturningGuest(result);
      }
    } catch {
      // Silently ignore
    }
  }, []);

  function handleScanResult(data: {
    surname: string;
    givenNames: string;
    documentNumber: string;
    nationality: string;
    birthDate: string;
    expirationDate: string;
  }) {
    const opts = { shouldDirty: true, shouldValidate: true } as const;
    setValue("guestName", [data.surname, data.givenNames].filter(Boolean).join(" "), opts);
    setValue("idNumber", data.documentNumber, opts);
    setValue("nationality", data.nationality, opts);
    setValue("country", data.nationality, opts);
    setValue("dateOfBirth", data.birthDate, opts);
    setValue("rawMrzData", JSON.stringify(data));

    toast.success("Passport data applied to form");

    checkReturningGuest({
      idNumber: data.documentNumber,
      guestName: [data.surname, data.givenNames].filter(Boolean).join(" "),
      dateOfBirth: data.birthDate,
    });
  }

  async function onSubmit(data: RegCardForm) {
    setLoading(true);
    try {
      if (isEdit && initialData?.id) {
        await updateRegCard(initialData.id, data as Record<string, unknown>);
        toast.success("Registration card updated");
        router.push(`/reg-cards/${initialData.id}`);
      } else {
        const result = await createRegCard(data);
        toast.success(`Card ${result.cardNo} created`);
        router.push(`/reg-cards/${result.id}`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const inputClass = "w-full px-3 py-2 rounded-lg border border-neutral-border focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand text-sm bg-white";
  const labelClass = "block text-sm font-medium text-neutral-text mb-1";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {returningGuest && (
        <div
          className={`px-4 py-3 rounded-lg border text-sm font-medium ${
            returningGuest.type === "definitive"
              ? "bg-green-50 text-green-800 border-green-200"
              : "bg-amber-50 text-amber-800 border-amber-200"
          }`}
        >
          {returningGuest.message}
        </div>
      )}

      {isEdit && initialData?.cardNo && (
        <div className="bg-brand/5 border border-brand/20 rounded-lg px-4 py-3">
          <span className="text-sm text-neutral-muted">Card Number: </span>
          <span className="font-bold text-brand-deep">{initialData.cardNo}</span>
        </div>
      )}

      {/* ID Type & Scanner */}
      <section className="bg-white rounded-xl border border-neutral-border p-5 space-y-4">
        <h3 className="font-semibold text-brand-deep border-b border-neutral-border pb-2">
          Identification
        </h3>

        <div>
          <label className={labelClass}>Guest Type</label>
          <select {...register("idType")} className={inputClass}>
            {Object.entries(idTypeLabels).map(([value, { label }]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <PassportScanner
          onScanResult={handleScanResult}
          onNidResult={(nid) => {
            setValue("idNumber", nid.idNumber, { shouldDirty: true, shouldValidate: true });
            toast.success("National ID number applied to form");
            checkReturningGuest({ idNumber: nid.idNumber });
          }}
          onPassportPhoto={(photo) => setValue("passportPhoto", photo)}
          idType={idType}
        />

        <div>
          <label className={labelClass}>{idTypeLabels[idType]?.fieldLabel || "ID No:"}</label>
          <input
            {...register("idNumber")}
            className={inputClass}
            onBlur={(e) => checkReturningGuest({ idNumber: e.target.value })}
          />
        </div>
      </section>

      {/* Basic Info */}
      <section className="bg-white rounded-xl border border-neutral-border p-5 space-y-4">
        <h3 className="font-semibold text-brand-deep border-b border-neutral-border pb-2">
          Basic Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className={labelClass}>Date</label>
            <Controller name="date" control={control} render={({ field }) => (
              <DateInput value={field.value || ""} onChange={field.onChange} className={inputClass} />
            )} />
          </div>
          <div>
            <label className={labelClass}>Check-in Time</label>
            <input type="time" {...register("checkInTime")} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Check-out Date</label>
            <Controller name="checkOutDate" control={control} render={({ field }) => (
              <DateInput value={field.value || ""} onChange={field.onChange} className={inputClass} />
            )} />
          </div>
          <div>
            <label className={labelClass}>Check-out Time</label>
            <input type="time" {...register("checkOutTime")} className={inputClass} />
          </div>
        </div>
      </section>

      {/* Guest Info */}
      <section className="bg-white rounded-xl border border-neutral-border p-5 space-y-4">
        <h3 className="font-semibold text-brand-deep border-b border-neutral-border pb-2">
          Guest Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Guest Name</label>
            <input {...register("guestName")} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Contact No</label>
            <input type="tel" {...register("contactNo")} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>WhatsApp No</label>
            <input type="tel" {...register("whatsappNo")} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input type="email" {...register("email")} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Booking Method</label>
            <select {...register("company")} className={inputClass}>
              <option value="">Select...</option>
              <optgroup label="OTA (Online Travel Agents)">
                <option value="Booking.com">Booking.com</option>
                <option value="Agoda">Agoda</option>
                <option value="Expedia">Expedia</option>
                <option value="Mytrip">Mytrip</option>
              </optgroup>
              <option value="Direct Booking">Direct Booking</option>
              <option value="Foreign Tour Operator">Foreign Tour Operator</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Nationality</label>
            <input {...register("nationality")} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Country</label>
            <input {...register("country")} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Date of Birth</label>
            <Controller name="dateOfBirth" control={control} render={({ field }) => (
              <DateInput value={field.value || ""} onChange={field.onChange} className={inputClass} />
            )} />
          </div>
        </div>
      </section>

      {/* Stay Details */}
      <section className="bg-white rounded-xl border border-neutral-border p-5 space-y-4">
        <h3 className="font-semibold text-brand-deep border-b border-neutral-border pb-2">
          Stay Details
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Arrival Date</label>
            <Controller name="arrivalDate" control={control} render={({ field }) => (
              <DateInput value={field.value || ""} onChange={field.onChange} className={inputClass} />
            )} />
          </div>
          <div>
            <label className={labelClass}>Departure Date</label>
            <Controller name="departureDate" control={control} render={({ field }) => (
              <DateInput value={field.value || ""} onChange={field.onChange} className={inputClass} />
            )} />
          </div>
          <div>
            <label className={labelClass}>Room</label>
            <select {...register("roomId")} className={inputClass}>
              <option value="">Select room...</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.number}{room.type ? ` — ${room.type}` : ""}{room.floor ? ` (Floor ${room.floor})` : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Meal Plan</label>
            <select {...register("mealPlan")} className={inputClass}>
              <option value="">Select...</option>
              <option value="BB">BB — Bed & Breakfast</option>
              <option value="HB">HB — Half Board</option>
              <option value="FB">FB — Full Board</option>
            </select>
          </div>
        </div>
      </section>

      {/* Disclaimer & Signature */}
      <section className="bg-white rounded-xl border border-neutral-border p-5 space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
          <p className="text-xs text-amber-900 leading-relaxed">
            The safekeeping of money, jewels and other valuable brought to the Guest House (Unima Grand) are sole responsibility of the guests. Unima Grand accept no liability and shall not be responsible for any loss or damage thereto and guest remain solely responsible for the safekeeping of any such item.
          </p>
        </div>
        <h3 className="font-semibold text-brand-deep border-b border-neutral-border pb-2">
          Guest Signature
        </h3>
        <SignaturePad
          value={watch("signatureData")}
          onChange={(data) => setValue("signatureData", data)}
        />
      </section>

      {/* Submit */}
      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2.5 rounded-lg border border-neutral-border text-sm font-medium text-neutral-text hover:bg-neutral-section transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="bg-brand text-white px-8 py-2.5 rounded-lg text-sm font-semibold hover:bg-brand-light active:bg-brand-dark disabled:opacity-50 transition"
        >
          {loading
            ? "Saving…"
            : isEdit
            ? "Update Card"
            : "Create Card"}
        </button>
      </div>
    </form>
  );
}
