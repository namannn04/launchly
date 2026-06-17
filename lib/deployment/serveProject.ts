import { readFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import { extractProjectIdFromHost } from "@/lib/deployment/url";
import { prisma } from "@/lib/prisma";

const mimeTypes: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".map": "application/json; charset=utf-8",
};

const PROXY_HEADER_ALLOW_LIST = [
  "accept",
  "accept-language",
  "authorization",
  "content-length",
  "content-type",
  "cookie",
  "user-agent",
  "x-forwarded-for",
  "x-forwarded-host",
  "x-forwarded-proto",
];

function contentTypeFor(filePath: string) {
  const extension = path.extname(filePath).toLowerCase();
  return mimeTypes[extension] ?? "application/octet-stream";
}

function normalizeSafeRelativePath(pathSegments: string[] | undefined) {
  const joined = (pathSegments ?? []).join("/");
  const normalized = path.normalize(joined).replace(/^\/+/, "");

  if (normalized.includes("..")) {
    throw new Error("Invalid path");
  }

  return normalized;
}

function injectBaseHref(html: string, projectId: string) {
  if (/<base\s/i.test(html)) {
    return html;
  }

  const baseHref = `/project/${projectId}/`;
  return html.replace(/<head([^>]*)>/i, `<head$1><base href="${baseHref}">`);
}

function rewriteRuntimeHtmlForProject(html: string, projectId: string) {
  const projectPrefix = `/project/${projectId}`;

  return html
    .replace(/(["'])\/_next\//g, `$1${projectPrefix}/_next/`)
    .replace(/(["'])\/favicon\.ico(["'])/g, `$1${projectPrefix}/favicon.ico$2`)
    .replace(/(["'])\/robots\.txt(["'])/g, `$1${projectPrefix}/robots.txt$2`)
    .replace(/(["'])\/manifest\.json(["'])/g, `$1${projectPrefix}/manifest.json$2`)
    .replace(/url\(\/_next\//g, `url(${projectPrefix}/_next/`);
}

function shouldProxyRuntimeFirst(runtime: string | null | undefined, relativePath: string) {
  if (runtime === "nextjs") {
    return true;
  }

  if (runtime !== "node") {
    return false;
  }

  const firstSegment = relativePath.split("/")[0]?.toLowerCase() ?? "";
  return ["api", "socket.io", "graphql", "trpc"].includes(firstSegment);
}

function shouldProxyToRuntime(
  runtime: string | null | undefined,
  relativePath: string,
  method: string,
) {
  if (runtime !== "nextjs" && runtime !== "node") {
    return false;
  }

  if (method !== "GET" && method !== "HEAD") {
    return true;
  }

  return shouldProxyRuntimeFirst(runtime, relativePath);
}

function buildForwardedHeaders(request: Request) {
  const forwardedHeaders = new Headers();

  for (const headerName of PROXY_HEADER_ALLOW_LIST) {
    const value = request.headers.get(headerName);

    if (value) {
      forwardedHeaders.set(headerName, value);
    }
  }

  return forwardedHeaders;
}

async function proxyRuntimeRequest(input: {
  request: Request;
  method: string;
  projectId: string;
  runtimePort: number;
  relativePath: string;
  isSubdomainRequest: boolean;
}) {
  const runtimeUrl = new URL(`http://127.0.0.1:${input.runtimePort}`);
  runtimeUrl.pathname = input.relativePath ? `/${input.relativePath}` : "/";
  runtimeUrl.search = new URL(input.request.url).search;

  const hasBody = input.method !== "GET" && input.method !== "HEAD";
  const body = hasBody ? await input.request.arrayBuffer() : undefined;

  const proxied = await fetch(runtimeUrl, {
    method: input.method,
    cache: "no-store",
    headers: buildForwardedHeaders(input.request),
    body: body && body.byteLength > 0 ? body : undefined,
  });

  const headers = new Headers(proxied.headers);
  const contentType = proxied.headers.get("content-type") ?? "";

  if (contentType.includes("text/html")) {
    const html = await proxied.text();
    const responseHtml = input.isSubdomainRequest
      ? html
      : rewriteRuntimeHtmlForProject(html, input.projectId);

    headers.delete("content-encoding");
    headers.delete("content-length");
    headers.delete("transfer-encoding");
    headers.set("cache-control", "no-cache");
    headers.set("content-type", "text/html; charset=utf-8");

    return new NextResponse(responseHtml, {
      status: proxied.status,
      headers,
    });
  }

  headers.delete("content-encoding");
  headers.delete("content-length");
  headers.delete("transfer-encoding");
  headers.set("cache-control", "no-cache");

  return new NextResponse(proxied.body, {
    status: proxied.status,
    headers,
  });
}

async function serveStaticFile(input: {
  requestedPath: string;
  projectId: string;
  isSubdomainRequest: boolean;
}) {
  const fileBuffer = await readFile(input.requestedPath);
  const contentType = contentTypeFor(input.requestedPath);

  if (contentType.startsWith("text/html")) {
    const html = input.isSubdomainRequest
      ? fileBuffer.toString("utf8")
      : injectBaseHref(fileBuffer.toString("utf8"), input.projectId);

    return new NextResponse(html, {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-cache",
      },
    });
  }

  return new NextResponse(fileBuffer, {
    headers: {
      "content-type": contentType,
      "cache-control": "no-cache",
    },
  });
}

export async function serveProjectRequest(
  request: Request,
  params: { projectId: string; path?: string[] },
  method: string,
) {
  const { projectId, path: pathSegments } = params;
  const isSubdomainRequest = extractProjectIdFromHost(request.headers.get("host")) === projectId;
  const outputRoot = path.join(process.cwd(), "backend", "deployments", projectId, "output");

  let relativePath = "";

  try {
    relativePath = normalizeSafeRelativePath(pathSegments);
  } catch {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const requestedPath = relativePath
    ? path.join(outputRoot, relativePath)
    : path.join(outputRoot, "index.html");

  const deployment = await prisma.deployment.findUnique({
    where: { projectId },
    select: {
      runtime: true,
      runtimePort: true,
    },
  });

  const hasRuntime =
    (deployment?.runtime === "nextjs" || deployment?.runtime === "node") &&
    Boolean(deployment?.runtimePort);
  const proxyRuntime = hasRuntime && shouldProxyToRuntime(deployment?.runtime, relativePath, method);

  if (proxyRuntime && deployment?.runtimePort) {
    try {
      return await proxyRuntimeRequest({
        request,
        method,
        projectId,
        runtimePort: deployment.runtimePort,
        relativePath,
        isSubdomainRequest,
      });
    } catch {
      return NextResponse.json({ error: "Backend runtime unavailable" }, { status: 502 });
    }
  }

  if (method !== "GET" && method !== "HEAD") {
    return NextResponse.json({ error: "Method not allowed for static deployment" }, { status: 405 });
  }

  try {
    return await serveStaticFile({
      requestedPath,
      projectId,
      isSubdomainRequest,
    });
  } catch {
    const fallbackPath = path.join(outputRoot, "index.html");

    try {
      return await serveStaticFile({
        requestedPath: fallbackPath,
        projectId,
        isSubdomainRequest,
      });
    } catch {
      if (hasRuntime && deployment?.runtimePort) {
        try {
          return await proxyRuntimeRequest({
            request,
            method,
            projectId,
            runtimePort: deployment.runtimePort,
            relativePath,
            isSubdomainRequest,
          });
        } catch {
          return NextResponse.json({ error: "Backend runtime unavailable" }, { status: 502 });
        }
      }

      return NextResponse.json({ error: "Deployed project not found" }, { status: 404 });
    }
  }
}
