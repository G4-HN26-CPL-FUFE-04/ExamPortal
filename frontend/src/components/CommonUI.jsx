import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { api, normalizeCrudPayload } from '../lib/appCore'

export function PageSection({ title, description, children }) {
  const location = useLocation()

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">{location.pathname}</p>
          <h2>{title}</h2>
          <p className="muted">{description}</p>
        </div>
      </header>
      {children}
    </section>
  )
}

export function StatsCards({ stats }) {
  return (
    <div className="stats-grid">
      {stats.map(([label, value]) => (
        <article key={label} className="panel stat-card">
          <span className="muted">{label}</span>
          <strong>{value}</strong>
        </article>
      ))}
    </div>
  )
}

export function InfoGrid({ items }) {
  return (
    <div className="stats-grid">
      {items.map(([label, value]) => (
        <article key={label} className="panel stat-card">
          <span className="muted">{label}</span>
          <strong>{value}</strong>
        </article>
      ))}
    </div>
  )
}

export function DataTable({ columns, rows }) {
  return (
    <div className="table-wrap panel">
      <table>
        <thead>
          <tr>
            {columns.map((column) => <th key={column}>{column}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function LoadingPanel() {
  return (
    <div className="panel">
      <p>Loading...</p>
    </div>
  )
}

export function CrudPage({ title, endpoint, fields }) {
  const [items, setItems] = useState([])
  const [form, setForm] = useState(() => Object.fromEntries(fields.map((field) => [field, ''])))

  const loadItems = async () => {
    const { data } = await api.get(endpoint)
    setItems(data)
  }

  useEffect(() => {
    loadItems()
  }, [endpoint])

  const handleSubmit = async (event) => {
    event.preventDefault()
    await api.post(endpoint, normalizeCrudPayload(form))
    setForm(Object.fromEntries(fields.map((field) => [field, ''])))
    loadItems()
  }

  return (
    <PageSection title={title} description={`Minimal CRUD screen for ${title.toLowerCase()}.`}>
      <div className="two-column">
        <form className="panel stack" onSubmit={handleSubmit}>
          {fields.map((field) => (
            <label key={field}>
              {field}
              <input value={form[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })} required />
            </label>
          ))}
          <button type="submit" className="primary-button">Create</button>
        </form>
        <div className="panel">
          <pre className="json-preview">{JSON.stringify(items, null, 2)}</pre>
        </div>
      </div>
    </PageSection>
  )
}
