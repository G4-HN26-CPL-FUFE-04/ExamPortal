import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'

export const api = axios.create({ baseURL: API_BASE_URL })

export const authStorageKey = 'examportal-auth'
export const emptyAuth = { token: '', user: null }

export function readStoredAuth() {
  const saved = localStorage.getItem(authStorageKey)
  return saved ? JSON.parse(saved) : emptyAuth
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

export function toSubjectSlug(name) {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
