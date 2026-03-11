import { useState, useRef, useEffect } from 'react'

/**
 * InputBar — chat message input with send button and optional speech-to-text.
 * Uses the Web Speech API (available in Chrome, Edge, Safari 15+).
 */
export default function InputBar({ onSend, disabled }) {
  const [text, setText] = useState('')
  const [recording, setRecording] = useState(false)
  const textareaRef = useRef(null)
  const recognitionRef = useRef(null)
  const sttSupported = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`
  }, [text])

  function handleKey(e) {
    // Send on Enter (not Shift+Enter) on desktop
    if (e.key === 'Enter' && !e.shiftKey && !disabled) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleSend() {
    const trimmed = text.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setText('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  function toggleMic() {
    if (!sttSupported) return

    if (recording) {
      recognitionRef.current?.stop()
      setRecording(false)
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.lang = 'fr-FR'
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    recognition.onresult = (e) => {
      const transcript = Array.from(e.results)
        .map(r => r[0].transcript)
        .join('')
      setText(transcript)
    }

    recognition.onend = () => {
      setRecording(false)
    }

    recognition.onerror = () => {
      setRecording(false)
    }

    recognitionRef.current = recognition
    recognition.start()
    setRecording(true)
  }

  const canSend = text.trim().length > 0 && !disabled

  return (
    <div className="input-bar">
      <div className="input-field-wrapper">
        <textarea
          ref={textareaRef}
          className="chat-textarea"
          rows={1}
          placeholder="Votre réponse…"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKey}
          disabled={disabled}
          aria-label="Message"
        />
      </div>

      {/* Mic button (STT) */}
      {sttSupported && (
        <button
          type="button"
          className={`icon-btn mic-btn ${recording ? 'recording' : ''}`}
          onClick={toggleMic}
          disabled={disabled}
          aria-label={recording ? 'Arrêter l\'enregistrement' : 'Parler'}
          title={recording ? 'Arrêter' : 'Dicter votre réponse'}
        >
          {recording ? '⏹' : '🎤'}
        </button>
      )}

      {/* Send button */}
      <button
        type="button"
        className="icon-btn send-btn"
        onClick={handleSend}
        disabled={!canSend}
        aria-label="Envoyer"
      >
        ➤
      </button>
    </div>
  )
}
