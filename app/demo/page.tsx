import { redirect } from "next/navigation"

type DemoPageProps = {
  searchParams: Promise<{ tab?: string }>
}

export default async function DemoPage({ searchParams }: DemoPageProps) {
  const { tab } = await searchParams
  redirect(tab === "login" ? "/?tab=login" : "/")
}
