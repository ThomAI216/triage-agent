import { useState, useEffect } from 'react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

/**
 * Welcome page
 * - Reads ?name=&email=&appt=&reason= from URL params
 * - Shows appointment banner if params present
 * - Collects consent, calls /session/start
 */
export default function Welcome({ onStart }) {
  const [fields, setFields] = useState({ name: '', email: '', appt: '', reason: '' })
  const [consent, setConsent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [fromLink, setFromLink] = useState(false)

  // Pre-populate from URL query params (set by booking system)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const prefill = {
      name: params.get('name') || '',
      email: params.get('email') || '',
      appt: params.get('appt') || '',
      reason: params.get('reason') || '',
    }
    setFields(prefill)
    if (prefill.name || prefill.email) {
      setFromLink(true)
    }
  }, [])

  const canSubmit = fields.name.trim() && fields.email.trim() && consent && !loading

  async function handleStart() {
    if (!canSubmit) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API}/session/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur serveur')
      onStart({ ...data, patientInfo: fields })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function formatAppt(iso) {
    if (!iso) return null
    try {
      return new Date(iso).toLocaleString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return iso
    }
  }

  return (
    <>
      {/* Header */}
      <header className="app-header">
        <div className="logo">CC</div>
        <div className="header-info">
          <div className="header-title">Clinique Convent</div>
          <div className="header-subtitle">Pré-consultation médicale</div>
        </div>
        <div className="step-indicator">
          <div className="step-dot active" />
          <div className="step-dot" />
          <div className="step-dot" />
        </div>
      </header>

      <main className="welcome-page">
        {/* Hero */}
        <div className="welcome-hero">
          <div className="hero-icon">🩺</div>
          <h1>Bienvenue</h1>
          <p>
            Avant votre consultation, notre assistant va recueillir
            vos symptômes pour aider votre médecin.
          </p>
        </div>

        {/* Appointment banner */}
        {fields.appt && (
          <div className="appt-banner">
            <span className="appt-icon">📅</span>
            <span className="appt-text">
              Rendez-vous le {formatAppt(fields.appt)}
              {fields.reason && ` · ${fields.reason}`}
            </span>
          </div>
        )}

        {/* Form */}
        <div className="welcome-form">
          <div className="form-group">
            <label htmlFor="name">Votre prénom et nom</label>
            <input
              id="name"
              type="text"
              className="form-input"
              placeholder="ex. Marie Dupont"
              value={fields.name}
              readOnly={fromLink && !!fields.name}
              onChange={e => setFields(f => ({ ...f, name: e.target.value }))}
              autoComplete="name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Adresse e-mail</label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="ex. marie@email.com"
              value={fields.email}
              readOnly={fromLink && !!fields.email}
              onChange={e => setFields(f => ({ ...f, email: e.target.value }))}
              autoComplete="email"
            />
          </div>

          {!fields.reason && (
            <div className="form-group">
              <label htmlFor="reason">Motif de consultation</label>
              <input
                id="reason"
                type="text"
                className="form-input"
                placeholder="ex. Mal de gorge depuis 3 jours"
                value={fields.reason}
                onChange={e => setFields(f => ({ ...f, reason: e.target.value }))}
              />
              <span className="form-hint">Optionnel — l'assistant vous posera la question si besoin</span>
            </div>
          )}

          {/* Consent */}
          <div className="consent-block">
            <label className="consent-label">
              <input
                type="checkbox"
                checked={consent}
                onChange={e => setConsent(e.target.checked)}
              />
              <span>
                J'accepte que mes réponses soient transmises à mon médecin pour préparer
                la consultation. Ces données ne seront pas utilisées à d'autres fins.
              </span>
            </label>
          </div>

          {/* Error */}
          {error && (
            <p style={{ color: 'var(--color-danger)', fontSize: 'var(--font-size-sm)', textAlign: 'center' }}>
              ⚠️ {error}
            </p>
          )}

          {/* CTA */}
          <button className="btn btn-primary" onClick={handleStart} disabled={!canSubmit}>
            {loading ? '⏳ Démarrage…' : 'Commencer la pré-consultation →'}
          </button>
        </div>
      </main>
    </>
  )
}
