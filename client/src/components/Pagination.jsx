export default function Pagination({ page, totalCount, resultsPerPage, onPageChange, loading }) {
  const maxPage = Math.ceil(totalCount / resultsPerPage)

  return (
    <div className="pagination">
      <div className="pagination-info">
        {totalCount > 0 ? `${totalCount.toLocaleString()} posts` : ''}
      </div>
      <div className="pagination-controls">
        <button
          disabled={page <= 1 || loading}
          onClick={() => onPageChange(page - 1)}
        >
          Prev
        </button>
        <span className="pagination-current">Page {page}{maxPage > 0 ? ` / ${Math.min(maxPage, 200)}` : ''}</span>
        <button
          disabled={page >= 200 || loading}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  )
}
