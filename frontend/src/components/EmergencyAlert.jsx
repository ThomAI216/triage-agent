/**
 * EmergencyAlert — full-screen red alert with 15/112 call button.
 * Triggered when the agent detects a red flag symptom.
 */
export default function EmergencyAlert({ message }) {
  return (
    <div className="emergency-overlay" role="alertdialog" aria-modal="true">
      <div className="emergency-icon" aria-hidden="true">🚨</div>
      <h1 className="emergency-title">Urgence médicale</h1>
      <p className="emergency-message">
        {message || "Vos symptômes nécessitent une prise en charge immédiate."}
      </p>

      <a
        href="tel:15"
        className="emergency-call-btn"
        aria-label="Appeler le SAMU au 15"
      >
        📞 Appeler le 15 (SAMU)
      </a>

      <p style={{ color: 'rgba(255,255,255,0.7)', marginTop: '20px', fontSize: '14px' }}>
        ou composez le <strong style={{color:'white'}}>112</strong> (urgence européenne)
      </p>
    </div>
  )
}
