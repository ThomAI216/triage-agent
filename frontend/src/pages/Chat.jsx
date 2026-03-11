import { useState, useEffect, useRef, useCallback } from 'react'
import ChatBubble from '../components/ChatBubble.jsx'
import QuickReplies from '../components/QuickReplies.jsx'
import InputBar from '../components/InputBar.jsx'
import EmergencyAlert from '../components/EmergencyAlert.jsx'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

/**
 * Chat page — the main triage conversation.
 * Orchestrates: message sending, AI response display, typing indicator,
 * quick replies, emergency detection, and session completion.
 */
export default function Chat({ session, onComplete }) {
  const { sessionId, patientInfo } = session
  const [messages, setMessages] = useState([])
  const [quickReplies, setQuickReplies] = useState([])
  const [isTyping, setIsTyping] = useState(false)
  const [redFlag, setRedFlag] = useState(null)
  const [inputDisabled, setInputDisabled] = useState(false)
  const [step, setStep] = useState(1)
  const messagesEndRef = useRef(null)
  const hasStarted = useRef(false)

  // Send the opening message once on mount
  useEffect(() => {
    if (hasStarted.current) return
    hasStarted.current = true

    const greeting = patientInfo.reason
      ? `Bonjour, je consulte pour : ${patientInfo.reason}`
      : 'Bonjour, je suis prêt(e) à commencer.'

    // Small delay so the UI is rendered first
    setTimeout(() => sendMessage(greeting, true), 500)
  }, []) // eslint-disable-line

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const sendMessage = useCallback(async (text, isInitial = false) => {
    if (!text?.trim() || inputDisabled) return

    const userMsg = { role: 'patient', text: text.trim(), id: Date.now() }

    // Show patient message (not for hidden initial trigger)
    if (!isInitial) {
      setMessages(prev => [...prev, userMsg])
      setQuickReplies([])
    }

    setIsTyping(true)
    setInputDisabled(true)

    try {
      const res = await fetch(`${API}/session/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, message: text.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur serveur')

      setIsTyping(false)

      if (data.redFlag) {
        setRedFlag(data.redFlagMessage || "Appelez le 15 (SAMU) ou le 112 immédiatement.")
        return
      }

      // Add agent message
      setMessages(prev => [...prev, {
        role: 'agent',
        text: data.text,
        id: Date.now() + 1,
      }])

      setQuickReplies(data.quickReplies || [])
      setStep(s => Math.min(s + 1, 3))

      if (data.sessionComplete) {
        setInputDisabled(true)
        // End session and get summary
        const endRes = await fetch(`${API}/session/end`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        })
        const summary = await endRes.json()
        setTimeout(() => onComplete(summary), 1800)
        return
      }

      setInputDisabled(false)
    } catch (err) {
      setIsTyping(false)
      setInputDisabled(false)
      setMessages(prev => [...prev, {
        role: 'agent',
        text: `⚠️ Désolé, une erreur est survenue. Veuillez réessayer. (${err.message})`,
        id: Date.now() + 2,
      }])
    }
  }, [sessionId, inputDisabled, onComplete])

  if (redFlag) {
    return <EmergencyAlert message={redFlag} />
  }

  const stepDot = (n) => {
    if (step > n) return 'step-dot done'
    if (step === n) return 'step-dot active'
    return 'step-dot'
  }

  return (
    <>
      {/* Header */}
      <header className="app-header">
        <div className="logo">CC</div>
        <div className="header-info">
          <div className="header-title">Assistant médical</div>
          <div className="header-subtitle">{patientInfo.name}</div>
        </div>
        <div className="step-indicator">
          <div className={stepDot(1)} />
          <div className={stepDot(2)} />
          <div className={stepDot(3)} />
        </div>
      </header>

      {/* Chat area */}
      <div className="chat-page">
        <div className="chat-messages">
          {messages.map(msg => (
            <ChatBubble
              key={msg.id}
              role={msg.role}
              text={msg.text}
              initials={patientInfo.name?.charAt(0)?.toUpperCase() || '?'}
            />
          ))}

          {isTyping && (
            <div className="chat-bubble-wrapper">
              <div className="bubble-avatar">🩺</div>
              <div className="chat-bubble agent">
                <div className="typing-indicator">
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick replies (shown above input bar) */}
        {quickReplies.length > 0 && !inputDisabled && (
          <QuickReplies
            replies={quickReplies}
            onSelect={(r) => sendMessage(r)}
          />
        )}

        {/* Input bar */}
        <InputBar
          disabled={inputDisabled}
          onSend={sendMessage}
        />
      </div>
    </>
  )
}
