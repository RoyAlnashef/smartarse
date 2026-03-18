import type { Metadata, Viewport } from "next"
import localFont from "next/font/local"
import { DM_Sans, DM_Serif_Display, Inter, Raleway } from "next/font/google"
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

/** smart A.R.S.E — “smart” wordmark (user-supplied; see app/fonts/) */
const vintageGoods = localFont({
  src: "./fonts/VintageGoods.ttf",
  variable: "--font-vintage-goods",
  display: "swap",
})

/** A.R.S.E, titles, taglines */
const raleway = Raleway({
  subsets: ["latin"],
  variable: "--font-raleway",
  display: "swap",
})

/** Client-themed body copy */
const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans-arse",
  display: "swap",
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
    <html
      lang="en"
      className={`${inter.variable} ${dmSerif.variable} ${vintageGoods.variable} ${raleway.variable} ${dmSans.variable}`}
    >
      <body className="font-sans antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
