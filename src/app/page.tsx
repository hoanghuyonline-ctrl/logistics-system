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
} from "@/components/landing";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <LandingNavbar />
      <LandingHero />
      <LandingStats />
      <LandingServices />
      <LandingHowItWorks />
      <LandingOrderTracking />
      <LandingLocations />
      <LandingCTA />
      <LandingFooter />
    </div>
  );
}
