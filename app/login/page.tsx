import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AuthForm } from "@/components/auth/auth-form";

export default async function LoginPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden px-4 py-12 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-52 bg-[radial-gradient(circle_at_top,rgba(0,0,0,0.09),transparent_60%)] dark:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_60%)]" />
      <div className="mx-auto grid w-full max-w-5xl gap-8 lg:grid-cols-2 lg:items-center">
        <section className="hidden lg:block">
          <p className="mb-3 text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
            Launchly Access
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-balance">
            Welcome back to your deployment command center.
          </h1>
          <p className="mt-4 max-w-md text-muted-foreground">
            Manage projects, monitor builds, and ship updates with a workflow designed for modern teams.
          </p>
          <Link href="/" className="mt-6 inline-block text-sm text-muted-foreground hover:text-foreground">
            Back to home
          </Link>
        </section>
        <section className="mx-auto w-full max-w-md lg:max-w-none">
          <AuthForm mode="login" />
        </section>
      </div>
    </div>
  );
}
