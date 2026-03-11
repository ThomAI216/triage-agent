import { useState } from 'react'
import Welcome from './pages/Welcome.jsx'
import Chat from './pages/Chat.jsx'
import Complete from './pages/Complete.jsx'

/**
 * Simple client-side "router" — no library needed for 3 pages.
 * page: 'welcome' | 'chat' | 'complete'
 */
export default function App() {
  const [page, setPage] = useState('welcome')
  const [session, setSession] = useState(null)    // { sessionId, patientInfo }
  const [summary, setSummary] = useState(null)    // session summary from /session/end

  function handleWelcomeDone(sessionData) {
    setSession(sessionData)
    setPage('chat')
  }

  function handleChatDone(summaryData) {
    setSummary(summaryData)
    setPage('complete')
  }

  return (
    <div className="app-shell">
      {page === 'welcome' && (
        <Welcome onStart={handleWelcomeDone} />
      )}
      {page === 'chat' && session && (
        <Chat session={session} onComplete={handleChatDone} />
      )}
      {page === 'complete' && (
        <Complete summary={summary} session={session} />
      )}
    </div>
  )
}
