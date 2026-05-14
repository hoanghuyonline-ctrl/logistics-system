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
import ZaloQRWidget from "@/components/ui/ZaloQRWidget";

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
      <ZaloQRWidget />
    </div>
  );
}
