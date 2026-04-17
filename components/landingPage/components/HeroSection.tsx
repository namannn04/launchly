"use client";

import { motion } from "framer-motion";
import { ArrowRight, GitBranch, Globe, Zap } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const highlights = [
  { icon: Zap, text: "Zero-config deployments" },
  { icon: Globe, text: "Global edge network" },
  { icon: GitBranch, text: "Git-native workflows" },
] as const;

export default function HeroSection() {
  return (
    <section className="relative px-4 pb-24 pt-16 sm:px-6 sm:pt-24" id="top">
      <div className="mx-auto grid w-full max-w-6xl gap-12 lg:grid-cols-2 lg:items-center">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-8"
        >
          <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
            The deployment platform for fast-moving product teams
          </Badge>

          <div className="space-y-5">
            <h1 className="max-w-2xl text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Deploy. Preview. Ship.
            </h1>
            <p className="max-w-xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg">
              Launchly gives your team a complete path from commit to production with instant previews,
              resilient edge delivery, and scaling that stays invisible.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <Link href="/handler/sign-up" className="group">
                Start Deploying
                <ArrowRight className="transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="https://github.com" target="_blank" rel="noreferrer">
                Import from GitHub
              </Link>
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-1 text-sm text-muted-foreground">
            {highlights.map(({ icon: Icon, text }) => (
              <span key={text} className="inline-flex items-center gap-2">
                <Icon className="h-4 w-4 text-primary" />
                {text}
              </span>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.68, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
        >
          <Card className="relative overflow-hidden border-border/70 bg-card/80">
            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-primary/15 to-transparent" />
            <CardHeader className="relative space-y-3">
              <CardDescription>Live deploy feed</CardDescription>
              <CardTitle className="text-xl">Production Push from main</CardTitle>
            </CardHeader>
            <CardContent className="relative space-y-4 text-sm">
              <div className="rounded-xl border border-border/70 bg-background/70 p-4 font-mono text-xs text-muted-foreground">
                <p className="text-primary">$ launchly deploy --prod</p>
                <p>Cloning repository...</p>
                <p>Building at edge runtime...</p>
                <p>Deploying globally...</p>
                <p className="pt-2 text-foreground">Success: app.launchly.site</p>
              </div>

              <div className="grid gap-2">
                <div className="flex items-center justify-between rounded-lg border border-border/70 bg-background/70 px-3 py-2">
                  <span className="text-muted-foreground">Build time</span>
                  <span className="font-semibold text-foreground">23s</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border/70 bg-background/70 px-3 py-2">
                  <span className="text-muted-foreground">Regions updated</span>
                  <span className="font-semibold text-foreground">16 / 16</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border/70 bg-background/70 px-3 py-2">
                  <span className="text-muted-foreground">Rollback snapshot</span>
                  <span className="font-semibold text-foreground">Ready</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
