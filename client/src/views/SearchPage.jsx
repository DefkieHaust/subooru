import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchPosts, fetchTags } from '../api.js'
import { getCachedTagType, getUncachedTagNames, updateTagTypeCache } from '../utils.js'
import PostGrid from '../components/PostGrid.jsx'

export default function SearchPage({ query, onQueryChange, settings, onToggleBlacklist, onToggleFavorite, onOpenFullscreen }) {
  const { page: pageParam, query: queryParam } = useParams()
  const navigate = useNavigate()
  const currentPage = parseInt(pageParam, 10) || 1

  const [posts, setPosts] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [hasSearched, setHasSearched] = useState(false)

  const parsedTags = useMemo(() => {
    if (!queryParam) return { include: [], exclude: [] }
    const include = []
    const exclude = []
    for (const p of queryParam.split(',')) {
      if (p.startsWith('-')) exclude.push(p.slice(1))
      else include.push(p)
    }
    return { include, exclude }
  }, [queryParam])

  useEffect(() => {
    if (!queryParam) {
      onQueryChange({ include: [], exclude: [] })
      return
    }
    const include = []
    const exclude = []
    for (const p of queryParam.split(',')) {
      if (p.startsWith('-')) {
        const name = p.slice(1)
        exclude.push({ name, type: getCachedTagType(name) || 'general', count: 0 })
      } else {
        include.push({ name: p, type: getCachedTagType(p) || 'general', count: 0 })
      }
    }
    onQueryChange({ include, exclude })
  }, [queryParam, onQueryChange])

  useEffect(() => {
    if (!queryParam) return
    const names = getUncachedTagNames(queryParam.split(',').filter(t => !t.startsWith('-')))
    if (!names.length) return
    let cancelled = false
    fetchTags(names).then(data => {
      if (cancelled) return
      const updates = {}
      for (const r of (data.results || [])) {
        if (r.name && r.type && r.type !== 'general') {
          updateTagTypeCache(r.name, r.type)
          updates[r.name] = r.type
        }
      }
      if (Object.keys(updates).length === 0) return
      onQueryChange(q => {
        const include = q.include.map(t => ({ ...t, type: updates[t.name] || t.type }))
        const exclude = q.exclude.map(t => ({ ...t, type: updates[t.name] || t.type }))
        return { include, exclude }
      })
    }).catch(() => {})
    return () => { cancelled = true }
  }, [queryParam, onQueryChange])

  useEffect(() => {
    if (pageParam === undefined) return
    let cancelled = false

    setLoading(true)
    setError(null)

    async function doSearch() {
      try {
        const blacklistedNames = (settings.blacklist || []).map(t => t.name)
        const data = await fetchPosts({
          tags: {
            include: parsedTags.include,
            exclude: [...parsedTags.exclude, ...blacklistedNames]
          },
          page: currentPage
        })
        if (cancelled) return
        setPosts(data.results || [])
        setTotalCount(data.total_count || 0)
      } catch (err) {
        if (cancelled) return
        setError(err.message)
        setPosts([])
        setTotalCount(0)
      } finally {
        if (!cancelled) {
          setLoading(false)
          setHasSearched(true)
        }
      }
    }

    doSearch()
    return () => { cancelled = true }
  }, [currentPage, pageParam, queryParam, parsedTags, settings.blacklist])

  const handlePageChange = useCallback((page) => {
    const params = query.include.map(t => t.name).concat(query.exclude.map(t => `-${t.name}`))
    navigate(`/search/${page}/${params.join(',')}`)
  }, [query, navigate])

  const blacklistedNames = (settings.blacklist || []).map(t => t.name)
  const countPerPage = 100
  const maxPage = totalCount > 0 ? Math.ceil(totalCount / countPerPage) : null

  if (pageParam === undefined) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center text-center" style={{ height: '400px' }}>
        <h2 className="fw-bold" style={{ color: '#e94560' }}>subooru</h2>
        <p className="text-light opacity-75">Enter tags in the sidebar and click Search</p>
      </div>
    )
  }

  if (loading || !hasSearched) {
    return (
      <div className="d-flex align-items-center justify-content-center text-light" style={{ height: '200px' }}>
        {error ? (
          <span className="text-danger">{error}</span>
        ) : (
          <>
            <div className="spinner-border me-2 text-light" role="status" />
            Loading...
          </>
        )}
      </div>
    )
  }

  if (!totalCount && posts.length === 0) {
    return (
      <div className="d-flex align-items-center justify-content-center text-light" style={{ height: '200px' }}>
        No results found
      </div>
    )
  }

  return (
    <>
      <PostGrid
        posts={posts}
        settings={settings}
        onToggleBlacklist={onToggleBlacklist}
        onToggleFavorite={onToggleFavorite}
        onOpenFullscreen={onOpenFullscreen}
        blacklistedTags={blacklistedNames}
      />

      <div
        className="d-flex justify-content-between align-items-center px-3"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '48px',
          background: 'var(--bg)',
          borderTop: '1px solid #495057',
          zIndex: 1020
        }}
      >
        <span className="text-light small">
          {totalCount > 0 ? `${totalCount.toLocaleString()} posts` : posts.length > 0 ? `${posts.length} posts` : ''}
        </span>
        <div className="d-flex align-items-center gap-2">
          <button
            className="btn btn-sm btn-outline-light"
            disabled={currentPage <= 1 || loading}
            onClick={() => handlePageChange(currentPage - 1)}
          >
            Prev
          </button>
          <span className="text-light small">
            Page {currentPage}{maxPage != null ? ` / ${Math.min(maxPage, 200)}` : ''}
          </span>
          <button
            className="btn btn-sm btn-outline-light"
            disabled={(maxPage != null && currentPage >= maxPage) || currentPage >= 200 || loading}
            onClick={() => handlePageChange(currentPage + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </>
  )
}
