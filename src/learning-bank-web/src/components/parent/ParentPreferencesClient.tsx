"use client";

import { useEffect, useState } from "react";
import {
  supportedCurrencies,
  supportedDateFormats,
  useUserPreferences,
  type CurrencyCode,
  type DateFormatPreference,
} from "@/lib/user-preferences";

export function ParentPreferencesClient() {
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const [dateFormat, setDateFormat] = useState<DateFormatPreference>("MM-DD-YYYY");
  const [saved, setSaved] = useState(false);
  const { currency: savedCurrency, dateFormat: savedDateFormat, savePreferences } = useUserPreferences();

  useEffect(() => {
    setCurrency(savedCurrency);
    setDateFormat(savedDateFormat);
  }, [savedCurrency, savedDateFormat]);

  const onSave = () => {
    savePreferences({ currency, dateFormat });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  };

  return (
    <section className="bg-white rounded-[24px] p-5 border border-[#dbe2d7] shadow-[0_12px_24px_-20px_rgba(0,0,0,0.45)]">
      <h2 className="text-lg font-black text-[#0e0f0c]">Display Preferences</h2>
      <p className="text-sm text-[#454745] mt-1">
        These settings control how money and dates are shown in dashboards.
      </p>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="settings-currency" className="block text-sm font-semibold text-[#0e0f0c] mb-1.5">
            Currency (ISO 4217)
          </label>
          <select
            id="settings-currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
            className="w-full rounded-[12px] border border-[#0e0f0c] px-4 py-3 text-[#0e0f0c] text-base focus:outline-none focus:ring-2 focus:ring-[#9fe870] focus:border-transparent bg-white"
          >
            {supportedCurrencies.map((item) => (
              <option key={item.code} value={item.code}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="settings-date-format" className="block text-sm font-semibold text-[#0e0f0c] mb-1.5">
            Preferred Date Format
          </label>
          <select
            id="settings-date-format"
            value={dateFormat}
            onChange={(e) => setDateFormat(e.target.value as DateFormatPreference)}
            className="w-full rounded-[12px] border border-[#0e0f0c] px-4 py-3 text-[#0e0f0c] text-base focus:outline-none focus:ring-2 focus:ring-[#9fe870] focus:border-transparent bg-white"
          >
            {supportedDateFormats.map((item) => (
              <option key={item.code} value={item.code}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={onSave}
          className="px-5 py-2.5 rounded-[24px] bg-[#9fe870] text-[#0e0f0c] font-semibold hover:bg-[#cdffad] transition-colors"
        >
          Save Preferences
        </button>
        {saved && <span className="text-sm font-semibold text-[#2ead4b]">Saved</span>}
      </div>
    </section>
  );
}
