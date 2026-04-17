"use client";

import { useUser } from "@stackframe/stack";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import FeaturesSection from "@/components/landingPage/components/FeaturesSection";
import FooterSection from "@/components/landingPage/components/FooterSection";
import HeroSection from "@/components/landingPage/components/HeroSection";
import Navbar from "@/components/landingPage/components/Navbar";
import PricingSection from "@/components/landingPage/components/PricingSection";
import { useGitHubConnection } from "@/hooks/useGitHubConnection";

export default function LandingPage() {
  const router = useRouter();
  const user = useUser({ or: "return-null" });
  const isAuthenticated = Boolean(user && !user.isAnonymous);

  const { githubConnected, githubUsername, githubAvatar, isLoading } = useGitHubConnection(isAuthenticated);

  useEffect(() => {
    if (isAuthenticated && githubConnected && !isLoading) {
      router.replace("/dashboard");
    }
  }, [githubConnected, isAuthenticated, isLoading, router]);

  return (
    <div className="relative min-h-screen overflow-x-clip bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-24 top-12 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.24),transparent_70%)] blur-2xl" />
        <div className="absolute right-0 top-52 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(14,165,233,0.18),transparent_72%)] blur-2xl" />
        <div className="absolute bottom-0 left-1/2 h-64 w-140 -translate-x-1/2 bg-[radial-gradient(ellipse,rgba(16,185,129,0.12),transparent_72%)]" />
      </div>

      <Navbar
        isAuthenticated={isAuthenticated}
        githubConnected={githubConnected}
        githubUsername={githubUsername}
        githubAvatar={githubAvatar}
        isGitHubLoading={isLoading}
      />

      <main>
        <HeroSection
          isAuthenticated={isAuthenticated}
          githubConnected={githubConnected}
          githubUsername={githubUsername}
          githubAvatar={githubAvatar}
          isGitHubLoading={isLoading}
        />
        <FeaturesSection />
        <PricingSection />
      </main>

      <FooterSection />
    </div>
  );
}
