"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useUser } from "@stackframe/stack";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";

import ThemeToggle from "./ThemeToggle";

const navLinks = [
  { href: "#features", label: "Features", external: false },
  { href: "#pricing", label: "Pricing", external: false },
  { href: "https://docs.launchly.dev", label: "Docs", external: true },
] as const;

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const user = useUser({ or: "return-null" });
  const isSignedIn = Boolean(user && !user.isAnonymous);

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/75 backdrop-blur-xl">
      <div className="mx-auto flex h-20 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="group inline-flex items-center gap-3 text-foreground"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground shadow-[0_10px_22px_rgba(16,185,129,0.32)] transition-transform duration-300 group-hover:-translate-y-0.5">
            L
          </span>
          <span className="text-lg font-semibold tracking-tight">Launchly</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target={link.external ? "_blank" : undefined}
              rel={link.external ? "noreferrer" : undefined}
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {isSignedIn ? (
            <Button asChild variant="outline">
              <Link href="/handler/sign-out">Sign out</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost">
                <Link href="/handler/sign-in">Login</Link>
              </Button>
              <Button asChild>
                <Link href="/handler/sign-up">Signup</Link>
              </Button>
            </>
          )}
          <ThemeToggle />
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <Button
            variant="outline"
            size="icon"
            aria-label="Toggle menu"
            onClick={() => setIsMobileMenuOpen((value) => !value)}
          >
            {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="overflow-hidden border-t border-border/60 md:hidden"
          >
            <nav className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-5 sm:px-6">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target={link.external ? "_blank" : undefined}
                  rel={link.external ? "noreferrer" : undefined}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              {isSignedIn ? (
                <div className="pt-2">
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/handler/sign-out" onClick={() => setIsMobileMenuOpen(false)}>
                      Sign out
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Button asChild variant="outline">
                    <Link href="/handler/sign-in" onClick={() => setIsMobileMenuOpen(false)}>
                      Login
                    </Link>
                  </Button>
                  <Button asChild>
                    <Link href="/handler/sign-up" onClick={() => setIsMobileMenuOpen(false)}>
                      Signup
                    </Link>
                  </Button>
                </div>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
