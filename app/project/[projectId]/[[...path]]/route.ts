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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string; path?: string[] }> },
) {
  const { projectId, path: pathSegments } = await params;
  const isSubdomainRequest = extractProjectIdFromHost(request.headers.get("host")) === projectId;

  const outputRoot = path.join(process.cwd(), "backend", "deployments", projectId, "output");

  let relativePath = "";

  try {
    relativePath = normalizeSafeRelativePath(pathSegments);
  } catch {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const requestedPath = relativePath ? path.join(outputRoot, relativePath) : path.join(outputRoot, "index.html");

  const deployment = await prisma.deployment.findUnique({
    where: { projectId },
    select: {
      runtime: true,
      runtimePort: true,
    },
  });

  const hasRuntime = (deployment?.runtime === "nextjs" || deployment?.runtime === "node") && Boolean(deployment?.runtimePort);
  const proxyRuntimeFirst = shouldProxyRuntimeFirst(deployment?.runtime, relativePath);

  if (hasRuntime && proxyRuntimeFirst) {
    const runtimeUrl = new URL(`http://127.0.0.1:${deployment.runtimePort}`);
    runtimeUrl.pathname = relativePath ? `/${relativePath}` : "/";
    runtimeUrl.search = new URL(request.url).search;

    try {
      const forwardedHeaders = new Headers();
      const headerAllowList = [
        "accept",
        "accept-language",
        "cookie",
        "user-agent",
        "x-forwarded-for",
        "x-forwarded-host",
        "x-forwarded-proto",
      ];

      for (const headerName of headerAllowList) {
        const value = request.headers.get(headerName);

        if (value) {
          forwardedHeaders.set(headerName, value);
        }
      }

      const proxied = await fetch(runtimeUrl, {
        method: "GET",
        cache: "no-store",
        headers: forwardedHeaders,
      });

      const headers = new Headers(proxied.headers);
      const contentType = proxied.headers.get("content-type") ?? "";

      if (contentType.includes("text/html")) {
        const html = await proxied.text();
        const responseHtml = isSubdomainRequest ? html : rewriteRuntimeHtmlForProject(html, projectId);

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
    } catch {
      return NextResponse.json({ error: "Backend runtime unavailable" }, { status: 502 });
    }
  }

  try {
    const fileBuffer = await readFile(requestedPath);
    const contentType = contentTypeFor(requestedPath);

    if (contentType.startsWith("text/html")) {
      const html = isSubdomainRequest ? fileBuffer.toString("utf8") : injectBaseHref(fileBuffer.toString("utf8"), projectId);

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
  } catch {
    const fallbackPath = path.join(outputRoot, "index.html");

    try {
      const fallbackBuffer = await readFile(fallbackPath);
      const html = isSubdomainRequest
        ? fallbackBuffer.toString("utf8")
        : injectBaseHref(fallbackBuffer.toString("utf8"), projectId);

      return new NextResponse(html, {
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "no-cache",
        },
      });
    } catch {
      if (hasRuntime && deployment?.runtimePort) {
        const runtimeUrl = new URL(`http://127.0.0.1:${deployment.runtimePort}`);
        runtimeUrl.pathname = relativePath ? `/${relativePath}` : "/";
        runtimeUrl.search = new URL(request.url).search;

        try {
          const forwardedHeaders = new Headers();
          const headerAllowList = [
            "accept",
            "accept-language",
            "cookie",
            "user-agent",
            "x-forwarded-for",
            "x-forwarded-host",
            "x-forwarded-proto",
          ];

          for (const headerName of headerAllowList) {
            const value = request.headers.get(headerName);

            if (value) {
              forwardedHeaders.set(headerName, value);
            }
          }

          const proxied = await fetch(runtimeUrl, {
            method: "GET",
            cache: "no-store",
            headers: forwardedHeaders,
          });

          const headers = new Headers(proxied.headers);
          const contentType = proxied.headers.get("content-type") ?? "";

          if (contentType.includes("text/html")) {
            const html = await proxied.text();
            const responseHtml = isSubdomainRequest ? html : rewriteRuntimeHtmlForProject(html, projectId);

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
        } catch {
          return NextResponse.json({ error: "Backend runtime unavailable" }, { status: 502 });
        }
      }

      return NextResponse.json({ error: "Deployed project not found" }, { status: 404 });
    }
  }
}
