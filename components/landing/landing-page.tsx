"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Check, Clock3, Globe, Rocket, Scale, ShieldCheck, Zap } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: Zap,
    title: "Auto Deploy",
    description:
      "Push to GitHub and Launchly builds your app instantly with zero config.",
  },
  {
    icon: Globe,
    title: "Preview URLs",
    description:
      "Every commit ships with an isolated preview link for faster reviews.",
  },
  {
    icon: Scale,
    title: "Global Scaling",
    description:
      "Deliver low-latency experiences with edge-ready infrastructure.",
  },
  {
    icon: ShieldCheck,
    title: "Secure by Default",
    description:
      "Environment secrets, scoped access, and protected deployments out of the box.",
  },
];

const pricing = [
  {
    plan: "Free",
    price: "$0",
    description: "Best for trying Launchly.",
    items: ["1 Project", "Community support", "Basic analytics"],
    cta: "Get Started",
  },
  {
    plan: "Pro",
    price: "$24",
    description: "For growing teams and startups.",
    items: ["Unlimited projects", "Team collaboration", "Advanced analytics"],
    cta: "Start Pro",
    highlighted: true,
  },
  {
    plan: "Enterprise",
    price: "Custom",
    description: "For large organizations.",
    items: ["SSO & RBAC", "Priority support", "Custom SLAs"],
    cta: "Contact Sales",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

const quickStats = [
  { value: "99.99%", label: "Uptime" },
  { value: "<150ms", label: "Global edge latency" },
  { value: "10k+", label: "Deployments per day" },
];

export function LandingPage() {
  return (
    <div className="relative overflow-hidden pb-10">
      <div className="pointer-events-none absolute inset-x-0 -top-40 h-72 bg-[radial-gradient(circle_at_top,rgba(0,0,0,0.12),transparent_58%)] dark:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.1),transparent_58%)]" />
      <div className="pointer-events-none absolute -right-32 top-28 hidden h-64 w-64 rounded-full bg-muted blur-3xl lg:block" />

      <section className="mx-auto grid max-w-7xl gap-10 px-4 pb-20 pt-16 sm:px-6 sm:pt-20 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:pt-24">
        <motion.section
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          transition={{ duration: 0.45 }}
          className="max-w-xl"
        >
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-border/70 bg-background px-3 py-1 text-xs tracking-wide text-muted-foreground uppercase shadow-xs">
            <Rocket className="size-3.5" />
            Next-gen deployment platform
          </p>
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            Deploy. Preview. Ship.
          </h1>
          <p className="mt-5 max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg">
            Launchly brings seamless GitHub imports, instant previews, and reliable
            production deploys together in one modern workflow.
          </p>
          <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <Link href="/signup" className={cn(buttonVariants({ size: "lg" }))}>
              Start Deploying
              <ArrowRight className="ml-1.5" />
            </Link>
            <Link
              href="/login"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
            >
              Import from GitHub
            </Link>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {quickStats.map((stat) => (
              <div key={stat.label} className="rounded-xl border border-border/70 bg-card/70 p-4">
                <p className="text-xl font-semibold tracking-tight">{stat.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.1 }}
          className="relative"
        >
          <Card className="border-border/70 bg-card/70 shadow-lg backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-3 text-base">
                <span>Recent Deployments</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-xs text-emerald-600 dark:text-emerald-400">
                  <Check className="size-3" />
                  All systems ready
                </span>
              </CardTitle>
              <CardDescription>Production and preview builds in real time.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { name: "launchly-app", state: "Ready", time: "35s", color: "text-emerald-600" },
                { name: "marketing-site", state: "Building", time: "12s", color: "text-amber-600" },
                { name: "docs-portal", state: "Ready", time: "40s", color: "text-emerald-600" },
              ].map((deploy) => (
                <div
                  key={deploy.name}
                  className="flex items-center justify-between rounded-lg border border-border/60 bg-background/70 px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium">{deploy.name}</p>
                    <p className="text-xs text-muted-foreground">main branch</p>
                  </div>
                  <div className="text-right">
                    <p className={cn("text-xs font-medium", deploy.color)}>{deploy.state}</p>
                    <p className="text-xs text-muted-foreground">{deploy.time}</p>
                  </div>
                </div>
              ))}
              <div className="rounded-lg border border-dashed border-border/70 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                Tip: use preview URLs to get feedback before every production push.
              </div>
            </CardContent>
          </Card>
        </motion.section>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.35 }}
          variants={fadeUp}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Features</h2>
          <p className="mt-2 text-muted-foreground">
            Purpose-built deployment primitives for modern product teams.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={fadeUp}
              transition={{ duration: 0.35, delay: index * 0.08 }}
            >
              <Card className="h-full border-border/70 bg-card/70 backdrop-blur-sm">
                <CardHeader>
                  <feature.icon className="mb-2 size-5 text-foreground" />
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
        <Card className="border-border/70 bg-card/70">
          <CardContent className="flex flex-col items-start justify-between gap-4 py-7 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm text-muted-foreground">Ready to launch?</p>
              <h3 className="mt-1 text-2xl font-semibold tracking-tight">
                Ship your next release before your coffee gets cold.
              </h3>
            </div>
            <Button size="lg">
              Start Deploying
              <Clock3 className="ml-1.5" />
            </Button>
          </CardContent>
        </Card>
      </section>

      <section id="pricing" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={fadeUp}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Pricing</h2>
          <p className="mt-2 text-muted-foreground">Start free and scale when you grow.</p>
        </motion.div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {pricing.map((tier, index) => (
            <motion.div
              key={tier.plan}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={fadeUp}
              transition={{ duration: 0.35, delay: index * 0.08 }}
            >
              <Card
                className={cn(
                  "h-full border-border/70",
                  tier.highlighted
                    ? "ring-2 ring-foreground/20 shadow-md"
                    : "bg-card/70 backdrop-blur-sm"
                )}
              >
                <CardHeader>
                  <CardTitle>{tier.plan}</CardTitle>
                  <CardDescription>{tier.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-3xl font-semibold tracking-tight">{tier.price}</p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {tier.items.map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <Check className="size-4 text-foreground" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" variant={tier.highlighted ? "default" : "outline"}>
                    {tier.cta}
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      <footer id="footer" className="border-t border-border/70">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} Launchly. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a href="#" className="transition-colors hover:text-foreground">
              Docs
            </a>
            <a href="#" className="transition-colors hover:text-foreground">
              Privacy
            </a>
            <a href="#" className="transition-colors hover:text-foreground">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
