import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import FullscreenView from '../../views/FullscreenView.jsx'

afterEach(cleanup)

function renderView(props = {}) {
  const post = {
    id: 1,
    image_url: 'https://img.example.com/1.jpg',
    sample_url: 'https://img.example.com/1s.jpg',
    thumbnail_url: 'https://img.example.com/1t.jpg',
    tags: ['cat', 'hat'],
    score: 42,
    rating: 's',
    width: 800,
    height: 600,
    uploader: 'testuser',
  }

  return render(
    <MemoryRouter>
      <FullscreenView
        post={post}
        onClose={() => {}}
        settings={{
          favorites: [],
          autoplayVideo: true,
          muteVideo: true,
        }}
        onToggleFavorite={() => {}}
        {...props}
      />
    </MemoryRouter>
  )
}

describe('FullscreenView', () => {
  it('renders image with proxy URL', () => {
    renderView()
    const img = document.querySelector('img')
    expect(img).toBeTruthy()
    expect(img.getAttribute('src')).toContain('/api/media')
  })

  it('displays post metadata', () => {
    renderView()
    expect(screen.getByText('Score: 42')).toBeInTheDocument()
    expect(screen.getByText('800 x 600')).toBeInTheDocument()
    expect(screen.getByText('by testuser')).toBeInTheDocument()
  })

  it('displays tags', () => {
    renderView()
    expect(screen.getAllByText('cat').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('hat').length).toBeGreaterThanOrEqual(1)
  })

  it('shows Favorite button', () => {
    renderView()
    const buttons = screen.getAllByText(/Favorite/)
    expect(buttons.length).toBeGreaterThanOrEqual(1)
  })

  it('shows Favorited state when post is favorited', () => {
    renderView({
      settings: {
        favorites: [{ id: 1, image_url: '' }],
        autoplayVideo: true,
        muteVideo: true,
      },
    })
    const buttons = screen.getAllByText(/Favorited/)
    expect(buttons.length).toBeGreaterThanOrEqual(1)
  })

  it('shows rating badge', () => {
    renderView()
    const badge = document.querySelector('.badge')
    expect(badge).toBeTruthy()
    expect(badge.textContent).toBe('s')
  })

  it('shows Close button', () => {
    renderView()
    expect(screen.getByText('Close')).toBeInTheDocument()
  })
})
