import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Sidebar from '../../components/Sidebar.jsx'

function renderSidebar(props = {}) {
  return render(
    <MemoryRouter>
      <Sidebar
        query={{ include: [], exclude: [] }}
        onQueryChange={() => {}}
        settings={{
          columnWidth: 300,
          maxPostHeight: 600,
          autoplayVideo: true,
          muteVideo: true,
          defaultTags: true,
          defaultBlacklist: true,
          blacklist: [],
          favorites: [],
        }}
        onSettingsChange={() => {}}
        onCloseMobile={() => {}}
        show={true}
        clientInclude={[]}
        {...props}
      />
    </MemoryRouter>
  )
}

afterEach(cleanup)

describe('Sidebar', () => {
  it('renders the search input', () => {
    renderSidebar()
    const input = screen.getByPlaceholderText('Search tags...')
    expect(input).toBeInTheDocument()
  })

  it('renders the Search button', () => {
    renderSidebar()
    expect(screen.getByRole('button', { name: /Search/i })).toBeInTheDocument()
  })

  it('shows tag chip when query.include is provided', () => {
    renderSidebar({ query: { include: [{ name: 'rating:general', type: 'metadata', count: 0 }], exclude: [] } })
    expect(screen.getByText('rating:general')).toBeInTheDocument()
  })

  it('shows Default tags checkbox', () => {
    renderSidebar()
    expect(screen.getByLabelText('Default tags')).toBeInTheDocument()
  })

  it('shows Default blacklist checkbox', () => {
    renderSidebar()
    expect(screen.getByLabelText('Default blacklist')).toBeInTheDocument()
  })

  it('adds a tag on Enter in the input', async () => {
    const onQueryChange = vi.fn()
    renderSidebar({ onQueryChange })

    const input = screen.getByPlaceholderText('Search tags...')
    await userEvent.type(input, 'cat{Enter}')

    expect(onQueryChange).toHaveBeenCalled()
    const cb = onQueryChange.mock.calls[0][0]
    const result = cb({ include: [], exclude: [] })
    expect(result.include).toContainEqual(expect.objectContaining({ name: 'cat' }))
  })

  it('calls onQueryChange when removing a tag', async () => {
    const onQueryChange = vi.fn()
    renderSidebar({
      onQueryChange,
      query: { include: [{ name: 'cat', type: 'general', count: 0 }], exclude: [] },
    })

    const badge = screen.getByText('cat').closest('.badge')
    const closeBtn = badge.querySelector('.btn-close')
    fireEvent.click(closeBtn)

    expect(onQueryChange).toHaveBeenCalled()
  })

  it('toggles settings', async () => {
    const onSettingsChange = vi.fn()
    renderSidebar({ onSettingsChange })

    const cb = screen.getByLabelText('Default tags')
    await userEvent.click(cb)

    expect(onSettingsChange).toHaveBeenCalled()
  })
})
