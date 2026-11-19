import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const ARS = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export function money(n: number) {
  return ARS.format(n);
}

const NUM = new Intl.NumberFormat("es-AR");
export function num(n: number) {
  return NUM.format(n);
}
