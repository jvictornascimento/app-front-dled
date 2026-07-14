import { NextRequest } from "next/server";

function normalizeLocalBackendUrl(url: string) {
  return url.replace("http://localhost:", "http://127.0.0.1:");
}

const BACKEND_BASE_URL = normalizeLocalBackendUrl(
  process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8081/v1",
);
const API_KEY = process.env.BACKEND_API_KEY ?? process.env.NEXT_PUBLIC_API_KEY ?? "test-api-key";

function backendUnavailable(request: NextRequest, target: URL, cause: unknown) {
  const message = cause instanceof Error ? cause.message : "Backend unavailable";

  console.error(`[backend-proxy] Failed to reach ${target.toString()}: ${message}`);

  return Response.json(
    {
      timestamp: new Date().toISOString(),
      status: 500,
      error: "Internal Server Error",
      message: "Backend indisponivel. Verifique se a API esta em execucao e acessivel pelo front.",
      path: request.nextUrl.pathname,
    },
    { status: 500 },
  );
}

async function forward(request: NextRequest, segments: string[]) {
  const target = new URL(`${BACKEND_BASE_URL}/${segments.join("/")}`);
  target.search = request.nextUrl.search;

  const headers = new Headers();
  headers.set("X-API-Key", API_KEY);

  const contentType = request.headers.get("content-type");
  if (contentType) {
    headers.set("content-type", contentType);
  }

  const authorization = request.headers.get("authorization");
  if (authorization) {
    headers.set("authorization", authorization);
  }

  const cookie = request.headers.get("cookie");
  if (cookie) {
    headers.set("cookie", cookie);
  }

  const method = request.method.toUpperCase();
  const body = method === "GET" || method === "HEAD" ? undefined : await request.arrayBuffer();

  let response: Response;
  try {
    response = await fetch(target, {
      method,
      headers,
      body,
      redirect: "manual",
      cache: "no-store",
    });
  } catch (cause) {
    return backendUnavailable(request, target, cause);
  }

  const nextHeaders = new Headers();
  const responseContentType = response.headers.get("content-type");
  if (responseContentType) {
    nextHeaders.set("content-type", responseContentType);
  }

  const setCookie = response.headers.get("set-cookie");
  if (setCookie) {
    nextHeaders.set("set-cookie", setCookie);
  }

  return new Response(response.body, {
    status: response.status,
    headers: nextHeaders,
  });
}

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return forward(request, (await context.params).path);
}

export async function POST(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return forward(request, (await context.params).path);
}

export async function PUT(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return forward(request, (await context.params).path);
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return forward(request, (await context.params).path);
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return forward(request, (await context.params).path);
}
