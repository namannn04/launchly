"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, CircleDot, ExternalLink, GitBranch, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import ThemeToggle from "@/components/landingPage/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type NewProjectFlowPageProps = {
  githubUsername: string | null;
  githubAvatar: string | null;
  repoUrl: string;
  fullName: string;
  repoName: string;
  defaultBranch: string;
  owner: string;
};

type DeployStatus = "idle" | "queued" | "building" | "success" | "failed";

type DeploymentPayload = {
  projectId: string;
  status: "queued" | "building" | "success" | "failed";
  environment: "development" | "preview" | "production";
  runtime: "static" | "nextjs" | "node" | "unknown";
  runtimePort: number | null;
  runtimeStatus: string | null;
  deploymentUrl: string | null;
  logs: string;
  error: string | null;
  updatedAt: string;
};

type DetectedPreset = {
  id: "nextjs" | "react-vite" | "react-cra" | "react" | "static-html" | "node" | "unknown";
  label: string;
  confidence: "high" | "medium" | "low";
};

type DeployEnvironment = "development" | "preview" | "production";

type EnvVariableInput = {
  id: string;
  key: string;
  value: string;
  revealValue?: boolean;
};

function parseEnvPasteInput(input: string) {
  const parsed: Array<{ key: string; value: string }> = [];
  const keyPattern = /^[A-Za-z_][A-Za-z0-9_./:-]*$/;

  const lines = input.split(/\r?\n/);

  function isQuotedValueClosed(value: string, quote: '"' | "'") {
    if (!value.startsWith(quote)) {
      return true;
    }

    let escaped = false;

    for (let index = 1; index < value.length; index += 1) {
      const char = value[index];

      if (char === "\\" && !escaped) {
        escaped = true;
        continue;
      }

      if (char === quote && !escaped && index === value.length - 1) {
        return true;
      }

      escaped = false;
    }

    return false;
  }

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const line = lines[lineIndex].trim();

    if (line.length === 0 || line.startsWith("#")) {
      continue;
    }

    const normalizedLine = line.startsWith("export ") ? line.slice(7).trim() : line;
    const separatorIndex = normalizedLine.indexOf("=");

    if (separatorIndex <= 0) {
      continue;
    }

    const rawKey = normalizedLine.slice(0, separatorIndex).trim().replace(/\s+/g, "");

    if (!rawKey) {
      continue;
    }

    const normalizedKey = rawKey
      .replace(/^['\"]+/, "")
      .replace(/['\"]+$/, "");

    if (!keyPattern.test(normalizedKey)) {
      continue;
    }

    let rawValue = normalizedLine.slice(separatorIndex + 1).trim();

    if (rawValue.startsWith("\"") || rawValue.startsWith("'")) {
      const quote = rawValue[0] as '"' | "'";

      while (!isQuotedValueClosed(rawValue, quote) && lineIndex + 1 < lines.length) {
        lineIndex += 1;
        rawValue = `${rawValue}\n${lines[lineIndex]}`;
      }
    }

    if (
      (rawValue.startsWith('"') && rawValue.endsWith('"'))
      || (rawValue.startsWith("'") && rawValue.endsWith("'"))
    ) {
      rawValue = rawValue.slice(1, -1);
    }

    parsed.push({
      key: normalizedKey,
      value: rawValue,
    });
  }

  return parsed;
}

function sanitizeProjectId(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 64);
}

function statusLabel(status: DeployStatus) {
  if (status === "idle") {
    return "Not started";
  }

  if (status === "queued") {
    return "Queued";
  }

  if (status === "building") {
    return "Building";
  }

  if (status === "success") {
    return "Ready";
  }

  return "Failed";
}

export default function NewProjectFlowPage({
  githubUsername,
  githubAvatar,
  repoUrl,
  fullName,
  repoName,
  defaultBranch,
  owner,
}: NewProjectFlowPageProps) {
  const [projectName, setProjectName] = useState(repoName);
  const [teamName] = useState(`${owner || "Personal"} Team`);
  const [rootDirectory] = useState("./");
  const [status, setStatus] = useState<DeployStatus>("idle");
  const [runtime, setRuntime] = useState<DeploymentPayload["runtime"]>("unknown");
  const [runtimePort, setRuntimePort] = useState<number | null>(null);
  const [runtimeStatus, setRuntimeStatus] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [deploymentUrl, setDeploymentUrl] = useState<string | null>(null);
  const [logs, setLogs] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [isDetectingPreset, setIsDetectingPreset] = useState(true);
  const [deployEnvironment, setDeployEnvironment] = useState<DeployEnvironment>("production");
  const [envVariables, setEnvVariables] = useState<EnvVariableInput[]>([]);
  const [envBulkInput, setEnvBulkInput] = useState("");
  const [preset, setPreset] = useState<DetectedPreset>({
    id: "unknown",
    label: "Automatic",
    confidence: "low",
  });

  const canDeploy = useMemo(() => {
    return projectName.trim().length > 0 && !isDeploying;
  }, [isDeploying, projectName]);

  useEffect(() => {
    const controller = new AbortController();

    async function detectPreset() {
      setIsDetectingPreset(true);

      try {
        const params = new URLSearchParams({
          fullName,
          repoUrl,
        });

        const response = await fetch(`/api/github/preset?${params.toString()}`, {
          method: "GET",
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as {
          preset?: DetectedPreset;
        };

        if (payload.preset) {
          setPreset(payload.preset);
        }
      } catch {
        if (controller.signal.aborted) {
          return;
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsDetectingPreset(false);
        }
      }
    }

    void detectPreset();

    return () => {
      controller.abort();
    };
  }, [fullName, repoUrl]);

  async function pollDeploymentStatus(targetProjectId: string) {
    while (true) {
      const response = await fetch(`/api/deploy/${targetProjectId}`, {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        setStatus("failed");
        setError("Could not fetch deployment status.");
        break;
      }

      const payload = (await response.json()) as DeploymentPayload;

      setStatus(payload.status);
      setRuntime(payload.runtime);
      setRuntimePort(payload.runtimePort);
      setRuntimeStatus(payload.runtimeStatus);
      setDeploymentUrl(payload.deploymentUrl);
      setLogs(payload.logs);
      setError(payload.error);

      if (payload.status === "success" || payload.status === "failed") {
        break;
      }

      await new Promise((resolve) => {
        window.setTimeout(resolve, 2200);
      });
    }
  }

  async function handleDeploy() {
    if (!canDeploy) {
      return;
    }

    const targetProjectId = sanitizeProjectId(projectName || fullName.replace("/", "-"));

    if (!targetProjectId) {
      setError("Project name is invalid.");
      return;
    }

    setIsDeploying(true);
    setError(null);
    setStatus("queued");
    setLogs("");

    try {
      const response = await fetch("/api/deploy", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          repoUrl,
          projectId: targetProjectId,
          environment: deployEnvironment,
          envVariables: envVariables.filter((entry) => entry.key.trim().length > 0),
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({ error: "Failed to queue deployment" }))) as { error?: string };
        throw new Error(payload.error ?? "Failed to queue deployment");
      }

      const payload = (await response.json()) as { status: "queued"; projectId: string };
      setProjectId(payload.projectId);
      setStatus(payload.status);

      await pollDeploymentStatus(payload.projectId);
    } catch (deployError) {
      setStatus("failed");
      setError(deployError instanceof Error ? deployError.message : "Deployment failed");
    } finally {
      setIsDeploying(false);
    }
  }

  function addEnvVariable() {
    setEnvVariables((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        key: "",
        value: "",
        revealValue: false,
      },
    ]);
  }

  function updateEnvVariable(id: string, field: "key" | "value", value: string) {
    setEnvVariables((current) => current.map((entry) => (entry.id === id ? { ...entry, [field]: value } : entry)));
  }

  function removeEnvVariable(id: string) {
    setEnvVariables((current) => current.filter((entry) => entry.id !== id));
  }

  function toggleEnvValueVisibility(id: string) {
    setEnvVariables((current) => current.map((entry) => (
      entry.id === id
        ? { ...entry, revealValue: !entry.revealValue }
        : entry
    )));
  }

  function importEnvVariablesFromPaste() {
    const parsed = parseEnvPasteInput(envBulkInput);

    if (parsed.length === 0) {
      return;
    }

    setEnvVariables((current) => {
      const byKey = new Map<string, EnvVariableInput>();

      for (const entry of current) {
        byKey.set(entry.key.trim(), entry);
      }

      for (const entry of parsed) {
        const existing = byKey.get(entry.key);

        if (existing) {
          byKey.set(entry.key, {
            ...existing,
            value: entry.value,
            revealValue: existing.revealValue ?? false,
          });
        } else {
          byKey.set(entry.key, {
            id: crypto.randomUUID(),
            key: entry.key,
            value: entry.value,
            revealValue: false,
          });
        }
      }

      return [...byKey.values()];
    });

    setEnvBulkInput("");
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border/70 bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/dashboard/import" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>

          <p className="text-sm font-medium">New Project</p>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/70 px-2 py-1">
              {githubAvatar ? (
                <Image src={githubAvatar} alt={githubUsername ?? "GitHub avatar"} width={24} height={24} className="h-6 w-6 rounded-full" />
              ) : (
                <span className="h-6 w-6 rounded-full bg-muted" />
              )}
              <span className="pr-2 text-xs text-muted-foreground">{githubUsername ?? "GitHub connected"}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto w-full max-w-2xl"
        >
          <Card className="border-border/80 bg-card/80">
            <CardHeader>
              <CardTitle className="text-3xl">New Project</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="rounded-xl border border-border/70 bg-background/60 p-3">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Importing From GitHub</p>
                <p className="mt-2 text-sm font-medium">{fullName}</p>
                <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <GitBranch className="h-3.5 w-3.5" />
                  {defaultBranch}
                </p>
              </div>

              <p className="text-sm text-muted-foreground">Choose where you want to create the project and give it a name.</p>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="mb-1.5 text-sm text-muted-foreground">Team</p>
                  <div className="h-11 rounded-xl border border-border/80 bg-background/70 px-3 text-sm leading-10.5">{teamName}</div>
                </div>

                <label>
                  <p className="mb-1.5 text-sm text-muted-foreground">Project Name</p>
                  <input
                    value={projectName}
                    onChange={(event) => setProjectName(event.target.value)}
                    className="h-11 w-full rounded-xl border border-border/80 bg-background px-3 text-sm outline-none transition focus:border-primary"
                  />
                </label>
              </div>

              <div>
                <p className="mb-1.5 text-sm text-muted-foreground">Application Preset</p>
                <div className="flex h-11 items-center justify-between rounded-xl border border-border/80 bg-background/70 px-3 text-sm">
                  <span>{isDetectingPreset ? "Detecting..." : preset.label}</span>
                  <span
                    className={
                      preset.confidence === "high"
                        ? "rounded-full border border-emerald-500/35 bg-emerald-500/15 px-2 py-0.5 text-[11px] text-emerald-400"
                        : preset.confidence === "medium"
                          ? "rounded-full border border-amber-500/35 bg-amber-500/15 px-2 py-0.5 text-[11px] text-amber-300"
                          : "rounded-full border border-border/80 bg-background px-2 py-0.5 text-[11px] text-muted-foreground"
                    }
                  >
                    {isDetectingPreset ? "..." : `${preset.confidence} confidence`}
                  </span>
                </div>
              </div>

              <div>
                <p className="mb-1.5 text-sm text-muted-foreground">Root Directory</p>
                <div className="h-11 rounded-xl border border-border/80 bg-background/70 px-3 text-sm leading-10.5">{rootDirectory}</div>
              </div>

              <div>
                <p className="mb-1.5 text-sm text-muted-foreground">Deployment Environment</p>
                <div className="grid grid-cols-3 gap-2">
                  {(["development", "preview", "production"] as DeployEnvironment[]).map((envScope) => (
                    <button
                      key={envScope}
                      type="button"
                      onClick={() => setDeployEnvironment(envScope)}
                      className={
                        deployEnvironment === envScope
                          ? "h-10 rounded-lg border border-primary bg-primary/10 text-xs font-medium capitalize text-primary"
                          : "h-10 rounded-lg border border-border/80 bg-background/70 text-xs font-medium capitalize text-muted-foreground"
                      }
                    >
                      {envScope}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <p className="text-sm text-muted-foreground">Environment Variables</p>
                  <Button type="button" size="sm" variant="outline" onClick={addEnvVariable}>
                    Add Variable
                  </Button>
                </div>

                <div className="mb-3 space-y-2 rounded-xl border border-border/70 bg-background/40 p-3">
                  <p className="text-xs text-muted-foreground">Paste .env content (bulk import supported)</p>
                  <textarea
                    value={envBulkInput}
                    onChange={(event) => setEnvBulkInput(event.target.value)}
                    placeholder={"API_URL = \"https://api.example.com\"\nJWT_SECRET = \"abc123\""}
                    className="min-h-24 w-full rounded-lg border border-border/80 bg-background px-3 py-2 text-xs outline-none transition focus:border-primary"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={importEnvVariablesFromPaste}
                    disabled={envBulkInput.trim().length === 0}
                  >
                    Import Pasted Env
                  </Button>
                </div>

                {envVariables.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-border/70 bg-background/40 p-3 text-xs text-muted-foreground">
                    No environment variables added. Values are encrypted before storing and never shown in logs.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {envVariables.map((entry) => (
                      <div key={entry.id} className="grid gap-2 rounded-xl border border-border/70 bg-background/50 p-2 sm:grid-cols-[1fr_1fr_auto_auto]">
                        <input
                          value={entry.key}
                          onChange={(event) => updateEnvVariable(entry.id, "key", event.target.value)}
                          placeholder="KEY"
                          className="h-10 rounded-lg border border-border/80 bg-background px-3 text-xs outline-none transition focus:border-primary"
                        />
                        <input
                          value={entry.value}
                          onChange={(event) => updateEnvVariable(entry.id, "value", event.target.value)}
                          placeholder="Value"
                          type={entry.revealValue ? "text" : "password"}
                          className="h-10 rounded-lg border border-border/80 bg-background px-3 text-xs outline-none transition focus:border-primary"
                        />
                        <Button type="button" variant="outline" size="sm" onClick={() => toggleEnvValueVisibility(entry.id)}>
                          {entry.revealValue ? "Hide" : "View"}
                        </Button>
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeEnvVariable(entry.id)}>
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button className="w-full" onClick={() => void handleDeploy()} disabled={!canDeploy}>
                {isDeploying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Deploying...
                  </>
                ) : (
                  "Deploy"
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        <AnimatePresence>
          {status !== "idle" ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="mx-auto w-full max-w-2xl"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between gap-3 text-xl">
                    Deployment
                    <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-1 text-xs font-medium">
                      {status === "queued" || status === "building" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CircleDot className="h-3.5 w-3.5" />}
                      {statusLabel(status)}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    <p>Project ID: {projectId ?? "pending"}</p>
                    <p>Repository: {fullName}</p>
                    <p>Environment: {deployEnvironment}</p>
                    <p>Runtime: {runtime}</p>
                    {runtimePort ? <p>Runtime Port: {runtimePort}</p> : null}
                    {runtimeStatus ? <p>Runtime Status: {runtimeStatus}</p> : null}
                  </div>

                  {deploymentUrl ? (
                    <a
                      href={deploymentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-medium underline-offset-4 hover:underline"
                    >
                      Open Deployment
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  ) : null}

                  {error ? <p className="text-sm text-red-500">{error}</p> : null}

                  <div>
                    <p className="mb-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">Build Logs</p>
                    <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-xl border border-border/70 bg-background/60 p-3 text-xs leading-relaxed">
                      {logs || "Waiting for logs..."}
                    </pre>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <Button asChild variant="outline" size="sm">
                      <Link href="/dashboard">Back To Dashboard</Link>
                    </Button>
                    {projectId ? (
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/dashboard/project/${projectId}`}>Open Project Dashboard</Link>
                      </Button>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </main>
    </div>
  );
}
