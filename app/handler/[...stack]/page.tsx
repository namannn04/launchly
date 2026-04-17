import { StackHandler } from "@stackframe/stack";

import { stackServerApp } from "@/stack/server";

type HandlerPageProps = {
  params: Promise<{ stack?: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default function HandlerPage(props: HandlerPageProps) {
  return <StackHandler app={stackServerApp} routeProps={props} fullPage />;
}
