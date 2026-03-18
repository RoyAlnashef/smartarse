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

interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string) => User | null
  logout: () => void
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

function getUserFromStorage(): User | null {
  if (typeof window === "undefined") return null
  try {
    const stored = sessionStorage.getItem("disrupt-user")
    if (!stored) return null
    const parsed = JSON.parse(stored)
    // Re-hydrate against mock data to ensure full object
    return users.find((u) => u.id === parsed.id) ?? null
  } catch {
    return null
  }
}

function setUserToStorage(user: User | null) {
  if (typeof window === "undefined") return
  if (user) {
    sessionStorage.setItem("disrupt-user", JSON.stringify({ id: user.id }))
  } else {
    sessionStorage.removeItem("disrupt-user")
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Hydrate from sessionStorage on mount
  useEffect(() => {
    const stored = getUserFromStorage()
    if (stored) {
      setCurrentUser(stored)
    }
    setIsLoading(false)
  }, [])

  const login = useCallback((email: string) => {
    const found = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase())
    if (found) {
      setCurrentUser(found)
      setUserToStorage(found)
      return found
    }
    return null
  }, [])

  const logout = useCallback(() => {
    setCurrentUser(null)
    setUserToStorage(null)
  }, [])

  const switchRole = useCallback((role: UserRole) => {
    const userId = roleDefaults[role]
    const found = users.find((u) => u.id === userId)
    if (found) {
      setCurrentUser(found)
      setUserToStorage(found)
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
