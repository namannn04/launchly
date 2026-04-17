import type { HandlerUrlOptions } from "@stackframe/stack";

export const stackUrls: HandlerUrlOptions = {
  default: { type: "handler-component" },
  handler: "/handler",
  signIn: "/handler/sign-in",
  signUp: "/handler/sign-up",
  signOut: "/handler/sign-out",
  emailVerification: "/handler/email-verification",
  passwordReset: "/handler/password-reset",
  forgotPassword: "/handler/forgot-password",
  oauthCallback: "/handler/oauth-callback",
  magicLinkCallback: "/handler/magic-link-callback",
  accountSettings: "/handler/account-settings",
  teamInvitation: "/handler/team-invitation",
  mfa: "/handler/mfa",
  error: "/handler/error",
  onboarding: "/handler/onboarding",
  afterSignIn: "/",
  afterSignUp: "/",
  afterSignOut: "/",
  home: "/",
};
