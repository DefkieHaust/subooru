import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchPosts } from '../api.js'
import PostGrid from '../components/PostGrid.jsx'
import Pagination from '../components/Pagination.jsx'

export default function SearchPage({ query, onQueryChange, settings, onToggleBlacklist, onToggleFavorite, onOpenFullscreen }) {
  const { page: pageParam, query: queryParam } = useParams()
  const navigate = useNavigate()

  const [posts, setPosts] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [hasSearched, setHasSearched] = useState(false)

  const currentPage = parseInt(pageParam, 10) || 1

  useEffect(() => {
    if (queryParam) {
      const parts = queryParam.split(',')
      const include = []
      const exclude = []
      for (const p of parts) {
        if (p.startsWith('-')) exclude.push({ name: p.slice(1), type: 'general', count: 0 })
        else include.push({ name: p, type: 'general', count: 0 })
      }
      onQueryChange({ include, exclude })
    }
  }, [queryParam, onQueryChange])

  const doSearch = useCallback(async (page) => {
    setLoading(true)
    setError(null)
    try {
      const blacklistedNames = (settings.blacklist || []).map(t => t.name)
      const data = await fetchPosts({
        tags: {
          include: query.include.map(t => t.name),
          exclude: [...query.exclude.map(t => t.name), ...blacklistedNames]
        },
        page
      })
      setPosts(data.results || [])
      setTotalCount(data.total_count || 0)
      setHasSearched(true)
    } catch (err) {
      setError(err.message)
      setPosts([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }, [query, settings])

  useEffect(() => {
    if (hasSearched || queryParam) {
      doSearch(currentPage)
    }
  }, [currentPage, doSearch]) // eslint-disable-line react-hooks/exhaustive-deps

  const handlePageChange = useCallback((page) => {
    const params = query.include.map(t => t.name).concat(query.exclude.map(t => `-${t.name}`))
    navigate(`/search/${page}/${params.join(',')}`)
  }, [query, navigate])

  const blacklistedNames = (settings.blacklist || []).map(t => t.name)

  return (
    <div className="search-page">
      {loading && <div className="loading">Loading...</div>}
      {error && <div className="error">{error}</div>}
      {!loading && !hasSearched && !queryParam && (
        <div className="landing">
          <h2>subooru</h2>
          <p>Enter tags in the sidebar and click Search</p>
        </div>
      )}
      {!loading && hasSearched && totalCount === 0 && (
        <div className="no-results">No results found</div>
      )}
      {totalCount > 0 && (
        <>
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
        </>
      )}
    </div>
  )
}
