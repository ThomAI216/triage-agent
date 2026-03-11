/**
 * Complete page — shown after triage session ends.
 * Reassures the patient and shows appointment details.
 */
export default function Complete({ summary, session }) {
  const patientInfo = session?.patientInfo || {}

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
          <div className="header-subtitle">Pré-consultation terminée</div>
        </div>
        <div className="step-indicator">
          <div className="step-dot done" />
          <div className="step-dot done" />
          <div className="step-dot done" />
        </div>
      </header>

      <main className="complete-page">
        <div className="complete-icon">✅</div>

        <div>
          <h1 className="complete-title">Merci, {patientInfo.name?.split(' ')[0] || 'vous'} !</h1>
          <p className="complete-subtitle mt-sm">
            Vos informations ont été transmises à votre médecin.
            La consultation peut maintenant commencer dans les meilleures conditions.
          </p>
        </div>

        {/* Appointment card */}
        {patientInfo.appt && (
          <div className="appt-card w-full">
            <div className="appt-card-row">
              <span className="row-icon">📅</span>
              <div>
                <div className="row-label">Rendez-vous</div>
                <div className="row-value">{formatAppt(patientInfo.appt)}</div>
              </div>
            </div>
            {patientInfo.reason && (
              <div className="appt-card-row">
                <span className="row-icon">🩺</span>
                <div>
                  <div className="row-label">Motif</div>
                  <div className="row-value">{patientInfo.reason}</div>
                </div>
              </div>
            )}
            {patientInfo.email && (
              <div className="appt-card-row">
                <span className="row-icon">✉️</span>
                <div>
                  <div className="row-label">Confirmation envoyée à</div>
                  <div className="row-value">{patientInfo.email}</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Reassurance note */}
        <p className="text-sm text-muted text-center" style={{ maxWidth: 300, lineHeight: 1.6 }}>
          Vous pouvez fermer cette fenêtre. Votre médecin a reçu un résumé
          de vos symptômes et se prépare pour vous accueillir.
        </p>
      </main>
    </>
  )
}
