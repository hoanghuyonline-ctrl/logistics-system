"use client";

import {
  LandingNavbar,
  LandingHero,
  LandingStats,
  LandingServices,
  LandingHowItWorks,
  LandingOrderTracking,
  LandingLocations,
  LandingCTA,
  LandingFooter,
  LandingTrust,
  LandingLeadForm,
  LandingFloatingCTA,
  LandingMobileBar,
} from "@/components/landing";

export default function Home() {
  return (
    <div className="min-h-screen bg-white pb-14 sm:pb-0">
      <LandingNavbar />
      <LandingHero />
      <LandingStats />
      <LandingServices />
      <LandingTrust />
      <LandingHowItWorks />
      <LandingOrderTracking />
      <LandingLeadForm />
      <LandingLocations />
      <LandingCTA />
      <LandingFooter />
      <LandingFloatingCTA />
      <LandingMobileBar />
    </div>
  );
}
