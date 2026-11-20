import { useState, useEffect, useCallback, useRef } from 'react'

export default function VehicleGallery({
  images = [],
  vehicleName = 'Armada JagaRoda',
  plate = 'L 1234 AB',
  category = 'Multi Purpose Vehicle (MPV)',
  statusBadge = null,
}) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [touchStartX, setTouchStartX] = useState(null)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const thumbnailContainerRef = useRef(null)

  const activeImage = images[currentIndex] || images[0] || {}

  const handlePrev = useCallback(() => {
    setImageLoaded(false)
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }, [images.length])

  const handleNext = useCallback(() => {
    setImageLoaded(false)
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }, [images.length])

  const goToIndex = (index) => {
    if (index === currentIndex) return
    setImageLoaded(false)
    setCurrentIndex(index)
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isLightboxOpen) {
        if (e.key === 'Escape') setIsLightboxOpen(false)
        if (e.key === 'ArrowLeft') handlePrev()
        if (e.key === 'ArrowRight') handleNext()
      } else {
        // When not in lightbox, only if active element is not an input
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return
        if (e.key === 'ArrowLeft') handlePrev()
        if (e.key === 'ArrowRight') handleNext()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handlePrev, handleNext, isLightboxOpen])

  // Touch swipe support
  const handleTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX)
  }

  const handleTouchEnd = (e) => {
    if (touchStartX === null) return
    const touchEndX = e.changedTouches[0].clientX
    const diffX = touchStartX - touchEndX
    if (Math.abs(diffX) > 45) {
      if (diffX > 0) handleNext()
      else handlePrev()
    }
    setTouchStartX(null)
  }

  // Scroll active thumbnail into view
  useEffect(() => {
    if (thumbnailContainerRef.current) {
      const activeThumb = thumbnailContainerRef.current.children[currentIndex]
      if (activeThumb) {
        activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
      }
    }
  }, [currentIndex])

  return (
    <div className="flex w-full flex-col gap-3.5">
      {/* Main Image Slider Viewport */}
      <div
        className="group relative flex aspect-16/10 w-full items-center justify-center overflow-hidden rounded-2xl border border-[#DDEAF2] bg-[#0F172A] shadow-md select-none"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Current Image with smooth transition */}
        <img
          key={activeImage.id || currentIndex}
          src={activeImage.url}
          alt={`${vehicleName} - ${activeImage.title || 'Foto Kendaraan'}`}
          onLoad={() => setImageLoaded(true)}
          className={`h-full w-full object-cover transition-all duration-500 ease-out ${
            imageLoaded ? 'scale-100 opacity-100' : 'scale-105 opacity-80 blur-xs'
          }`}
          onError={(e) => {
            // Elegant SVG fallback with car name & current view title
            e.currentTarget.src = `data:image/svg+xml,${encodeURIComponent(
              `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
                <rect width="800" height="500" fill="#E9F6FD"/>
                <path d="M0 380 L800 240" stroke="#FFFFFF" stroke-width="80"/>
                <path d="M0 380 L800 240" stroke="#AFC2D3" stroke-width="2" stroke-dasharray="14 16"/>
                <g transform="translate(250 160)">
                  <rect x="0" y="40" width="300" height="100" rx="20" fill="#0F766E" opacity="0.15"/>
                  <path d="M30 90 L80 30 L220 30 L270 90 Z" fill="#0F766E"/>
                  <rect x="15" y="85" width="270" height="50" rx="12" fill="#17324D"/>
                  <circle cx="70" cy="140" r="28" fill="#17324D" stroke="#FFFFFF" stroke-width="8"/>
                  <circle cx="230" cy="140" r="28" fill="#17324D" stroke="#FFFFFF" stroke-width="8"/>
                </g>
                <text x="400" y="360" text-anchor="middle" font-family="system-ui, sans-serif" font-size="22" font-weight="bold" fill="#17324D">${vehicleName}</text>
                <text x="400" y="390" text-anchor="middle" font-family="system-ui, sans-serif" font-size="16" fill="#0F766E">${activeImage.title || 'Foto Unit'}</text>
              </svg>`
            )}`
            setImageLoaded(true)
          }}
        />

        {/* Ambient Gradient Overlays */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/30" />

        {/* Top Floating Badges */}
        <div className="absolute left-3 right-3 top-3 flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {statusBadge}
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/55 px-3 py-1 font-plusJakartaSans text-[11px] font-semibold text-white backdrop-blur-md">
              <span className="font-liberationMono text-teal-300">{plate}</span>
              <span className="text-white/40">•</span>
              <span className="max-w-[140px] truncate sm:max-w-none">{category}</span>
            </span>
          </div>

          {/* Position Indicator Badge: e.g. 1/5 */}
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-black/60 px-3 py-1 font-plusJakartaSans text-xs font-bold tracking-wider text-white shadow-sm backdrop-blur-md">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-teal-400">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="m21 15-5-5L5 21" />
              </svg>
              <span>{currentIndex + 1} / {images.length}</span>
            </span>

            {/* Lightbox / Zoom Button */}
            <button
              type="button"
              onClick={() => setIsLightboxOpen(true)}
              aria-label="Perbesar foto"
              title="Perbesar foto"
              className="flex h-7 w-7 items-center justify-center rounded-full border border-white/25 bg-black/60 text-white backdrop-blur-md transition-colors hover:bg-black/90 hover:text-teal-300"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 3 21 3 21 9" />
                <polyline points="9 21 3 21 3 15" />
                <line x1="21" y1="3" x2="14" y2="10" />
                <line x1="3" y1="21" x2="10" y2="14" />
              </svg>
            </button>
          </div>
        </div>

        {/* Previous Arrow Button */}
        <button
          type="button"
          onClick={handlePrev}
          aria-label="Foto sebelumnya"
          className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/50 text-white shadow-lg backdrop-blur-md transition-all hover:scale-105 hover:bg-[#0F766E] hover:text-white focus:outline-none focus:ring-2 focus:ring-teal-400"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        {/* Next Arrow Button */}
        <button
          type="button"
          onClick={handleNext}
          aria-label="Foto berikutnya"
          className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/50 text-white shadow-lg backdrop-blur-md transition-all hover:scale-105 hover:bg-[#0F766E] hover:text-white focus:outline-none focus:ring-2 focus:ring-teal-400"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

        {/* Bottom Active Photo Information Banner */}
        <div className="absolute bottom-3 left-3 right-3 flex flex-col gap-1 rounded-xl border border-white/20 bg-black/60 p-2.5 backdrop-blur-md sm:p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center rounded-md px-2 py-0.5 font-plusJakartaSans text-[10px] font-bold uppercase tracking-wider ${
                activeImage.category === 'Interior'
                  ? 'bg-amber-400 text-amber-950'
                  : 'bg-teal-500 text-white'
              }`}>
                {activeImage.category || 'Eksterior'}
              </span>
              <h4 className="font-plusJakartaSans text-xs font-bold text-white sm:text-sm">
                {activeImage.title}
              </h4>
            </div>
            <span className="hidden font-plusJakartaSans text-[11px] text-teal-300 sm:inline">
              Gunakan &larr; &rarr; untuk navigasi galeri
            </span>
          </div>
          {activeImage.caption && (
            <p className="line-clamp-1 font-plusJakartaSans text-[11px] text-slate-200">
              {activeImage.caption}
            </p>
          )}
        </div>
      </div>

      {/* Thumbnail Strip */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-[11px] text-[#47607E]">
          <span className="font-plusJakartaSans font-medium">Pilih Tampilan ({images.length} Sudut Foto Tersedia)</span>
          <span className="font-plusJakartaSans font-semibold text-[#0F766E]">
            {activeImage.category === 'Interior' ? '★ Foto Interior Aktif' : 'Geser untuk melihat interior'}
          </span>
        </div>

        <div
          ref={thumbnailContainerRef}
          className="flex w-full items-center gap-2 overflow-x-auto pb-1.5 pt-0.5 scrollbar-thin"
        >
          {images.map((img, idx) => {
            const isSelected = idx === currentIndex
            const isInterior = img.category === 'Interior'
            return (
              <button
                key={img.id || idx}
                type="button"
                onClick={() => goToIndex(idx)}
                aria-label={`Pilih foto ${idx + 1}: ${img.title}`}
                className={`group relative flex h-16 w-20 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg border transition-all sm:h-18 sm:w-24 ${
                  isSelected
                    ? 'border-[#0F766E] ring-2 ring-[#0F766E] ring-offset-1 shadow-sm'
                    : 'border-[#DDEAF2] opacity-70 hover:opacity-100 hover:border-[#0F766E]'
                }`}
              >
                <img
                  src={img.url}
                  alt={img.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    e.currentTarget.src = `data:image/svg+xml,${encodeURIComponent(
                      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 80"><rect width="100" height="80" fill="#E9F6FD"/><text x="50" y="45" font-family="sans-serif" font-size="10" text-anchor="middle" fill="#0F766E">${idx + 1}</text></svg>`
                    )}`
                  }}
                />
                {/* Mini category chip */}
                {isInterior && (
                  <span className="absolute bottom-1 right-1 rounded bg-amber-500 px-1 py-0.2 font-plusJakartaSans text-[8px] font-bold text-slate-900 shadow-2xs">
                    Kabin
                  </span>
                )}
                {/* Active check overlay */}
                {isSelected && (
                  <div className="absolute inset-0 bg-[#0F766E]/15 border-2 border-[#0F766E] rounded-lg pointer-events-none" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Lightbox Modal (Fullscreen Zoom View) */}
      {isLightboxOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setIsLightboxOpen(false)}
        >
          <div
            className="relative flex max-h-[90vh] max-w-5xl flex-col items-center justify-center overflow-hidden rounded-2xl border border-white/20 bg-slate-950 p-2 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Lightbox Close Button */}
            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              aria-label="Tutup pratinjau"
              className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/70 text-white transition-colors hover:bg-[#0F766E]"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {/* Lightbox Main Image */}
            <div className="relative flex max-h-[75vh] w-full items-center justify-center overflow-hidden rounded-xl">
              <img
                src={activeImage.url}
                alt={activeImage.title}
                className="max-h-[75vh] w-auto max-w-full rounded-xl object-contain"
              />

              {/* Prev & Next in Lightbox */}
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Foto sebelumnya"
                className="absolute left-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md transition-colors hover:bg-[#0F766E]"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <button
                type="button"
                onClick={handleNext}
                aria-label="Foto berikutnya"
                className="absolute right-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md transition-colors hover:bg-[#0F766E]"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>

            {/* Lightbox Footer Caption */}
            <div className="flex w-full items-center justify-between px-4 py-3 text-white">
              <div className="flex flex-col">
                <span className="font-plusJakartaSans text-sm font-bold text-teal-400">
                  {vehicleName} ({plate}) — {activeImage.title}
                </span>
                <span className="font-plusJakartaSans text-xs text-slate-300">
                  {activeImage.caption}
                </span>
              </div>
              <span className="font-plusJakartaSans text-xs font-semibold text-slate-400">
                {currentIndex + 1} / {images.length}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
