const reviewUrl = "https://ekiden-atlas.github.io/#submissions?review";
const types = { result: "赛果投稿", other: "其他投稿" } as const;

Deno.serve(async (request) => {
  if (request.method !== "POST") return new Response(null, { status: 405 });

  const token = Deno.env.get("ATLAS_SUBMISSION_WEBHOOK_TOKEN");
  if (!token || request.headers.get("Authorization") !== `Bearer ${token}`) {
    return new Response(null, { status: 401 });
  }

  const apiKey = Deno.env.get("ATLAS_RESEND_API_KEY");
  const from = Deno.env.get("ATLAS_ALERT_FROM");
  const to = Deno.env.get("ATLAS_ALERT_TO");
  if (!apiKey || !from || !to) return new Response(null, { status: 503 });

  const payload = await request.json().catch(() => null);
  if (!payload || !["result", "other"].includes(payload.kind) ||
    typeof payload.id !== "string" || !/^[a-f0-9-]{36}$/i.test(payload.id) ||
    typeof payload.created_at !== "string" || !Number.isFinite(Date.parse(payload.created_at))) {
    return new Response(null, { status: 400 });
  }

  const type = types[payload.kind as keyof typeof types];
  const time = new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Hong_Kong", dateStyle: "medium", timeStyle: "short",
  }).format(new Date(payload.created_at));
  try {
    const sent = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `atlas-submission/${payload.kind}/${payload.id}`,
      },
      body: JSON.stringify({
        from, to: [to],
        subject: `EKIDEN ATLAS 有一条新${type}`,
        text: `投稿类型：${type}\n投稿时间：${time}（香港时间）\n打开审核后台：${reviewUrl}`,
      }),
      signal: AbortSignal.timeout(6500),
    });
    if (!sent.ok) {
      console.error("Submission notification provider status:", sent.status);
      return new Response(null, { status: 502 });
    }
    return new Response(null, { status: 204 });
  } catch {
    console.error("Submission notification request failed");
    return new Response(null, { status: 502 });
  }
});
