"use client";

import Image from "next/image";
import { useState } from "react";

interface ScreenshotItem {
  title: string;
  caption: string;
  src: string;
  alt: string;
  className: string;
}

interface LandingScreenshotGalleryProps {
  heroScreenshot: ScreenshotItem;
  gallery: readonly ScreenshotItem[];
}

export function LandingScreenshotGallery({ heroScreenshot, gallery }: LandingScreenshotGalleryProps) {
  const [selected, setSelected] = useState<ScreenshotItem | null>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => setSelected(heroScreenshot)}
        className="block w-full overflow-hidden rounded-[24px] border border-[#c5edab] bg-white text-left shadow-[0_20px_60px_-40px_rgba(14,15,12,0.4)] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9fe870]"
        aria-label={`Open ${heroScreenshot.title} screenshot`}
      >
        <div className="bg-[#0e0f0c] px-4 py-3 text-[#9fe870]">
          <p className="text-xs uppercase tracking-[0.08em] text-[#c5edab]">Child dashboard</p>
          <p className="mt-1 text-lg font-semibold text-white">A guided view for children</p>
        </div>
        <Image
          src={heroScreenshot.src}
          alt={heroScreenshot.alt}
          width={1200}
          height={900}
          priority
          className="h-[420px] w-full object-cover object-top"
        />
      </button>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {gallery.map((card) => (
          <article key={card.title} className={`overflow-hidden rounded-[24px] p-5 ${card.className}`}>
            <h3 className={`text-lg font-semibold ${card.className.includes("text-white") ? "text-white" : "text-[#0e0f0c]"}`}>
              {card.title}
            </h3>
            <p className={`mt-2 text-sm leading-6 ${card.className.includes("text-white") ? "text-[#dfe6d8]" : "text-[#454745]"}`}>
              {card.caption}
            </p>
            <button
              type="button"
              onClick={() => setSelected(card)}
              className="mt-4 block w-full overflow-hidden rounded-[16px] border border-[#dbe2d7] bg-white text-left shadow-[0_12px_30px_-24px_rgba(0,0,0,0.35)] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9fe870]"
              aria-label={`Open ${card.title} screenshot`}
            >
              <Image
                src={card.src}
                alt={card.alt}
                width={1200}
                height={900}
                className="h-52 w-full object-cover object-top"
              />
            </button>
          </article>
        ))}
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 px-4 py-6"
          role="dialog"
          aria-modal="true"
          aria-label={selected.title}
          onClick={() => setSelected(null)}
        >
          <div
            className="relative w-full max-w-6xl overflow-hidden rounded-[24px] bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-[#e8ebe6] px-4 py-3 sm:px-5">
              <div>
                <h2 className="text-lg font-black text-[#0e0f0c]">{selected.title}</h2>
                <p className="text-sm text-[#454745]">{selected.caption}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-[16px] bg-[#e8ebe6] px-3 py-2 text-sm font-semibold text-[#0e0f0c] transition-colors hover:bg-[#c5edab]"
              >
                Close
              </button>
            </div>
            <div className="max-h-[85vh] overflow-auto bg-[#0e0f0c] p-3 sm:p-4">
              <Image
                src={selected.src}
                alt={selected.alt}
                width={1600}
                height={1200}
                className="h-auto w-full rounded-[16px] object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
