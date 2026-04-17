"use client";

import { motion } from "framer-motion";
import {
  Activity,
  Cloud,
  GitMerge,
  Link2,
  type LucideIcon,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Feature = {
  title: string;
  description: string;
  icon: LucideIcon;
};

const features: Feature[] = [
  {
    title: "Instant Deployments",
    description: "Push once and go live globally in seconds with zero manual steps.",
    icon: Cloud,
  },
  {
    title: "Preview URLs",
    description: "Every pull request gets an isolated preview environment for safe reviews.",
    icon: Link2,
  },
  {
    title: "Auto Scaling",
    description: "Traffic spikes are absorbed automatically without extra infrastructure work.",
    icon: Activity,
  },
  {
    title: "Git Integration",
    description: "Built for modern pipelines with native GitHub workflow automation.",
    icon: GitMerge,
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="px-4 py-20 sm:px-6">
      <div className="mx-auto w-full max-w-6xl space-y-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.45 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-3 text-center"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Features</p>
          <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Everything needed to ship like a top-tier platform team
          </h2>
        </motion.div>

        <div className="grid gap-5 md:grid-cols-2">
          {features.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ delay: index * 0.06, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -6 }}
              >
                <Card className="h-full">
                  <CardHeader className="space-y-4">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/12 text-primary">
                      <Icon className="h-5 w-5" />
                    </span>
                    <CardTitle>{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base leading-7">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
