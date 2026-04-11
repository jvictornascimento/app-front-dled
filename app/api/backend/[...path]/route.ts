import { NextRequest } from "next/server";

const BACKEND_BASE_URL = process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8081/v1";
const API_KEY = process.env.BACKEND_API_KEY ?? process.env.NEXT_PUBLIC_API_KEY ?? "test-api-key";

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
  const body = method === "GET" || method === "HEAD" ? undefined : await request.text();

  const response = await fetch(target, {
    method,
    headers,
    body,
    redirect: "manual",
    cache: "no-store",
  });

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
