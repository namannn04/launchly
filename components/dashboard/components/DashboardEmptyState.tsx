"use client";

import { motion } from "framer-motion";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type DashboardEmptyStateProps = {
  githubUsername: string | null;
};

export default function DashboardEmptyState({ githubUsername }: DashboardEmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto flex w-full max-w-xl items-center justify-center"
    >
      <Card className="w-full border-border/70 bg-card/85 shadow-[0_24px_70px_rgba(15,23,42,0.12)]">
        <CardHeader className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Welcome</p>
          <CardTitle className="text-2xl sm:text-3xl">Start building with Launchly</CardTitle>
          <CardDescription className="mx-auto max-w-md text-base leading-7">
            Import your GitHub repository to deploy your first project.
            {githubUsername ? ` Connected as ${githubUsername}.` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center pb-7">
          <Button asChild size="lg" className="min-w-48">
            <Link href="/dashboard/import">Add New Project</Link>
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
