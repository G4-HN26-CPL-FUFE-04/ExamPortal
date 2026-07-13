import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'

export const api = axios.create({ baseURL: API_BASE_URL })

export const authStorageKey = 'examportal-auth'
export const emptyAuth = { token: '', user: null }

export function normalizeRole(role) {
  return role === 'INSTRUCTOR' ? 'TEACHER' : role
}

export function normalizeAuth(auth) {
  if (!auth?.user) return auth
  return {
    ...auth,
    user: { ...auth.user, role: normalizeRole(auth.user.role) },
  }
}

function canUseStorage() {
  try {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
  } catch {
    return false
  }
}

export function readStoredAuth() {
  if (!canUseStorage()) return emptyAuth

  try {
    const saved = window.localStorage.getItem(authStorageKey)
    if (!saved) return emptyAuth

    const parsed = JSON.parse(saved)
    if (!parsed || typeof parsed !== 'object') return emptyAuth
    return normalizeAuth({
      token: typeof parsed.token === 'string' ? parsed.token : '',
      user: parsed.user && typeof parsed.user === 'object' ? parsed.user : null,
    })
  } catch {
    try {
      window.localStorage.removeItem(authStorageKey)
    } catch {
      // Ignore storage cleanup failures and keep the app usable.
    }
    return emptyAuth
  }
}

export function writeStoredAuth(auth) {
  if (!canUseStorage()) return

  try {
    if (auth?.token) {
      window.localStorage.setItem(authStorageKey, JSON.stringify(auth))
    } else {
      window.localStorage.removeItem(authStorageKey)
    }
  } catch {
    // Ignore storage write failures and keep the app usable.
  }
}

export function formatDate(value) {
  if (!value) return 'N/A'
  return new Date(value).toLocaleString()
}

export function formatTimer(totalSeconds) {
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0')
  const seconds = String(totalSeconds % 60).padStart(2, '0')
  return `${minutes}:${seconds}`
}

export function normalizeCrudPayload(form) {
  return Object.fromEntries(
    Object.entries(form).map(([key, value]) => {
      if (key.toLowerCase().includes('id') && value !== '') return [key, Number(value)]
      return [key, value]
    }),
  )
}

export function toSlug(name) {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function toSubjectSlug(name) {
  return toSlug(name)
}

export function toQuestionBankSlug(name) {
  return toSlug(name)
}
