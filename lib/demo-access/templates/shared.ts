const colors = {
  bg: "#e9faf9",
  card: "#ffffff",
  text: "#171717",
  muted: "#545454",
  border: "#1a1a1a",
  cyan: "#00d4c8",
  pink: "#ff4fb2",
  neutral: "#f4f4f5",
}

type EmailButtonVariant = "primary" | "secondary"
type PageTone = "success" | "neutral" | "error"

function emailButtonStyle(variant: EmailButtonVariant): string {
  const isPrimary = variant === "primary"
  return [
    "display:inline-block",
    "padding:12px 24px",
    "border-radius:999px",
    `border:2px solid ${colors.border}`,
    "font-size:13px",
    "font-weight:800",
    "text-decoration:none",
    "text-transform:uppercase",
    "letter-spacing:0.06em",
    `background:${isPrimary ? colors.pink : colors.card}`,
    `color:${colors.text}`,
  ].join(";")
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

export function formatDemoTimestamp(value: string): string {
  return new Date(value).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

export function renderEmailLayout(options: {
  title: string
  intro: string
  bodyHtml: string
  footer: string
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<body style="margin:0;padding:24px;background:${colors.bg};font-family:Inter,Segoe UI,Roboto,Arial,sans-serif;color:${colors.text};">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px;margin:0 auto;background:${colors.card};border:2px solid ${colors.border};border-radius:16px;box-shadow:4px 4px 0 ${colors.cyan};">
    <tr>
      <td style="padding:28px 24px 14px 24px;font-size:24px;font-weight:800;line-height:1.2;">${escapeHtml(options.title)}</td>
    </tr>
    <tr>
      <td style="padding:0 24px 8px 24px;font-size:16px;line-height:1.5;">${escapeHtml(options.intro)}</td>
    </tr>
    <tr>
      <td style="padding:0 24px 10px 24px;font-size:15px;line-height:1.5;">${options.bodyHtml}</td>
    </tr>
    <tr>
      <td style="padding:8px 24px 26px 24px;font-size:12px;line-height:1.5;color:${colors.muted};">${escapeHtml(options.footer)}</td>
    </tr>
  </table>
</body>
</html>`
}

export function renderEmailButton(
  href: string,
  label: string,
  variant: EmailButtonVariant
): string {
  return `<a href="${escapeHtml(href)}" style="${emailButtonStyle(variant)}">${escapeHtml(label)}</a>`
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
