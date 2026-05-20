function pageShell(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title} — smartA.R.S.E.</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #f5f0e8; color: #1a1a1a; margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; }
    .card { max-width: 420px; background: #fff; border: 2px solid #1a1a1a; border-radius: 16px; padding: 32px; text-align: center; box-shadow: 4px 4px 0 #00d4c8; }
    h1 { font-size: 1.25rem; margin: 0 0 12px; }
    p { margin: 0; line-height: 1.5; color: #444; }
    a { display: inline-block; margin-top: 20px; padding: 10px 20px; background: #ff6b9d; color: #1a1a1a; text-decoration: none; border-radius: 999px; font-weight: 700; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; border: 2px solid #1a1a1a; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${title}</h1>
    <p>${body}</p>
    <a href="/">Back to sign in</a>
  </div>
</body>
</html>`
}

export function demoHtmlSuccess(title: string, message: string): string {
  return pageShell(title, message)
}

export function demoHtmlError(message: string): string {
  return pageShell("Something went wrong", message)
}
