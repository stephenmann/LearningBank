"use client";

import {
  createContext,
  createElement,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type CurrencyCode =
  | "USD"
  | "EUR"
  | "GBP"
  | "JPY"
  | "CAD"
  | "AUD"
  | "CHF"
  | "INR"
  | "CNY"
  | "MXN";

export type DateFormatPreference = "MM-DD-YYYY" | "DD-MM-YYYY" | "YYYY-MM-DD";

export interface UserPreferences {
  currency: CurrencyCode;
  dateFormat: DateFormatPreference;
}

interface CurrencyFormatConfig {
  locale: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

const STORAGE_KEY = "learningbank:user-preferences";
const UPDATE_EVENT = "learningbank:user-preferences-updated";
const PreferenceScopeContext = createContext<string>("default");

const defaultPreferences: UserPreferences = {
  currency: "USD",
  dateFormat: "MM-DD-YYYY",
};

export const supportedCurrencies: Array<{ code: CurrencyCode; label: string }> = [
  { code: "USD", label: "US Dollar (USD)" },
  { code: "EUR", label: "Euro (EUR)" },
  { code: "GBP", label: "British Pound (GBP)" },
  { code: "JPY", label: "Japanese Yen (JPY)" },
  { code: "CAD", label: "Canadian Dollar (CAD)" },
  { code: "AUD", label: "Australian Dollar (AUD)" },
  { code: "CHF", label: "Swiss Franc (CHF)" },
  { code: "INR", label: "Indian Rupee (INR)" },
  { code: "CNY", label: "Chinese Yuan (CNY)" },
  { code: "MXN", label: "Mexican Peso (MXN)" },
];

export const supportedDateFormats: Array<{ code: DateFormatPreference; label: string }> = [
  { code: "MM-DD-YYYY", label: "MM/DD/YYYY" },
  { code: "DD-MM-YYYY", label: "DD/MM/YYYY" },
  { code: "YYYY-MM-DD", label: "YYYY-MM-DD" },
];

const currencyFormatConfig: Record<CurrencyCode, CurrencyFormatConfig> = {
  USD: { locale: "en-US" },
  EUR: { locale: "de-DE" },
  GBP: { locale: "en-GB" },
  JPY: { locale: "ja-JP", minimumFractionDigits: 0, maximumFractionDigits: 0 },
  CAD: { locale: "en-CA" },
  AUD: { locale: "en-AU" },
  CHF: { locale: "de-CH" },
  INR: { locale: "en-IN" },
  CNY: { locale: "zh-CN" },
  MXN: { locale: "es-MX" },
};

function isCurrencyCode(value: unknown): value is CurrencyCode {
  return supportedCurrencies.some((item) => item.code === value);
}

function isDateFormatPreference(value: unknown): value is DateFormatPreference {
  return supportedDateFormats.some((item) => item.code === value);
}

function getStorageKey(scopeId: string) {
  return `${STORAGE_KEY}:${scopeId}`;
}

export function UserPreferenceScopeProvider({
  scopeId,
  children,
}: {
  scopeId: string;
  children: ReactNode;
}) {
  return createElement(PreferenceScopeContext.Provider, { value: scopeId }, children);
}

export function readUserPreferences(scopeId: string): UserPreferences {
  if (typeof window === "undefined") {
    return defaultPreferences;
  }

  const raw = window.localStorage.getItem(getStorageKey(scopeId));
  if (!raw) {
    return defaultPreferences;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<UserPreferences>;
    return {
      currency: isCurrencyCode(parsed.currency) ? parsed.currency : defaultPreferences.currency,
      dateFormat: isDateFormatPreference(parsed.dateFormat)
        ? parsed.dateFormat
        : defaultPreferences.dateFormat,
    };
  } catch {
    return defaultPreferences;
  }
}

export function writeUserPreferences(scopeId: string, preferences: UserPreferences) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(getStorageKey(scopeId), JSON.stringify(preferences));
  window.dispatchEvent(new CustomEvent(UPDATE_EVENT));
}

export function formatCurrencyValue(amount: number | string, currency: CurrencyCode): string {
  const numeric = typeof amount === "string" ? parseFloat(amount) : amount;
  const config = currencyFormatConfig[currency];

  return new Intl.NumberFormat(config.locale, {
    style: "currency",
    currency,
    currencyDisplay: "symbol",
    ...(config.minimumFractionDigits !== undefined ? { minimumFractionDigits: config.minimumFractionDigits } : {}),
    ...(config.maximumFractionDigits !== undefined ? { maximumFractionDigits: config.maximumFractionDigits } : {}),
  }).format(Number.isFinite(numeric) ? numeric : 0);
}

export function formatDateValue(input: string | Date, preference: DateFormatPreference): string {
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear().toString().padStart(4, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");

  if (preference === "DD-MM-YYYY") {
    return `${day}/${month}/${year}`;
  }

  if (preference === "YYYY-MM-DD") {
    return `${year}-${month}-${day}`;
  }

  return `${month}/${day}/${year}`;
}

export function useUserPreferences() {
  const scopeId = useContext(PreferenceScopeContext);
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);

  useEffect(() => {
    setPreferences(readUserPreferences(scopeId));

    const sync = () => setPreferences(readUserPreferences(scopeId));
    window.addEventListener("storage", sync);
    window.addEventListener(UPDATE_EVENT, sync);

    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(UPDATE_EVENT, sync);
    };
  }, [scopeId]);

  return useMemo(
    () => ({
      ...preferences,
      formatCurrency: (amount: number | string) => formatCurrencyValue(amount, preferences.currency),
      formatDate: (value: string | Date) => formatDateValue(value, preferences.dateFormat),
      savePreferences: (next: UserPreferences) => writeUserPreferences(scopeId, next),
    }),
    [preferences, scopeId]
  );
}
