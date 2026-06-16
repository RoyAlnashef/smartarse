"use client"

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react"
import type { User, UserRole } from "./types"
import { users, clients, projects } from "./mock-data"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { fetchPublicUserRow, type PublicUserRow } from "@/lib/supabase/fetch-user-profile"
import { toSupportedRole } from "@/lib/auth/roles"

interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<User | null>
  logout: () => Promise<void>
  switchRole: (role: UserRole) => void
  getVisibleProjects: () => typeof projects
  getClientForUser: () => (typeof clients)[0] | null
}

const AuthContext = createContext<AuthContextValue | null>(null)

const roleDefaults: Record<UserRole, string> = {
  admin: "u1",
  client: "u3",
  user: "u5",
}

function getMockUserByEmail(email: string) {
  return users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase()) ?? null
}

type SessionUserShape = {
  id: string
  email?: string
  user_metadata?: Record<string, unknown>
}

function buildUserFromProfileRow(
  sessionUser: SessionUserShape,
  dbRow: PublicUserRow
): User {
  const email = sessionUser.email ?? dbRow.email ?? ""
  const role = toSupportedRole(dbRow.role)
  const clientId = dbRow.organization_id ?? undefined

  return {
    id: sessionUser.id,
    name:
      (sessionUser.user_metadata?.full_name as string) ??
      email.split("@")[0] ??
      "User",
    email,
    role,
    clientId,
    avatarUrl: undefined,
    status: (dbRow.status as User["status"]) ?? "active",
    lastLogin: new Date().toISOString(),
    createdAt: dbRow.created_at ?? new Date().toISOString(),
    creditsSpentLifetime: 0,
    marketingOptIn: false,
  }
}
/**
 * Loads the canonical profile from public.users. Fail-closed: signs out when the
 * row is missing (misconfigured RLS or incomplete provisioning).
 */
async function resolveUser(
  supabase: NonNullable<ReturnType<typeof getSupabaseBrowserClient>>,
  sessionUser: SessionUserShape
): Promise<User | null> {
  const dbRow = await fetchPublicUserRow(supabase, sessionUser.id)
  if (!dbRow) {
    await supabase.auth.signOut()
    return null
  }
  return buildUserFromProfileRow(sessionUser, dbRow)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    const supabase = getSupabaseBrowserClient()

    if (!supabase) {
      setIsLoading(false)
      return
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      queueMicrotask(() => {
        void (async () => {
          if (!isMounted) return
          try {
            if (!session?.user) {
              setCurrentUser(null)
              return
            }
            const user = await resolveUser(supabase, session.user)
            if (isMounted) setCurrentUser(user)
          } catch {
            if (isMounted) {
              await supabase.auth.signOut()
              setCurrentUser(null)
            }
          } finally {
            if (isMounted) setIsLoading(false)
          }
        })()
      })
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const supabase = getSupabaseBrowserClient()
    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error || !data.user) return null
      const mapped = await resolveUser(supabase, data.user)
      if (!mapped) return null
      setCurrentUser(mapped)
      return mapped
    }

    if (process.env.NODE_ENV === "production") {
      return null
    }

    const found = getMockUserByEmail(email)
    if (!found) return null
    setCurrentUser(found)
    return found
  }, [])

  const logout = useCallback(async () => {
    const supabase = getSupabaseBrowserClient()
    if (supabase) {
      await supabase.auth.signOut()
    }
    setCurrentUser(null)
  }, [])

  const switchRole = useCallback((role: UserRole) => {
    if (process.env.NODE_ENV === "production") return
    const userId = roleDefaults[role]
    const found = users.find((u) => u.id === userId)
    if (found) {
      setCurrentUser(found)
    }
  }, [])

  const getVisibleProjects = useCallback(() => {
    if (!currentUser) return []
    if (currentUser.role === "admin") return projects
    if (currentUser.role === "client") {
      return projects.filter((p) => p.clientId === currentUser.clientId)
    }
    return projects.filter((p) => p.assignedUserIds.includes(currentUser.id))
  }, [currentUser])

  const getClientForUser = useCallback(() => {
    if (!currentUser || !currentUser.clientId) return null
    return clients.find((c) => c.id === currentUser.clientId) ?? null
  }, [currentUser])

  return (
    <AuthContext.Provider
      value={{
        user: currentUser,
        isAuthenticated: !!currentUser,
        isLoading,
        login,
        logout,
        switchRole,
        getVisibleProjects,
        getClientForUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
