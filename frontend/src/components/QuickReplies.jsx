/**
 * QuickReplies — horizontal scrollable pill buttons for suggested answers
 */
export default function QuickReplies({ replies, onSelect }) {
  if (!replies?.length) return null

  return (
    <div className="quick-replies" role="group" aria-label="Réponses rapides">
      {replies.map((r, i) => (
        <button
          key={i}
          className="quick-reply-btn"
          onClick={() => onSelect(r)}
          type="button"
        >
          {r}
        </button>
      ))}
    </div>
  )
}
