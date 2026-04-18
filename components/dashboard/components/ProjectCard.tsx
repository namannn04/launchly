"use client";

import { motion } from "framer-motion";
import { Activity, CheckCircle2, Clock3 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ProjectStatus = "Ready" | "Building" | "Failed";

export type DashboardProject = {
  id: string;
  name: string;
  status: ProjectStatus;
  lastDeployedAt: string;
};

type ProjectCardProps = {
  project: DashboardProject;
};

function statusIcon(status: ProjectStatus) {
  if (status === "Ready") {
    return <CheckCircle2 className="h-4 w-4 text-primary" />;
  }

  if (status === "Building") {
    return <Activity className="h-4 w-4 text-amber-500" />;
  }

  return <Clock3 className="h-4 w-4 text-red-500" />;
}

function badgeVariant(status: ProjectStatus): "default" | "secondary" | "outline" {
  if (status === "Ready") {
    return "default";
  }

  if (status === "Building") {
    return "secondary";
  }

  return "outline";
}

export default function ProjectCard({ project }: ProjectCardProps) {
  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.01 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="h-full"
    >
      <Card className="h-full border-border/70 bg-card/85 shadow-[0_14px_34px_rgba(15,23,42,0.08)]">
        <CardHeader className="space-y-4 pb-3">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-lg">{project.name}</CardTitle>
            <Badge variant={badgeVariant(project.status)} className="inline-flex items-center gap-1.5">
              {statusIcon(project.status)}
              {project.status}
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          <p className="text-sm text-muted-foreground">Last deployed {project.lastDeployedAt}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
