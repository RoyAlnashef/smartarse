import type { Metadata, Viewport } from "next"
import { Inter, DM_Serif_Display } from "next/font/google"
import { AuthProvider } from "@/lib/auth-context"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

const dmSerif = DM_Serif_Display({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-dm-serif",
})

export const metadata: Metadata = {
  title: "Disrupt - AI Research Assistant",
  description:
    "Interact with your market research data using natural language queries. Powered by Disrupt Insight.",
}

export const viewport: Viewport = {
  themeColor: "#262626",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${dmSerif.variable}`}>
      <body className="font-sans antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
