import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LandingScreenshotGallery } from "@/components/LandingScreenshotGallery";
import { PennyHeroCallout } from "@/components/PennyHeroCallout";

const screenshotCards = [
  {
    title: "Parent dashboard",
    caption: "Parents can review linked children, balances, and pending transfer requests in one place.",
    src: "/images/screenshots/ParentDashboard.png",
    alt: "Parent dashboard screenshot",
    className: "bg-white",
  },
  {
    title: "Settings",
    caption: "Family display preferences for currency and dates live alongside category management.",
    src: "/images/screenshots/Settings.png",
    alt: "Settings page screenshot",
    className: "bg-[#e2f6d5]",
  },
  {
    title: "Penny guide",
    caption: "Penny walks children through the dashboard and explains features the first time they use them.",
    src: "/images/screenshots/PennyGuide.png",
    alt: "Penny guide screenshot",
    className: "bg-[#0e0f0c] text-white",
  },
] as const;

export default async function HomePage() {
  const session = await auth();
  if (session) {
    redirect("/dashboard");
  }

  const heroScreenshot = {
    title: "Child dashboard",
    caption: "A guided view for children",
    src: "/images/screenshots/ChildView.png",
    alt: "Child dashboard screenshot",
    className: "bg-white",
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#e8ebe6] text-[#0e0f0c]">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-28 -top-28 h-96 w-96 rounded-full bg-[#9fe870]/35 blur-3xl" />
        <div className="absolute right-[-8rem] top-[16rem] h-[26rem] w-[26rem] rounded-full bg-[#c5edab]/50 blur-3xl" />
        <div className="absolute bottom-[-10rem] left-[30%] h-[22rem] w-[22rem] rounded-full bg-[#2ead4b]/20 blur-3xl" />
        <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,rgba(22,51,0,0.04)_0,rgba(22,51,0,0.04)_1px,transparent_1px,transparent_40px),repeating-linear-gradient(0deg,rgba(22,51,0,0.04)_0,rgba(22,51,0,0.04)_1px,transparent_1px,transparent_40px)]" />
      </div>

      <header className="mx-auto flex w-full max-w-6xl items-center justify-end px-6 py-5 lg:px-10">
        <a
          href="/sign-in"
          className="rounded-[24px] bg-[#9fe870] px-5 py-2.5 text-sm font-semibold text-[#0e0f0c] transition-colors hover:bg-[#cdffad]"
        >
          Sign in
        </a>
      </header>

      <section className="mx-auto w-full max-w-6xl px-6 pb-2 lg:px-10">
        <div className="relative overflow-hidden rounded-[28px] border border-[#c5edab] bg-[linear-gradient(130deg,#ffffff_0%,#e2f6d5_48%,#c5edab_100%)] px-8 py-8 shadow-[0_28px_75px_-55px_rgba(14,15,12,0.65)] sm:px-10 sm:py-10 lg:px-12 lg:py-12">
          <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-[#9fe870]/45 blur-2xl" />
          <div className="absolute -bottom-8 left-1/3 h-28 w-28 rounded-full border border-[#163300]/20" />
          <div className="relative">
            <img src="/images/learning-bank-logo.svg" alt="Learning Bank" className="h-24 w-auto sm:h-28 lg:h-36" />
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-8 px-6 pb-8 pt-6 lg:grid-cols-[1.15fr_.85fr] lg:items-start lg:px-10 lg:pt-10">
        <div className="max-w-3xl">
          <p className="mb-4 inline-flex rounded-[9999px] bg-[#e2f6d5] px-3 py-1 text-xs font-semibold text-[#163300]">
            Safe money learning for kids
          </p>
          <h1 className="max-w-2xl text-5xl font-black leading-[0.95] tracking-[-0.02em] sm:text-6xl lg:text-7xl">
            Learn money habits with a real-world banking experience.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-[#454745] sm:text-lg">
            Learning Bank helps children practice saving and spending with parent-supervised accounts. Kids
            can make deposits, move money to savings, and request transfers back to checking while parents
            stay in control. The screenshots below show the child experience, the parent dashboard, the family
            settings page, and Penny&apos;s guided tour.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="/sign-in"
              className="rounded-[24px] bg-[#9fe870] px-6 py-3 font-semibold text-[#0e0f0c] transition-colors hover:bg-[#cdffad]"
            >
              Get started
            </a>
          </div>
          <p className="mt-4 text-sm text-[#868685]">No real money movement. Designed for guided learning.</p>
        </div>

        <PennyHeroCallout />
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 pb-12 pt-8 lg:px-10 lg:pb-14 lg:pt-10">
        <LandingScreenshotGallery heroScreenshot={heroScreenshot} gallery={screenshotCards} />
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 py-10 lg:px-10 lg:py-14">
        <h2 className="text-3xl font-black leading-tight sm:text-4xl">Built to teach smart money decisions</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-[24px] bg-white p-6">
            <h3 className="text-lg font-semibold">Checking and savings side-by-side</h3>
            <p className="mt-2 text-sm leading-6 text-[#454745]">
              Kids can see balances and transaction history clearly so they connect actions with outcomes.
            </p>
          </article>
          <article className="rounded-[24px] bg-white p-6">
            <h3 className="text-lg font-semibold">Parent-approved transfer requests</h3>
            <p className="mt-2 text-sm leading-6 text-[#454745]">
              Savings to checking transfers are requested by the child and approved or rejected by a parent.
            </p>
          </article>
          <article className="rounded-[24px] bg-white p-6">
            <h3 className="text-lg font-semibold">Meaningful deposit categories</h3>
            <p className="mt-2 text-sm leading-6 text-[#454745]">
              Track allowance, gifts, chores, and more to reinforce where money comes from.
            </p>
          </article>
          <article className="rounded-[24px] bg-white p-6">
            <h3 className="text-lg font-semibold">Read-only spending visibility</h3>
            <p className="mt-2 text-sm leading-6 text-[#454745]">
              Parents record real-world withdrawals and children can review them as part of the learning loop.
            </p>
          </article>
          <article className="rounded-[24px] bg-[#0e0f0c] p-6 text-white xl:col-span-4">
            <h3 className="text-lg font-semibold text-[#c5edab]">Family settings and guided help</h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#dfe6d8]">
              The family settings page controls currency and date presentation, and Penny can guide children
              through the dashboard the first time they log in or whenever they need help.
            </p>
          </article>
        </div>
      </section>

    </main>
  );
}
