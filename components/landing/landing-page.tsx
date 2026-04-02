"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Check, Globe, Rocket, Scale, Zap } from "lucide-react";

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

export function LandingPage() {
  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 -top-36 h-64 bg-[radial-gradient(circle_at_top,rgba(0,0,0,0.08),transparent_55%)] dark:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_55%)]" />

      <section className="mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 sm:pt-20 lg:px-8 lg:pt-28">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          transition={{ duration: 0.45 }}
          className="mx-auto max-w-3xl text-center"
        >
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-border/70 bg-background px-3 py-1 text-xs tracking-wide text-muted-foreground uppercase shadow-xs">
            <Rocket className="size-3.5" />
            Next-gen deployment platform
          </p>
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            Deploy. Preview. Ship.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg">
            Launchly brings seamless GitHub imports, instant previews, and reliable
            production deploys together in one modern workflow.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/signup" className={cn(buttonVariants({ size: "lg" }))}>
              Start Deploying
              <ArrowRight className="ml-1.5" />
            </Link>
            <Link
              href="/import"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
            >
              Import from GitHub
            </Link>
          </div>
        </motion.div>
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

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
