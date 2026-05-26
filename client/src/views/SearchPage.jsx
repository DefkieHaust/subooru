import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchPosts } from '../api.js'
import PostGrid from '../components/PostGrid.jsx'
import Pagination from '../components/Pagination.jsx'

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
    if (!queryParam) return null
    const include = []
    const exclude = []
    for (const p of queryParam.split(',')) {
      if (p.startsWith('-')) exclude.push(p.slice(1))
      else include.push(p)
    }
    return { include, exclude }
  }, [queryParam])

  useEffect(() => {
    if (queryParam) {
      const include = []
      const exclude = []
      for (const p of queryParam.split(',')) {
        if (p.startsWith('-')) exclude.push({ name: p.slice(1), type: 'general', count: 0 })
        else include.push({ name: p, type: 'general', count: 0 })
      }
      onQueryChange({ include, exclude })
    }
  }, [queryParam, onQueryChange])

  useEffect(() => {
    if (!queryParam) return
    let cancelled = false

    async function doSearch() {
      setLoading(true)
      setError(null)
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
        setHasSearched(true)
      } catch (err) {
        if (cancelled) return
        setError(err.message)
        setPosts([])
        setTotalCount(0)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    doSearch()
    return () => { cancelled = true }
  }, [currentPage, queryParam, parsedTags, settings.blacklist])

  const handlePageChange = useCallback((page) => {
    const params = query.include.map(t => t.name).concat(query.exclude.map(t => `-${t.name}`))
    navigate(`/search/${page}/${params.join(',')}`)
  }, [query, navigate])

  const blacklistedNames = (settings.blacklist || []).map(t => t.name)

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center text-muted" style={{ height: '200px' }}>
        <div className="spinner-border me-2" role="status" />
        Loading...
      </div>
    )
  }

  if (error) {
    return (
      <div className="d-flex align-items-center justify-content-center text-danger" style={{ height: '200px' }}>
        {error}
      </div>
    )
  }

  if (!loading && !hasSearched && !queryParam) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center text-center" style={{ height: '400px' }}>
        <h2 className="fw-bold" style={{ color: '#e94560' }}>subooru</h2>
        <p className="text-muted">Enter tags in the sidebar and click Search</p>
      </div>
    )
  }

  if (!loading && hasSearched && totalCount === 0) {
    return (
      <div className="d-flex align-items-center justify-content-center text-muted" style={{ height: '200px' }}>
        No results found
      </div>
    )
  }

  return (
    <div className="p-1">
      <Pagination
        page={currentPage}
        totalCount={totalCount}
        resultsPerPage={100}
        onPageChange={handlePageChange}
        loading={loading}
      />
      <PostGrid
        posts={posts}
        settings={settings}
        onToggleBlacklist={onToggleBlacklist}
        onToggleFavorite={onToggleFavorite}
        onOpenFullscreen={onOpenFullscreen}
        blacklistedTags={blacklistedNames}
      />
      <Pagination
        page={currentPage}
        totalCount={totalCount}
        resultsPerPage={100}
        onPageChange={handlePageChange}
        loading={loading}
      />
    </div>
  )
}
