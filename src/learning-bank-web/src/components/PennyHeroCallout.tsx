import { AnimatedPennyMascot } from "@/components/AnimatedPennyMascot";

export function PennyHeroCallout() {
  return (
    <div className="flex min-h-[360px] justify-center lg:justify-end">
      <div className="relative w-full max-w-[460px] pt-2 sm:pt-4 lg:pt-6">
        <div className="absolute bottom-[17rem] left-0 z-20 w-[250px] rounded-[28px] border border-[#c5edab] bg-white px-4 py-4 text-[#0e0f0c] shadow-[0_18px_40px_-28px_rgba(14,15,12,0.45)] sm:bottom-[18.25rem] sm:left-2 lg:bottom-[19.75rem] lg:left-1">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#2ead4b]">Hi, I&apos;m Penny</p>
          <p className="mt-2 text-sm leading-6 text-[#454745]">
            I help children understand deposits, savings, transfers, transaction history, and good money habits.
            Tap my guide whenever you want a friendly walkthrough.
          </p>
          <div className="absolute -bottom-2 right-14 h-4 w-4 rotate-45 border-b border-r border-[#c5edab] bg-white" />
        </div>

        <AnimatedPennyMascot />
      </div>
    </div>
  );
}
