export default function Pagination({ page, totalCount, resultsPerPage, onPageChange, loading }) {
  const maxPage = Math.ceil(totalCount / resultsPerPage)

  return (
    <div className="d-flex justify-content-between align-items-center px-3 py-2 border-top border-secondary mt-1">
      <span className="text-muted small">
        {totalCount > 0 ? `${totalCount.toLocaleString()} posts` : ''}
      </span>
      <div className="d-flex align-items-center gap-2">
        <button
          className="btn btn-sm btn-outline-light"
          disabled={page <= 1 || loading}
          onClick={() => onPageChange(page - 1)}
        >
          Prev
        </button>
        <span className="text-muted small">
          Page {page}{maxPage > 0 ? ` / ${Math.min(maxPage, 200)}` : ''}
        </span>
        <button
          className="btn btn-sm btn-outline-light"
          disabled={page >= 200 || loading}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  )
}
