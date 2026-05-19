"use client";

import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface DateInputProps {
  value: string; // yyyy-mm-dd
  onChange: (val: string) => void;
  className?: string;
}

function isoToDate(iso: string): Date | null {
  if (!iso) return null;
  const d = new Date(iso + "T00:00:00");
  return isNaN(d.getTime()) ? null : d;
}

function dateToIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function DateInput({ value, onChange, className }: DateInputProps) {
  return (
    <ReactDatePicker
      selected={isoToDate(value)}
      onChange={(date: Date | null) => onChange(date ? dateToIso(date) : "")}
      dateFormat="dd/MM/yyyy"
      placeholderText="DD/MM/YYYY"
      className={className}
      showYearDropdown
      showMonthDropdown
      dropdownMode="select"
      autoComplete="off"
    />
  );
}
