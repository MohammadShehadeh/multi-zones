import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    zone: "docs",
    status: "ok",
    note: "This route has no locale prefix — /docs/api/health",
    timestamp: new Date().toISOString(),
  });
}
