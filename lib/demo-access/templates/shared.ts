import { emailColors } from "@/lib/email/tokens"
import { escapeHtml } from "@/lib/email/escape"

export {
  escapeHtml,
  renderEmailLayout,
  renderEmailButton,
  renderEmailButtonRow,
} from "@/lib/email"

const colors = emailColors

type PageTone = "success" | "neutral" | "error"

export function formatDemoTimestamp(value: string): string {
  return new Date(value).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

export function renderLandingPage(options: {
  title: string
  message: string
  tone: PageTone
  primaryHref: string
  primaryLabel: string
  secondaryHref?: string
  secondaryLabel?: string
}): string {
  const toneShadow =
    options.tone === "error"
      ? colors.neutral
      : options.tone === "success"
        ? colors.cyan
        : colors.cyan

  const primaryBg = options.tone === "error" ? colors.neutral : colors.pink
  const secondary =
    options.secondaryHref && options.secondaryLabel
      ? `\n      <a class="btn btn-secondary" href="${escapeHtml(options.secondaryHref)}">${escapeHtml(options.secondaryLabel)}</a>`
      : ""

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(options.title)} — smartA.R.S.E.</title>
  <style>
    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      background: ${colors.bg};
      color: ${colors.text};
      font-family: Inter, "Segoe UI", Roboto, Arial, sans-serif;
    }
    .card {
      width: 100%;
      max-width: 480px;
      background: ${colors.card};
      border: 2px solid ${colors.border};
      border-radius: 16px;
      box-shadow: 4px 4px 0 ${toneShadow};
      padding: 30px 26px;
      text-align: center;
    }
    h1 {
      margin: 0 0 10px;
      font-size: 34px;
      line-height: 1.1;
      font-weight: 800;
      letter-spacing: -0.01em;
    }
    p {
      margin: 0;
      font-size: 16px;
      line-height: 1.55;
      color: ${colors.muted};
    }
    .actions {
      margin-top: 22px;
      display: flex;
      justify-content: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 146px;
      padding: 11px 18px;
      border-radius: 999px;
      border: 2px solid ${colors.border};
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      text-decoration: none;
      color: ${colors.text};
    }
    .btn-primary {
      background: ${primaryBg};
    }
    .btn-secondary {
      background: ${colors.card};
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>${escapeHtml(options.title)}</h1>
    <p>${escapeHtml(options.message)}</p>
    <div class="actions">
      <a class="btn btn-primary" href="${escapeHtml(options.primaryHref)}">${escapeHtml(options.primaryLabel)}</a>${secondary}
    </div>
  </div>
</body>
</html>`
}
