/**
 * EventGrid.tsx
 * ───────────────────────────────────────────────────────────────────────────
 * Filterable, searchable, sortable event grid with list/grid view toggle.
 *
 * State:
 *  - searchQuery    — text filter on title/artist/city
 *  - selectedCategory — category pill filter
 *  - sortBy         — 'date' | 'price-asc' | 'price-desc'
 *  - viewMode       — 'grid' | 'list'
 *  - isLoading      — simulated 600ms skeleton
 *
 * Grid layout:
 *  - First card spans 2 columns (featured)
 *  - Rest are single-column
 *
 * List layout:
 *  - Horizontal cards stacked vertically
 *
 * Framer Motion: staggered children reveal
 * ───────────────────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, LayoutGrid, List, X, ChevronDown } from 'lucide-react';
import events, { type Event } from '../../data/events';
import EventCard from './EventCard';

/* ── Types ──────────────────────────────────────────────────────────────── */
type SortOption = 'date' | 'price-asc' | 'price-desc';
type ViewMode = 'grid' | 'list';

interface CategoryPill {
  label: string;
  value: Event['category'] | 'all';
}

/* ── Constants ───────────────────────────────────────────────────────────── */
const CATEGORIES: CategoryPill[] = [
  { label: 'All', value: 'all' },
  { label: 'Concert', value: 'concert' },
  { label: 'Stand-up', value: 'standup' },
  { label: 'Theatre', value: 'theatre' },
  { label: 'Tech', value: 'tech' },
  { label: 'Sports', value: 'sports' },
];

const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: 'Sort: Date', value: 'date' },
  { label: 'Price: Low → High', value: 'price-asc' },
  { label: 'Price: High → Low', value: 'price-desc' },
];

/* ── SkeletonCard ────────────────────────────────────────────────────────── */
function SkeletonCard({ featured = false }: { featured?: boolean }) {
  return (
    <div
      aria-hidden="true"
      style={{
        gridColumn: featured ? 'span 2' : 'span 1',
        background: 'var(--color-surface)',
      }}
    >
      {/* Image placeholder */}
      <div
        className="shimmer"
        style={{
          aspectRatio: '16/9',
          width: '100%',
          background: 'var(--color-surface-2)',
        }}
      />
      {/* Content placeholder */}
      <div
        style={{
          borderLeft: '2px solid var(--color-border)',
          padding: '18px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        <div
          className="shimmer"
          style={{
            height: '10px',
            width: '40%',
            background: 'var(--color-surface-3)',
          }}
        />
        <div
          className="shimmer"
          style={{
            height: '22px',
            width: '75%',
            background: 'var(--color-surface-3)',
          }}
        />
        <div
          className="shimmer"
          style={{
            height: '10px',
            width: '55%',
            background: 'var(--color-surface-3)',
          }}
        />
      </div>
    </div>
  );
}

/* ── EmptyState ──────────────────────────────────────────────────────────── */
function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        gridColumn: '1 / -1',
        padding: '64px 24px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
      }}
      role="status"
      aria-live="polite"
    >
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '48px',
          opacity: 0.25,
          color: 'var(--color-gold)',
          userSelect: 'none',
        }}
        aria-hidden="true"
      >
        ◇
      </span>
      <p
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '24px',
          color: 'var(--color-ivory)',
          fontStyle: 'italic',
        }}
      >
        No events found
      </p>
      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: '13px',
          color: 'var(--color-ivory-dim)',
        }}
      >
        Try adjusting your search or filters.
      </p>
      <button
        onClick={onReset}
        style={{
          marginTop: '4px',
          padding: '10px 24px',
          border: '1px solid var(--color-gold)',
          background: 'transparent',
          color: 'var(--color-gold)',
          fontFamily: 'var(--font-body)',
          fontSize: '12px',
          fontWeight: 600,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          cursor: 'pointer',
          transition: 'background 0.2s',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background =
            'var(--color-gold)';
          (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-on-accent)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
          (e.currentTarget as HTMLButtonElement).style.color =
            'var(--color-gold)';
        }}
        aria-label="Clear all filters"
      >
        Clear Filters
      </button>
    </motion.div>
  );
}

/* ── EventGrid ───────────────────────────────────────────────────────────── */
export default function EventGrid() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<
    Event['category'] | 'all'
  >('all');
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [isLoading, setIsLoading] = useState(true);

  /* Simulate 600ms loading */
  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  /* ── Filtered + sorted events ── */
  const filteredEvents = useMemo(() => {
    let result = [...events];

    /* Search filter */
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.artist.toLowerCase().includes(q) ||
          e.city.toLowerCase().includes(q) ||
          e.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    /* Category filter */
    if (selectedCategory !== 'all') {
      result = result.filter((e) => e.category === selectedCategory);
    }

    /* Sort */
    result.sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      const aMin = Math.min(...Object.values(a.prices));
      const bMin = Math.min(...Object.values(b.prices));
      return sortBy === 'price-asc' ? aMin - bMin : bMin - aMin;
    });

    return result;
  }, [searchQuery, selectedCategory, sortBy]);

  function handleReset() {
    setSearchQuery('');
    setSelectedCategory('all');
    setSortBy('date');
  }

  return (
    <section
      style={{
        padding: 'clamp(40px, 5vw, 80px) clamp(16px, 5vw, 64px)',
        background: 'var(--color-bg)',
      }}
      aria-label="Event listings"
    >
      {/* Section header */}
      <div style={{ marginBottom: '36px' }}>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            color: 'var(--color-gold)',
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <span
            style={{
              display: 'inline-block',
              width: '24px',
              height: '1px',
              background: 'var(--color-gold)',
            }}
          />
          Upcoming Events
        </p>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(28px, 4vw, 48px)',
            fontWeight: 600,
            color: 'var(--color-ivory)',
            lineHeight: 1.1,
          }}
        >
          Find Your Next Experience
        </h2>
      </div>

      {/* ── Toolbar ── */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px',
          alignItems: 'center',
          marginBottom: '24px',
        }}
        role="search"
        aria-label="Filter and search events"
      >
        {/* Search input */}
        <div
          style={{
            position: 'relative',
            flexGrow: 1,
            minWidth: '200px',
            maxWidth: '360px',
          }}
        >
          <Search
            size={15}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--color-ivory-dim)',
              pointerEvents: 'none',
            }}
            aria-hidden="true"
          />
          <input
            type="search"
            placeholder="Search events, artists, cities…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search events"
            style={{
              width: '100%',
              padding: '10px 36px 10px 36px',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-ivory)',
              fontFamily: 'var(--font-body)',
              fontSize: '13px',
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => {
              (e.target as HTMLInputElement).style.borderColor =
                'var(--color-gold)';
            }}
            onBlur={(e) => {
              (e.target as HTMLInputElement).style.borderColor =
                'var(--color-border)';
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--color-ivory-dim)',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
              }}
            >
              <X size={13} aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Sort dropdown */}
        <div style={{ position: 'relative' }}>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            aria-label="Sort events"
            style={{
              appearance: 'none',
              padding: '10px 36px 10px 14px',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-ivory)',
              fontFamily: 'var(--font-body)',
              fontSize: '12px',
              fontWeight: 600,
              letterSpacing: '0.04em',
              cursor: 'pointer',
              outline: 'none',
              minWidth: '180px',
            }}
          >
            {SORT_OPTIONS.map((opt) => (
              <option
                key={opt.value}
                value={opt.value}
                style={{ background: 'var(--color-surface)' }}
              >
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={13}
            aria-hidden="true"
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--color-gold)',
              pointerEvents: 'none',
            }}
          />
        </div>

        {/* View mode toggle */}
        <div
          role="group"
          aria-label="View mode"
          style={{
            display: 'flex',
            border: '1px solid var(--color-border)',
            overflow: 'hidden',
          }}
        >
          {(
            [
              { mode: 'grid' as ViewMode, Icon: LayoutGrid, label: 'Grid view' },
              { mode: 'list' as ViewMode, Icon: List, label: 'List view' },
            ] as const
          ).map(({ mode, Icon, label }) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              aria-label={label}
              aria-pressed={viewMode === mode}
              style={{
                padding: '10px 14px',
                background:
                  viewMode === mode
                    ? 'var(--color-gold)'
                    : 'var(--color-surface)',
                color: viewMode === mode ? 'var(--color-on-accent)' : 'var(--color-ivory-dim)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              <Icon size={15} aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>

      {/* ── Category pills ── */}
      <div
        role="group"
        aria-label="Filter by category"
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '32px',
          overflowX: 'auto',
          paddingBottom: '4px',
          /* hide scrollbar but allow scroll */
          scrollbarWidth: 'none',
        }}
      >
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.value;
          return (
            <button
              key={cat.value}
              onClick={() =>
                setSelectedCategory(cat.value as Event['category'] | 'all')
              }
              aria-pressed={isActive}
              style={{
                padding: '7px 18px',
                background: isActive ? 'var(--color-gold)' : 'transparent',
                border: `1px solid ${isActive ? 'var(--color-gold)' : 'var(--color-border)'}`,
                color: isActive ? 'var(--color-on-accent)' : 'var(--color-ivory-dim)',
                fontFamily: 'var(--font-body)',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                transition: 'all 0.15s ease',
              }}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* ── Event count ── */}
      {!isLoading && (
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '12px',
            color: 'var(--color-ivory-faint)',
            marginBottom: '24px',
            letterSpacing: '0.04em',
          }}
          aria-live="polite"
          aria-atomic="true"
        >
          {filteredEvents.length === 0
            ? 'No events'
            : `${filteredEvents.length} event${filteredEvents.length !== 1 ? 's' : ''}`}
        </p>
      )}

      {/* ── Skeleton / Grid / List ── */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          /* Skeleton */
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '2px',
            }}
            aria-label="Loading events"
            aria-busy="true"
          >
            <SkeletonCard featured />
            {[...Array(3)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </motion.div>
        ) : viewMode === 'grid' ? (
          /* Grid view */
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '2px',
            }}
            role="list"
            aria-label="Events grid"
          >
            {filteredEvents.length === 0 ? (
              <EmptyState onReset={handleReset} />
            ) : (
              filteredEvents.map((event, index) => (
                <div
                  key={event.id}
                  style={{
                    gridColumn: index === 0 ? 'span 2' : 'span 1',
                  }}
                  role="listitem"
                >
                  <EventCard
                    event={event}
                    featured={index === 0}
                    delay={Math.min(index * 0.07, 0.35)}
                  />
                </div>
              ))
            )}
          </motion.div>
        ) : (
          /* List view */
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}
            role="list"
            aria-label="Events list"
          >
            {filteredEvents.length === 0 ? (
              <EmptyState onReset={handleReset} />
            ) : (
              filteredEvents.map((event, index) => (
                <div key={event.id} role="listitem">
                  <EventCard
                    event={event}
                    listMode
                    delay={Math.min(index * 0.06, 0.3)}
                  />
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile: single-column override */}
      <style>{`
        @media (max-width: 640px) {
          [aria-label="Events grid"] {
            grid-template-columns: 1fr !important;
          }
          [aria-label="Events grid"] > div {
            grid-column: span 1 !important;
          }
        }
      `}</style>
    </section>
  );
}
