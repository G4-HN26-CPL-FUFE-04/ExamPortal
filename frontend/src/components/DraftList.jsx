export default function DraftList({
  drafts,
  selectedDraftId,
  onSelect,
  onCreate,
  onPreview,
  onDelete,
  busy = false,
  title = 'Draft list',
  emptyMessage = 'No drafts yet.',
  actionLabel = 'Create draft',
}) {
  return (
    <div className="panel stack draft-sidebar-panel">
      <div className="row-between wrap-row">
        <h3>{title}</h3>
        {onCreate ? (
          <button type="button" className="primary-button" onClick={onCreate}>
            {actionLabel}
          </button>
        ) : null}
      </div>

      <div className="draft-list">
        {drafts.map((draft) => (
          <article
            key={draft.id}
            className={selectedDraftId === draft.id ? 'question-card selected-card draft-list-card draft-list-card-compact' : 'question-card draft-list-card draft-list-card-compact'}
            onClick={() => onSelect?.(draft)}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onSelect?.(draft)
              }
            }}
          >
            <div className="row-between wrap-row">
              <div className="draft-card-copy">
                <h3>{draft.title}</h3>
                <p className="muted">{draft.subjectName}</p>
              </div>
              <div className="action-row draft-card-actions">
                <span className="muted draft-card-count">{draft.questionCount} / {draft.requiredQuestionCount}</span>
                {onPreview ? (
                  <button
                    type="button"
                    className="ghost-button draft-card-button"
                    onClick={(event) => {
                      event.stopPropagation()
                      onPreview(draft)
                    }}
                    disabled={busy}
                  >
                    Preview
                  </button>
                ) : null}
                {onDelete ? (
                  <button
                    type="button"
                    className="icon-button danger-icon-button draft-card-icon"
                    onClick={(event) => {
                      event.stopPropagation()
                      onDelete(draft)
                    }}
                    disabled={busy}
                    aria-label={`Delete ${draft.title}`}
                  >
                    x
                  </button>
                ) : null}
              </div>
            </div>
          </article>
        ))}
      </div>

      {!drafts.length ? <p className="muted">{emptyMessage}</p> : null}
    </div>
  )
}
