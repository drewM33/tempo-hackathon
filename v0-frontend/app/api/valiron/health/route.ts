import { NextResponse } from "next/server";

import { ValironError } from "@valiron/sdk";

import { getValiron, isValironEnabled } from "@/lib/valiron/client";

export async function GET() {
  if (!isValironEnabled()) {
    return NextResponse.json({
      ok: true,
      valiron: "disabled",
      hint: "Set VALIRON_ENABLED=true to call the operator API",
    });
  }

  const agentId =
    process.env.VALIRON_HEALTH_AGENT_ID?.trim() || "25459";

  try {
    const valiron = getValiron();
    const route = await valiron.checkAgent(agentId);
    return NextResponse.json({ ok: true, agentId, route });
  } catch (err) {
    const message =
      err instanceof ValironError ? err.message : "Health check failed";
    const code = err instanceof ValironError ? err.code : "UNKNOWN";
    const status =
      err instanceof ValironError && err.statusCode
        ? err.statusCode >= 400 && err.statusCode < 600
          ? err.statusCode
          : 503
        : 503;
    return NextResponse.json(
      { ok: false, agentId, error: message, code },
      { status }
    );
  }
}
