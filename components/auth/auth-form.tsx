"use client";

import Link from "next/link";
import * as React from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { isGitHubOAuthConfigured } from "@/lib/auth/config";
import { cn } from "@/lib/utils";

type FormMode = "login" | "signup";

type AuthFormProps = {
  mode: FormMode;
};

type Values = {
  email: string;
  password: string;
};

type Errors = {
  email?: string;
  password?: string;
  root?: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function GitHubMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-4 fill-current"
      role="img"
    >
      <path d="M12 .5a12 12 0 0 0-3.8 23.4c.6.1.8-.2.8-.6v-2.2c-3.2.7-3.9-1.4-3.9-1.4-.5-1.3-1.2-1.6-1.2-1.6-1-.7.1-.7.1-.7 1 .1 1.6 1.1 1.6 1.1 1 .1 1.9.7 2.4 1.5.2-.7.5-1.1.9-1.4-2.5-.3-5.2-1.3-5.2-5.8 0-1.3.5-2.4 1.1-3.2-.1-.3-.5-1.5.1-3.1 0 0 .9-.3 3.3 1.2a11.3 11.3 0 0 1 6.1 0c2.3-1.6 3.3-1.2 3.3-1.2.7 1.7.3 2.9.1 3.1.8.8 1.1 1.9 1.1 3.2 0 4.6-2.7 5.5-5.3 5.8.4.4.8 1.1.8 2.2v3.2c0 .4.2.8.8.6A12 12 0 0 0 12 .5Z" />
    </svg>
  );
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [values, setValues] = React.useState<Values>({ email: "", password: "" });
  const [errors, setErrors] = React.useState<Errors>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isGitHubLoading, setIsGitHubLoading] = React.useState(false);

  const isLogin = mode === "login";
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  const labels = {
    title: isLogin ? "Sign in to Launchly" : "Create your Launchly account",
    description: isLogin
      ? "Deploy and manage your projects from one clean dashboard."
      : "Start shipping production-grade deployments in minutes.",
    submit: isLogin ? "Sign In" : "Create Account",
    github: isLogin ? "Continue with GitHub" : "Sign up with GitHub",
    switchText: isLogin ? "Don't have an account?" : "Already have an account?",
    switchHref: isLogin ? "/signup" : "/login",
    switchLabel: isLogin ? "Sign up" : "Sign in",
  };

  function validate(nextValues: Values): Errors {
    const nextErrors: Errors = {};

    if (!nextValues.email.trim()) {
      nextErrors.email = "Email is required.";
    } else if (!EMAIL_PATTERN.test(nextValues.email)) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!nextValues.password) {
      nextErrors.password = "Password is required.";
    } else if (nextValues.password.length < 8) {
      nextErrors.password = "Password must be at least 8 characters.";
    }

    return nextErrors;
  }

  function handleFieldChange(field: keyof Values, value: string) {
    const nextValues = { ...values, [field]: value };
    setValues(nextValues);

    if (errors.email || errors.password || errors.root) {
      const nextErrors = validate(nextValues);
      setErrors(nextErrors);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validate(values);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    const result = await signIn("credentials", {
      email: values.email,
      password: values.password,
      mode,
      callbackUrl,
      redirect: false,
    });

    if (!result || result.error) {
      setErrors({ root: "Authentication failed. Check your credentials and try again." });
      setIsSubmitting(false);
      return;
    }

    router.push(result.url ?? callbackUrl);
    router.refresh();
    setIsSubmitting(false);
  }

  async function handleGitHubSignIn() {
    if (!isGitHubOAuthConfigured) {
      setErrors({ root: "GitHub OAuth keys are missing. Add env values and restart dev server." });
      return;
    }

    setErrors({});
    setIsGitHubLoading(true);
    await signIn("github", { callbackUrl });
  }

  return (
    <Card className="w-full border-border/70 bg-card/80 shadow-sm backdrop-blur-sm">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl tracking-tight">{labels.title}</CardTitle>
        <CardDescription>{labels.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          <Button
            variant="outline"
            className="w-full"
            type="button"
            onClick={handleGitHubSignIn}
            disabled={isGitHubLoading}
          >
            {isGitHubLoading && <Loader2 className="animate-spin" />}
            <GitHubMark />
            {labels.github}
          </Button>
          {!isGitHubOAuthConfigured && (
            <p className="text-xs text-muted-foreground">
              Add AUTH_GITHUB_ID, AUTH_GITHUB_SECRET, and NEXT_PUBLIC_AUTH_GITHUB_ID in env.
            </p>
          )}
        </div>

        <div className="my-6 flex items-center gap-2 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" />
          OR CONTINUE WITH EMAIL
          <div className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <label htmlFor={`${mode}-email`} className="text-sm font-medium">
              Email
            </label>
            <input
              id={`${mode}-email`}
              type="email"
              placeholder="you@company.com"
              value={values.email}
              onChange={(event) => handleFieldChange("email", event.target.value)}
              className={cn(
                "flex h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring",
                errors.email && "border-destructive focus-visible:border-destructive"
              )}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? `${mode}-email-error` : undefined}
            />
            {errors.email && (
              <p id={`${mode}-email-error`} className="text-xs text-destructive">
                {errors.email}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor={`${mode}-password`} className="text-sm font-medium">
              Password
            </label>
            <input
              id={`${mode}-password`}
              type="password"
              placeholder="At least 8 characters"
              value={values.password}
              onChange={(event) => handleFieldChange("password", event.target.value)}
              className={cn(
                "flex h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring",
                errors.password && "border-destructive focus-visible:border-destructive"
              )}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? `${mode}-password-error` : undefined}
            />
            {errors.password && (
              <p id={`${mode}-password-error`} className="text-xs text-destructive">
                {errors.password}
              </p>
            )}
          </div>

          {errors.root && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              <AlertCircle className="size-4" />
              {errors.root}
            </div>
          )}

          <Button className="w-full" type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="animate-spin" />}
            {labels.submit}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          {labels.switchText}{" "}
          <Link href={labels.switchHref} className="font-medium text-foreground hover:underline">
            {labels.switchLabel}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
