import Link from "next/link";

const footerLinks = [
  { href: "https://docs.launchly.dev", label: "Docs" },
  { href: "https://github.com/namannn04/launchly", label: "GitHub" },
  { href: "mailto:hello@launchly.dev", label: "Contact" },
] as const;

export default function FooterSection() {
  return (
    <footer className="border-t border-border/60 px-4 py-10 sm:px-6">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Launchly. Deploy confidently.
        </p>

        <div className="flex items-center gap-6 text-sm">
          {footerLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              target={link.href.startsWith("http") ? "_blank" : undefined}
              rel={link.href.startsWith("http") ? "noreferrer" : undefined}
              className="text-muted-foreground hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
