import { readFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string; path?: string[] }> },
) {
  const { projectId, path: pathSegments } = await params;

  const outputRoot = path.join(process.cwd(), "backend", "deployments", projectId, "output");

  let relativePath = "";

  try {
    relativePath = normalizeSafeRelativePath(pathSegments);
  } catch {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const requestedPath = relativePath ? path.join(outputRoot, relativePath) : path.join(outputRoot, "index.html");

  try {
    const fileBuffer = await readFile(requestedPath);
    const contentType = contentTypeFor(requestedPath);

    if (contentType.startsWith("text/html")) {
      const html = injectBaseHref(fileBuffer.toString("utf8"), projectId);

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
      const html = injectBaseHref(fallbackBuffer.toString("utf8"), projectId);

      return new NextResponse(html, {
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "no-cache",
        },
      });
    } catch {
      return NextResponse.json({ error: "Deployed project not found" }, { status: 404 });
    }
  }
}
