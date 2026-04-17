"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Plan = {
  name: string;
  price: string;
  frequency?: string;
  description: string;
  features: string[];
  cta: string;
  href: string;
  recommended?: boolean;
};

const plans: Plan[] = [
  {
    name: "Free",
    price: "$0",
    frequency: "/month",
    description: "Best for prototypes and personal projects.",
    features: ["1 production project", "Community support", "Basic analytics"],
    cta: "Get Started",
    href: "/handler/sign-up",
  },
  {
    name: "Pro",
    price: "$29",
    frequency: "/month",
    description: "Ideal for product teams shipping every week.",
    features: [
      "Unlimited deployments",
      "Advanced preview controls",
      "Team access & permissions",
      "Priority support",
    ],
    cta: "Start Pro",
    href: "/handler/sign-up",
    recommended: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "Security, compliance, and scale for large organizations.",
    features: [
      "Dedicated architecture support",
      "SAML / SSO",
      "Custom SLAs",
      "Success engineering",
    ],
    cta: "Contact Sales",
    href: "mailto:sales@launchly.dev",
  },
];

export default function PricingSection() {
  return (
    <section id="pricing" className="px-4 py-20 sm:px-6">
      <div className="mx-auto w-full max-w-6xl space-y-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-3 text-center"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Pricing</p>
          <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Transparent plans that scale with your product
          </h2>
        </motion.div>

        <div className="grid gap-5 lg:grid-cols-3">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ delay: index * 0.06, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -6 }}
              className="h-full"
            >
              <Card
                className={
                  plan.recommended
                    ? "relative h-full border-primary/40 bg-gradient-to-b from-primary/10 via-card/85 to-card/85"
                    : "h-full"
                }
              >
                <CardHeader className="space-y-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    {plan.recommended ? <Badge>Recommended</Badge> : null}
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                  <p className="text-3xl font-semibold tracking-tight text-foreground">
                    {plan.price}
                    {plan.frequency ? <span className="text-base text-muted-foreground">{plan.frequency}</span> : null}
                  </p>
                </CardHeader>

                <CardContent className="space-y-3">
                  {plan.features.map((feature) => (
                    <p key={feature} className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-primary" />
                      {feature}
                    </p>
                  ))}
                </CardContent>

                <CardFooter>
                  <Button asChild variant={plan.recommended ? "default" : "outline"} className="w-full">
                    <Link href={plan.href}>{plan.cta}</Link>
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
