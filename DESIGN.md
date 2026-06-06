# Design System

This document defines the visual design system for subooru. All new components and pages **must** follow these tokens, patterns, and conventions.

---

## Stack

- **Framework:** React (Vite) + JavaScript (JSX)
- **Styling:** Bootstrap 5 + Tailwind CSS v4 (utility classes only, no component lib)
- **Icons:** Bootstrap Icons (`bi-*`), inline SVG, Unicode characters
- **Fonts:** System font stack (no custom fonts)
- **Routing:** react-router-dom v6
- **Dark mode:** Always-on — no light mode, no toggle, no system preference

---

## Colors

### CSS Variables (defined in `App.css`)

| Variable | Value | Usage |
|---|---|---|
| `--bg` | `#1a1a2e` | Page background |
| `--bg-secondary` | `#16213e` | Card/surface backgrounds |
| `--bg-tertiary` | `#0f3460` | Highlight/placeholder, scrollbar hover |

### Semantic Colors

| Token | Value | Usage |
|---|---|---|
| Page background | `#1a1a2e` | Body, scrollbar track |
| Surface | `#16213e` | Sidebar, cards, dropdowns |
| Brand | `#e94560` | Navbar brand, danger buttons |
| Highlight | `#0f3460` | Placeholder skeleton, suggestion hover, scrollbar thumb hover |
| Border | `#495057` (Bootstrap `border-secondary`) | Dividers, card borders |
| Text primary | `#e0e0e0` (Bootstrap `text-light`) | Body text |
| Text muted | Bootstrap `text-muted` | Secondary info, placeholder text |
| Text dark | Bootstrap `text-light` / `text-white` | Always light (dark mode only) |

### Tag Type Colors

Tags are color-coded by their Gelbooru type in the Sidebar chips and suggestion dropdown:

| Type | Bootstrap class | Badge | Text |
|---|---|---|---|
| `general` | `bg-primary` | Blue | Default (none) |
| `artist` | `bg-info text-light` | Info blue | `text-info` |
| `character` | `bg-success` | Green | `text-success` |
| `copyright` | `bg-warning text-light` | Yellow | `text-warning` |
| `metadata` | `bg-secondary` | Gray | `text-secondary` |

Metadata tags (names containing `:`, e.g. `rating:general`) are auto-detected by `tagBadgeColor`/`tagTextColor` in `utils.js` regardless of stored type.

### Rating Badge Colors

| Rating | Bootstrap class |
|---|---|
| `e` (explicit) | `bg-danger` |
| `q` (questionable) | `bg-warning` |
| `s` (safe) | `bg-success` |
| (other) | `bg-secondary` |

### Button Variants

| Variant | Class | Usage |
|---|---|---|
| Primary | `btn-danger` | Search button |
| Outline | `btn-outline-light` | Secondary actions, nav buttons |
| Warning | `btn-warning` | Favorited state |
| Close | `btn-close btn-close-white` | Tag chips, modals |

---

## Typography

### Font Stack

```css
font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
```

Applied via Bootstrap's reboot. No custom fonts, no Geist, no Lucide.

### Type Scale

| Size | Class/Utility | Usage |
|---|---|---|
| 0.6rem | Inline `style` | Rating badges, favorite count badge |
| 0.7rem | Inline `style` | Hover overlay buttons |
| 0.75rem | Inline `style` | Tag chips, hover tags |
| 0.85rem | Inline `style` | Suggestion items |
| `small` | Bootstrap class | Labels, descriptions, metadata |
| `h1` / `navbar-brand` | Bootstrap | Brand/logo text |

### Font Weights

| Weight | Class | Usage |
|---|---|---|
| 400 (normal) | Default | Body text, tag chips |
| 600 (semibold) | `fw-bold` | Section headers, uppercase labels, brand |

---

## Spacing

Uses Bootstrap's spacing scale (`p-1 p-2 p-3 p-4`, `m-1 m-2`, `gap-1 gap-2`) and inline pixel values where Bootstrap's scale is too coarse.

### Common Units

| Value | Usage |
|---|---|
| `2px` | Gap between elements in flex rows |
| `5px` | Post grid gutter (`gap-1` maps to `0.25rem` ≈ 4px, but column gap is manually set to 5px via JS) |
| `0.25rem` (Bootstrap `1`) | Tag chip gaps, small padding |
| `0.5rem` (Bootstrap `2`) | Sidebar sections padding, navbar padding |
| `85px` | Settings slider labels (minimum width via inline style) |

### Max Widths

| Value | Usage |
|---|---|
| `280px` | Sidebar width |
| `250px` | Blacklist dropdown |
| `95vw` | FullscreenView container |
| `100px` | Hover tag text truncation |

---

## Layout

### Root Structure

```
<body class="overflow-hidden" style="background: #1a1a2e; color: #e0e0e0">
  <div id="root" class="d-flex flex-column vh-100">
    <nav class="navbar navbar-dark bg-dark ..." style="z-index: 1030">
      [Hamburger (mobile) + "subooru" brand]
      [Favorites button + Blacklist dropdown]
    </nav>
    <div class="d-md-flex flex-grow-1 min-h-0 position-relative">
      <Sidebar />
      <main class="app-main"><!-- scrollable content --></main>
    </div>
  </div>
</body>
```

### Sidebar

| State | Desktop (≥768px) | Mobile (<768px) |
|---|---|---|
| Position | `position: relative`, inline with content | Fixed overlay (`position-fixed`), z-index 1045 |
| Visibility | Always visible (`transform: translateX(0)`) | Toggled via `sidebar-open`/`sidebar-closed` classes |
| Width | `280px` | `280px` |
| Background overlay | None | Semi-transparent black, z-index 1040 |
| Collapse button | Hidden (`d-md-none`) | Shown at top of sidebar |

Transition: `transform 0.2s ease` (CSS in `App.css`).

### Post Grid

Dynamic masonry layout — no CSS grid, no library. Columns are calculated in `PostGrid.jsx`:

1. `ResizeObserver` measures container width
2. Columns are sized to fit based on `settings.columnWidth` (default 300px)
3. Posts are placed into the shortest column at time of insertion
4. Each column is a `d-flex flex-column` with `gap-1`
5. The row is `d-flex gap-1` (horizontal gutter ≈ 5px)

### FullscreenView

Fixed overlay covering the viewport:

```
position-fixed top-0 start-0 w-100 h-100
background: rgba(0,0,0,0.95)
z-index: 1060
```

Inner layout:
```
d-flex flex-column
  → row: uploader + Close button
  → flex-grow-1: image/video (centered, max 95vw, 99dvh)
  → row: rating badge + score + dimensions
  → row: Favorite + "Open on Gelbooru" buttons
  → scrollable tag row (max-height 100px)
```

Key behaviors:
- Escape key or clicking backdrop closes
- Image sources fallback through: `image_url` → `sample_url` → `thumbnail_url`
- Video detection: `/\.(mp4|webm|mov)$/i`
- Video poster uses thumbnail via proxy when `proxy_thumbnails` is on
- `document.body.style.overflow = 'hidden'` while open

### Bottom Pagination Bar

Fixed at bottom of viewport:

```
position-fixed bottom-0 left-0 right-0
height: 48px
background: var(--bg)
border-top: 1px solid #495057
z-index: 1020
```

Shows: post count | Prev button + "Page X / Y" + Next button
Disabled states: Prev disabled at page 1, Next disabled at page 200 (hard Gelbooru limit).

### Navbar

Fixed-height (`min-height: 48px`) Bootstrap navbar:
- Left: hamburger button (`d-md-none`) + "subooru" brand in `#e94560`
- Right: Favorites button (with badge count) + Blacklist dropdown

Z-index: `1030` (below sidebar overlay at 1045).

---

## Components

### PostCard

Structure:
```
.rounded.bg-dark (height = renderHeight from column calculation)
  → Click handler opens FullscreenView
  → Placeholder div (shimmer skeleton until loaded, then fades out)
  → <img loading="lazy"> (fades in on load, falls through sources on error)
  → Video play icon overlay (if video, shown after load)
  → Rating badge + score (top-left, pointer-events: none)
  → Favorite + Blacklist buttons (top-right, hover-reveal)
  → Tag overflow (bottom, hover-reveal, 8 tags max)
  → Cropped dimension indicator (if renderHeight capped at maxPostHeight)
```

Image source fallback chain: `thumbnail_url` → `sample_url` → `image_url`.
When `proxy_thumbnails` is on, each URL is flatMapped through `mediaProxyUrls()`.

### PostGrid

Pure layout component. No loading, empty, or error states — those are handled by SearchPage.

### Sidebar

Sections (top to bottom):

1. **Close button** (mobile only, `d-md-none`)
2. **Search input** (`input-group-sm` with text input + Search button)
   - Autocomplete dropdown appears below on input (200ms debounce)
   - Enter adds highlighted text as a tag (does not search)
3. **Tags section** — Shows `query.include` and `query.exclude` as removable chips
   - Excluded tags have `bg-danger` badge
   - Include tags colored by `tagBadgeColor(t.type, t.name)`
4. **Settings section**
   - Column width slider (200–500px)
   - Max height slider (200–2000px)
   - Autoplay video checkbox
   - Mute video checkbox
   - Default tags checkbox (prepends `client.include` from config on search)
   - Default blacklist checkbox (merges `client.blacklist` from config)
5. Blacklist is managed via a separate dropdown in the navbar, not the sidebar

### SearchPage

URL-driven: `/search/:page/:query?`

- `/` (landing) — Shows welcome message
- `/search/1/cat,hat` — Searches and displays results
- Empty `queryParam` → resets query state to empty

Key effects:
- Effect B (the search effect): Reads `parsedTags` + `currentPage` + blacklist, calls `fetchPosts`, debounced by dependency changes
- Effect C: Parses `queryParam` from URL into `query` state (with localStorage tag-type cache)
- Tag resolution effect: Asynchronously resolves uncached tag types via `fetchTags`

### FavoritesModal

Bootstrap modal. Shows saved posts in a grid (same PostCard component). Heart button toggles favorite state. Clicking a post opens FullscreenView.

### Tags in Blacklist Dropdown

Navbar dropdown (`dropdown-menu-dark`). Shows:
- Input with autocomplete for adding tags
- Current blacklisted tags as colored badges (click to remove)
- Tag types cached from autocomplete selections

---

## Animations & Transitions

| Element | Effect | Method |
|---|---|---|
| Sidebar open/close | Slide in/out (mobile) | `transition: transform 0.2s ease` via CSS class toggle |
| Image fade-in | Opacity 0 → 1 | `transition: opacity 0.3s` on `loaded` state change |
| Placeholder skeleton | Shimmer gradient slide | `@keyframes skeleton-shimmer` in `post-card.css`, 1.5s infinite |
| Hover overlays | Opacity 0 → 1 | Inline `transition: opacity 0.15s` via JS mouse events |
| Image placeholder | Opacity 1 → 0 (fade out) | `transition: opacity 0.3s` as image `loaded` fires |
| FullscreenView | Instant (no animation) | Render when `fullscreenPost` state is set |
| Dropdowns | Bootstrap built-in | Bootstrap JS handles fade/position |
| Modal | Bootstrap built-in | Bootstrap JS handles fade/scale |

---

## Breakpoints

Single breakpoint — Bootstrap `md` (768px):

| Range | Sidebar behavior | Main content |
|---|---|---|
| `< 768px` | Fixed overlay, toggled by hamburger | `position: absolute`, fills parent |
| `≥ 768px` | Static `position: relative` in flex row | `flex-grow: 1`, no absolute positioning |

No other responsive breakpoints are used. Layout is intentionally simple.

---

## Icons

| Element | Source |
|---|---|
| Hamburger menu | Inline SVG (Bootstrap menu icon) |
| Star (favorite) | Unicode `\u2605` / `\u2606` |
| Close (x) | Bootstrap `btn-close btn-close-white` |
| Video play | Inline SVG (triangle) |
| Remove (blacklist) | Unicode `\u2297` |
| Toggle dropdown | Bootstrap `dropdown-toggle` class |

No icon library dependency — Bootstrap Icons are not imported in the current codebase. All icons are inline SVGs, Unicode characters, or Bootstrap's built-in close button.

---

## Focus & Interaction States

| Element | Hover | Focus/Active | Disabled |
|---|---|---|---|
| Buttons (outline) | Bootstrap's `:hover` | Bootstrap's `:active` | `pointer-events: none, opacity: 0.5` |
| Tag chips | No change | Cursor pointer | — |
| Suggestions | Background `#0f3460` | — | — |
| Overlay buttons (PostCard) | Opacity 0 → 1 | — | — |
| Overlay tags (PostCard) | Opacity 0 → 1 | — | — |

Focus rings: Bootstrap defaults (blue outline on inputs). No custom focus ring tokens.

---

## Branding

- **Name:** subooru (lowercase)
- **Color:** `#e94560` (red/coral)
- **Font:** `h1` / `navbar-brand` at default weight
- **Logo:** Text only — no icon, no gradient
- **Tagline (landing page):** "Enter tags in the sidebar and click Search"
