import { serveProjectRequest } from "@/lib/deployment/serveProject";

type RouteContext = {
  params: Promise<{ projectId: string; path?: string[] }>;
};

async function handleRequest(request: Request, context: RouteContext, method: string) {
  const params = await context.params;
  return serveProjectRequest(request, params, method);
}

export async function GET(request: Request, context: RouteContext) {
  return handleRequest(request, context, "GET");
}

export async function HEAD(request: Request, context: RouteContext) {
  return handleRequest(request, context, "HEAD");
}

export async function POST(request: Request, context: RouteContext) {
  return handleRequest(request, context, "POST");
}

export async function PUT(request: Request, context: RouteContext) {
  return handleRequest(request, context, "PUT");
}

export async function PATCH(request: Request, context: RouteContext) {
  return handleRequest(request, context, "PATCH");
}

export async function DELETE(request: Request, context: RouteContext) {
  return handleRequest(request, context, "DELETE");
}
