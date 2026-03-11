/**
 * ChatBubble — renders a single message bubble for patient or agent
 */
export default function ChatBubble({ role, text, initials }) {
  const isPatient = role === 'patient'

  return (
    <div className={`chat-bubble-wrapper ${isPatient ? 'patient' : ''}`}>
      {/* Avatar */}
      <div className={`bubble-avatar ${isPatient ? 'patient-av' : ''}`}>
        {isPatient ? initials : '🩺'}
      </div>

      {/* Bubble */}
      <div className={`chat-bubble ${isPatient ? 'patient' : 'agent'}`}>
        {text}
      </div>
    </div>
  )
}
