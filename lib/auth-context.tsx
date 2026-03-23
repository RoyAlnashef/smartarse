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

function toSupportedRole(role: unknown): UserRole {
  if (role === "admin" || role === "client" || role === "user") return role
  return "client"
}

function getMockUserByEmail(email: string) {
  return users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase()) ?? null
}

function deriveUserFromSupabase(sessionUser: {
  id: string
  email?: string
  user_metadata?: Record<string, unknown>
  app_metadata?: Record<string, unknown>
}): User {
  const email = sessionUser.email ?? ""
  const matchedMock = getMockUserByEmail(email)
  const appRole = sessionUser.app_metadata?.role
  const userRole = sessionUser.user_metadata?.role
  const role = toSupportedRole(appRole ?? userRole ?? matchedMock?.role)

  return {
    id: matchedMock?.id ?? sessionUser.id,
    name: matchedMock?.name ?? (sessionUser.user_metadata?.full_name as string) ?? email.split("@")[0] ?? "User",
    email,
    role,
    clientId:
      (typeof sessionUser.user_metadata?.clientId === "string"
        ? (sessionUser.user_metadata.clientId as string)
        : undefined) ?? matchedMock?.clientId,
    avatarUrl: matchedMock?.avatarUrl,
    status: matchedMock?.status ?? "active",
    lastLogin: new Date().toISOString(),
    createdAt: matchedMock?.createdAt ?? new Date().toISOString(),
  }
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

    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (!isMounted) return
        setCurrentUser(data.user ? deriveUserFromSupabase(data.user) : null)
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return
      setCurrentUser(session?.user ? deriveUserFromSupabase(session.user) : null)
      setIsLoading(false)
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
      const mapped = deriveUserFromSupabase(data.user)
      setCurrentUser(mapped)
      return mapped
    }

    // Compatibility fallback while env keys or auth setup are incomplete.
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
