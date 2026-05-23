"use client";

import { LandingNavbar, LandingFooter, LandingMobileBar } from "@/components/landing";
import LandingOrderTracking from "@/components/landing/LandingOrderTracking";

export default function TrackingPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col pb-14 sm:pb-0">
      <LandingNavbar />
      <main className="flex-1">
        <LandingOrderTracking />
      </main>
      <LandingFooter />
      <LandingMobileBar />
    </div>
  );
}
