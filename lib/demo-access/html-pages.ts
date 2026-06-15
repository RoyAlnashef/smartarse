import { renderLandingPage } from "@/lib/demo-access/templates/shared"

export function demoHtmlSuccess(title: string, message: string): string {
  return renderLandingPage({
    title,
    message,
    tone: "success",
    primaryHref: "/?tab=login",
    primaryLabel: "Back to sign in",
    secondaryHref: "/",
    secondaryLabel: "Request demo",
  })
}

export function demoHtmlError(message: string): string {
  return renderLandingPage({
    title: "Something went wrong",
    message,
    tone: "error",
    primaryHref: "/?tab=login",
    primaryLabel: "Back to sign in",
    secondaryHref: "/",
    secondaryLabel: "Request demo",
  })
}
