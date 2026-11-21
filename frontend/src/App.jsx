import { useState, useRef } from "react";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const QUICK_TAGS = ["Tops", "T-Shirts", "Dresses", "Jackets", "Sneakers", "Bags"];

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    background-color: #f8fafc;
    color: #0f172a;
    -webkit-font-smoothing: antialiased;
  }

  .app-shell {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  /* Sticky Storefront Header */
  .navbar {
    position: sticky;
    top: 0;
    z-index: 50;
    background: rgba(255, 255, 255, 0.92);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid #e2e8f0;
  }

  .navbar-inner {
    max-width: 1320px;
    margin: 0 auto;
    padding: 14px 24px;
    display: flex;
    align-items: center;
    gap: 20px;
    flex-wrap: wrap;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 10px;
    text-decoration: none;
    color: #0f172a;
    font-weight: 800;
    font-size: 20px;
    letter-spacing: -0.03em;
    flex-shrink: 0;
  }

  .brand-badge {
    width: 34px;
    height: 34px;
    border-radius: 10px;
    background: linear-gradient(135deg, #111827 0%, #3b82f6 100%);
    color: #fff;
    display: grid;
    place-items: center;
    font-size: 16px;
    font-weight: 800;
  }

  /* Unified Search Capsule */
  .search-form {
    flex: 1;
    min-width: 300px;
    display: flex;
    align-items: center;
    gap: 8px;
    background: #f1f5f9;
    border: 1.5px solid #e2e8f0;
    border-radius: 999px;
    padding: 5px 6px 5px 18px;
    transition: all 0.2s ease;
  }

  .search-form:focus-within {
    background: #ffffff;
    border-color: #2563eb;
    box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
  }

  .search-input {
    flex: 1;
    border: none;
    background: transparent;
    font-size: 14.5px;
    color: #0f172a;
    outline: none;
    min-width: 140px;
  }

  .search-input::placeholder {
    color: #64748b;
  }

  .clear-btn {
    border: none;
    background: #cbd5e1;
    color: #334155;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    font-size: 12px;
    cursor: pointer;
    display: grid;
    place-items: center;
    flex-shrink: 0;
  }

  .clear-btn:hover {
    background: #94a3b8;
    color: #fff;
  }

  .upload-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 12px;
    border-radius: 999px;
    background: #ffffff;
    border: 1px solid #cbd5e1;
    color: #334155;
    font-size: 12.5px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
    white-space: nowrap;
  }

  .upload-pill:hover {
    border-color: #2563eb;
    color: #2563eb;
  }

  .upload-pill.has-file {
    background: #eff6ff;
    border-color: #2563eb;
    color: #1d4ed8;
  }

  .btn-primary {
    border: none;
    background: #0f172a;
    color: #ffffff;
    font-weight: 600;
    font-size: 13.5px;
    padding: 9px 18px;
    border-radius: 999px;
    cursor: pointer;
    transition: all 0.15s ease;
    white-space: nowrap;
  }

  .btn-primary:hover:not(:disabled) {
    background: #1e293b;
    transform: translateY(-1px);
  }

  .btn-primary:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  .btn-matching {
    border: none;
    background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%);
    color: #ffffff;
    font-weight: 600;
    font-size: 13.5px;
    padding: 10px 18px;
    border-radius: 999px;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
    transition: all 0.15s ease;
    white-space: nowrap;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .btn-matching:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(37, 99, 235, 0.35);
  }

  .btn-matching:disabled {
    opacity: 0.45;
    box-shadow: none;
    cursor: not-allowed;
  }

  /* Quick Tag Bar */
  .sub-bar {
    max-width: 1320px;
    margin: 0 auto;
    padding: 12px 24px 0;
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .sub-label {
    font-size: 12px;
    font-weight: 600;
    color: #64748b;
    margin-right: 4px;
  }

  .chip {
    border: 1px solid #e2e8f0;
    background: #ffffff;
    color: #334155;
    padding: 5px 13px;
    border-radius: 999px;
    font-size: 12.5px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .chip:hover {
    border-color: #0f172a;
    color: #0f172a;
    background: #f1f5f9;
  }

  /* Main Container */
  .container {
    max-width: 1320px;
    width: 100%;
    margin: 0 auto;
    padding: 20px 24px 60px;
    flex: 1;
  }

  /* Hero Banner when empty */
  .hero-banner {
    background: linear-gradient(120deg, #0f172a 0%, #1e293b 55%, #1d4ed8 100%);
    color: #ffffff;
    border-radius: 20px;
    padding: 44px 40px;
    margin-bottom: 28px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    flex-wrap: wrap;
    box-shadow: 0 12px 30px rgba(15, 23, 42, 0.12);
  }

  .hero-title {
    font-size: 30px;
    font-weight: 800;
    letter-spacing: -0.03em;
    line-height: 1.2;
    margin-bottom: 10px;
  }

  .hero-sub {
    font-size: 15px;
    color: #cbd5e1;
    max-width: 560px;
    line-height: 1.55;
  }

  .hero-steps {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }

  .step-pill {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.16);
    padding: 10px 14px;
    border-radius: 12px;
    font-size: 12.5px;
    color: #f8fafc;
  }

  /* Selected Product Spotlight Banner */
  .spotlight-bar {
    background: #ffffff;
    border: 1.5px solid #bfdbfe;
    border-radius: 16px;
    padding: 14px 20px;
    margin-bottom: 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
    box-shadow: 0 4px 16px rgba(37, 99, 235, 0.08);
  }

  .spotlight-left {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .spotlight-thumb {
    width: 54px;
    height: 54px;
    border-radius: 10px;
    object-fit: cover;
    border: 1px solid #e2e8f0;
    background: #f1f5f9;
  }

  .spotlight-eyebrow {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #2563eb;
  }

  .spotlight-title {
    font-size: 15px;
    font-weight: 700;
    color: #0f172a;
    margin-top: 2px;
  }

  /* Status & Meta Bar */
  .meta-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 18px;
    flex-wrap: wrap;
    gap: 10px;
  }

  .section-heading {
    font-size: 20px;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: #0f172a;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .count-pill {
    font-size: 12px;
    font-weight: 600;
    background: #e2e8f0;
    color: #334155;
    padding: 3px 10px;
    border-radius: 999px;
  }

  .meta-tags {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .meta-chip {
    font-size: 12px;
    color: #475569;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    padding: 5px 11px;
    border-radius: 999px;
  }

  .meta-chip.exact {
    background: #ecfdf5;
    border-color: #a7f3d0;
    color: #065f46;
    font-weight: 600;
  }

  /* Product Grid & Cards */
  .product-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(235px, 1fr));
    gap: 20px;
  }

  .card {
    background: #ffffff;
    border: 1.5px solid #e2e8f0;
    border-radius: 16px;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
    display: flex;
    flex-direction: column;
    position: relative;
  }

  .card:hover {
    transform: translateY(-4px);
    box-shadow: 0 14px 28px rgba(15, 23, 42, 0.08);
    border-color: #cbd5e1;
  }

  .card.selected {
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.16), 0 12px 24px rgba(37, 99, 235, 0.12);
  }

  .card-img-wrap {
    position: relative;
    width: 100%;
    aspect-ratio: 4 / 4.5;
    background: #f1f5f9;
    overflow: hidden;
  }

  .card-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.35s ease;
  }

  .card:hover .card-img {
    transform: scale(1.05);
  }

  .card-placeholder {
    width: 100%;
    height: 100%;
    display: grid;
    place-items: center;
    color: #94a3b8;
    font-size: 13px;
    font-weight: 500;
  }

  .badge-top-left {
    position: absolute;
    top: 10px;
    left: 10px;
    padding: 4px 10px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.02em;
    backdrop-filter: blur(6px);
  }

  .badge-exact {
    background: rgba(16, 185, 129, 0.92);
    color: #ffffff;
  }

  .badge-selected {
    background: rgba(37, 99, 235, 0.95);
    color: #ffffff;
  }

  .badge-visual {
    background: rgba(124, 58, 237, 0.92);
    color: #ffffff;
  }

  .badge-score {
    position: absolute;
    bottom: 10px;
    right: 10px;
    background: rgba(15, 23, 42, 0.78);
    color: #f8fafc;
    font-size: 11px;
    font-weight: 600;
    padding: 3px 8px;
    border-radius: 6px;
  }

  .card-body {
    padding: 14px 16px 16px;
    display: flex;
    flex-direction: column;
    flex: 1;
    justify-content: space-between;
    gap: 10px;
  }

  .card-category {
    font-size: 11.5px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #64748b;
    margin-bottom: 4px;
  }

  .card-title {
    font-size: 14.5px;
    font-weight: 600;
    color: #0f172a;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 8px;
    border-top: 1px solid #f1f5f9;
  }

  .card-price {
    font-size: 15px;
    font-weight: 700;
    color: #0f172a;
  }

  .card-action-hint {
    font-size: 12px;
    font-weight: 600;
    color: #2563eb;
  }

  /* Recommendation Section Divider */
  .rec-wrapper {
    margin-top: 42px;
    padding-top: 32px;
    border-top: 2px dashed #cbd5e1;
  }

  .rec-block {
    margin-bottom: 36px;
  }

  /* Skeleton Loading */
  .skeleton-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    overflow: hidden;
  }

  .skeleton-box {
    background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
    background-size: 200% 100%;
    animation: shimmer 1.4s infinite;
  }

  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  .error-banner {
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: #b91c1c;
    padding: 12px 16px;
    border-radius: 12px;
    font-size: 13.5px;
    font-weight: 500;
    margin-bottom: 20px;
  }
`;

function ProductCard({ item, isSelected, badgeText, badgeClass, onClick }) {
  return (
    <div
      className={`card ${isSelected ? "selected" : ""}`}
      onClick={() => onClick(item)}
      title="Click to select this product"
    >
      <div className="card-img-wrap">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.title}
            className="card-img"
            loading="lazy"
          />
        ) : (
          <div className="card-placeholder">No Image Available</div>
        )}

        {isSelected ? (
          <span className="badge-top-left badge-selected">Selected</span>
        ) : badgeText ? (
          <span className={`badge-top-left ${badgeClass || "badge-exact"}`}>
            {badgeText}
          </span>
        ) : null}

        {typeof item.score === "number" && item.score > 0 && (
          <span className="badge-score">{Math.round(item.score * 100)}% match</span>
        )}
      </div>

      <div className="card-body">
        <div>
          {item.category && <div className="card-category">{item.category}</div>}
          <div className="card-title">{item.title}</div>
        </div>

        <div className="card-footer">
          <span className="card-price">
            {item.price !== undefined && item.price !== null
              ? `$${Number(item.price).toFixed(2)}`
              : "In Stock"}
          </span>
          <span className="card-action-hint">
            {isSelected ? "Ready to match →" : "Select item"}
          </span>
        </div>
      </div>
    </div>
  );
}

function SkeletonGrid({ count = 8 }) {
  return (
    <div className="product-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-card">
          <div className="skeleton-box" style={{ width: "100%", aspectRatio: "4 / 4.5" }} />
          <div style={{ padding: 16 }}>
            <div className="skeleton-box" style={{ height: 12, width: "45%", borderRadius: 6, marginBottom: 10 }} />
            <div className="skeleton-box" style={{ height: 16, width: "90%", borderRadius: 6, marginBottom: 6 }} />
            <div className="skeleton-box" style={{ height: 16, width: "65%", borderRadius: 6 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const [query, setQuery] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [results, setResults] = useState([]);
  const [normalizedQuery, setNormalizedQuery] = useState("");
  const [hasExactMatch, setHasExactMatch] = useState(false);

  const [productRecs, setProductRecs] = useState([]);
  const [visualRecs, setVisualRecs] = useState([]);
  const [recAnchorTitle, setRecAnchorTitle] = useState("");

  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingMatching, setLoadingMatching] = useState(false);
  const [error, setError] = useState("");

  const fileInputRef = useRef(null);
  const recSectionRef = useRef(null);

  async function executeSearch(overrideQuery) {
    const activeQuery = (overrideQuery !== undefined ? overrideQuery : query).trim();
    setError("");
    setProductRecs([]);
    setVisualRecs([]);

    if (!activeQuery && !imageFile) {
      setError("Enter a product name, category (e.g., 'tops'), or upload an image to search.");
      return;
    }

    setLoadingSearch(true);
    try {
      const formData = new FormData();
      if (activeQuery) formData.append("query", activeQuery);
      if (imageFile) formData.append("image", imageFile);

      const res = await fetch(`${API_BASE}/search`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Search failed");
      }

      setResults(data.results || []);
      setNormalizedQuery(data.normalized_query || "");
      setHasExactMatch(Boolean(data.has_exact_match));
    } catch (err) {
      setError(err.message || "Something went wrong during search.");
    } finally {
      setLoadingSearch(false);
    }
  }

  function handleFormSubmit(e) {
    e.preventDefault();
    executeSearch();
  }

  function handleQuickTag(tag) {
    setQuery(tag);
    setSelectedProduct(null);
    executeSearch(tag);
  }

  function handleCardClick(product) {
    // Automatically writes clicked product name into the search bar
    setQuery(product.title || "");
    setSelectedProduct(product);
    setProductRecs([]);
    setVisualRecs([]);
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSearchMatching() {
    setError("");
    const targetTitle = (selectedProduct?.title || query || "").trim();

    if (!targetTitle) {
      setError("Click a product card or enter a product name before clicking Search Matching.");
      return;
    }

    setLoadingMatching(true);
    try {
      const res = await fetch(`${API_BASE}/recommend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: query.trim(),
          product_id: selectedProduct?.id ?? null,
          title: targetTitle,
          category: selectedProduct?.category ?? "",
          image_url: selectedProduct?.image_url ?? "",
          limit: 8,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Failed to fetch matching recommendations");
      }

      setRecAnchorTitle(data.anchor_title || targetTitle);
      setProductRecs(data.product_recommendations || []);
      setVisualRecs(data.visual_recommendations || []);

      setTimeout(() => {
        recSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (err) {
      setError(err.message || "Something went wrong while fetching recommendations.");
    } finally {
      setLoadingMatching(false);
    }
  }

  function handleResetAll() {
    setQuery("");
    setImageFile(null);
    setSelectedProduct(null);
    setResults([]);
    setNormalizedQuery("");
    setHasExactMatch(false);
    setProductRecs([]);
    setVisualRecs([]);
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="app-shell">
      <style>{styles}</style>

      {/* Sticky Top Storefront Navigation */}
      <header className="navbar">
        <div className="navbar-inner">
          <a
            href="#top"
            className="brand"
            onClick={(e) => {
              e.preventDefault();
              handleResetAll();
            }}
          >
            <span className="brand-badge">V</span>
            <span>PRODUCT VISUAL RECOMMENDATION ENGINE</span>
          </a>

          <form className="search-form" onSubmit={handleFormSubmit}>
            <input
              type="text"
              className="search-input"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (selectedProduct && e.target.value !== selectedProduct.title) {
                  setSelectedProduct(null);
                }
              }}
              placeholder="Search 'tops', styles, or exact product name..."
            />

            {query && (
              <button
                type="button"
                className="clear-btn"
                title="Clear search"
                onClick={() => {
                  setQuery("");
                  setSelectedProduct(null);
                }}
              >
                ✕
              </button>
            )}

            <label className={`upload-pill ${imageFile ? "has-file" : ""}`}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              />
              <span>📷</span>
              <span>{imageFile ? imageFile.name.slice(0, 14) : "Visual"}</span>
            </label>

            <button type="submit" className="btn-primary" disabled={loadingSearch}>
              {loadingSearch ? "Searching..." : "Search"}
            </button>
          </form>

          <button
            type="button"
            className="btn-matching"
            onClick={handleSearchMatching}
            disabled={loadingMatching || (!query.trim() && !selectedProduct)}
          >
            <span>✨</span>
            <span>{loadingMatching ? "Matching..." : "Search Matching"}</span>
          </button>
        </div>
      </header>

      {/* Quick Discovery Chips */}
      <div className="sub-bar">
        <span className="sub-label">Trending:</span>
        {QUICK_TAGS.map((tag) => (
          <button
            key={tag}
            type="button"
            className="chip"
            onClick={() => handleQuickTag(tag)}
          >
            {tag}
          </button>
        ))}
      </div>

      <main className="container">
        {error && <div className="error-banner">{error}</div>}

        {/* Selected Product Spotlight Bar */}
        {selectedProduct && (
          <div className="spotlight-bar">
            <div className="spotlight-left">
              {selectedProduct.image_url && (
                <img
                  src={selectedProduct.image_url}
                  alt={selectedProduct.title}
                  className="spotlight-thumb"
                />
              )}
              <div>
                <div className="spotlight-eyebrow">Selected Item Ready</div>
                <div className="spotlight-title">{selectedProduct.title}</div>
              </div>
            </div>

            <button
              type="button"
              className="btn-matching"
              onClick={handleSearchMatching}
              disabled={loadingMatching}
            >
              <span>✨</span>
              <span>
                {loadingMatching
                  ? "Finding Product & Visual Matches..."
                  : "Search Matching Products & Visuals"}
              </span>
            </button>
          </div>
        )}

        {/* Initial Storefront Hero (Shown before first search) */}
        {!loadingSearch && results.length === 0 && (
          <section className="hero-banner">
            <div>
              <h1 className="hero-title">Discover & Match Your Next Look</h1>
              <p className="hero-sub">
                Search broadly by category like <strong>“tops”</strong> or look up an exact product name.
                Click any item to lock it into the search bar, then hit <strong>Search Matching</strong> for
                catalog and visual similarity recommendations.
              </p>
            </div>
            <div className="hero-steps">
              <div className="step-pill">1. Search “tops” or exact item</div>
              <div className="step-pill">2. Click a product card</div>
              <div className="step-pill">3. Click Search Matching</div>
            </div>
          </section>
        )}

        {/* Step 1 & 2: Search Results */}
        {loadingSearch ? (
          <section>
            <div className="meta-bar">
              <h2 className="section-heading">Searching Catalog...</h2>
            </div>
            <SkeletonGrid count={8} />
          </section>
        ) : (
          results.length > 0 && (
            <section>
              <div className="meta-bar">
                <h2 className="section-heading">
                  <span>Catalog Results</span>
                  <span className="count-pill">{results.length}</span>
                </h2>

                <div className="meta-tags">
                  {hasExactMatch && (
                    <span className="meta-chip exact">✓ Exact Product Match</span>
                  )}
                  {normalizedQuery && (
                    <span className="meta-chip">
                      Keywords: <strong>{normalizedQuery}</strong>
                    </span>
                  )}
                </div>
              </div>

              <div className="product-grid">
                {results.map((item, idx) => {
                  const isSelected =
                    selectedProduct &&
                    ((selectedProduct.id && selectedProduct.id === item.id) ||
                      selectedProduct.title === item.title);

                  return (
                    <ProductCard
                      key={item.id ?? `${item.title}-${idx}`}
                      item={item}
                      isSelected={isSelected}
                      badgeText={item.match_type === "exact" ? "Exact Match" : null}
                      badgeClass="badge-exact"
                      onClick={handleCardClick}
                    />
                  );
                })}
              </div>
            </section>
          )
        )}

        {/* Step 4: Dual Recommendations Section */}
        <div ref={recSectionRef}>
          {loadingMatching && (
            <div className="rec-wrapper">
              <div className="meta-bar">
                <h2 className="section-heading">Finding Product & Visual Matches...</h2>
              </div>
              <SkeletonGrid count={4} />
            </div>
          )}

          {!loadingMatching && (productRecs.length > 0 || visualRecs.length > 0) && (
            <div className="rec-wrapper">
              {/* Product Recommendations */}
              <section className="rec-block">
                <div className="meta-bar">
                  <h2 className="section-heading">
                    <span>Similar Product Recommendations</span>
                    <span className="count-pill">{productRecs.length}</span>
                  </h2>
                  {recAnchorTitle && (
                    <span className="meta-chip">
                      Based on <strong>{recAnchorTitle}</strong>
                    </span>
                  )}
                </div>

                <div className="product-grid">
                  {productRecs.map((item, idx) => (
                    <ProductCard
                      key={`prod-${item.id ?? idx}`}
                      item={item}
                      isSelected={false}
                      badgeText="Product Match"
                      badgeClass="badge-exact"
                      onClick={handleCardClick}
                    />
                  ))}
                </div>
              </section>

              {/* Visual Recommendations */}
              <section className="rec-block">
                <div className="meta-bar">
                  <h2 className="section-heading">
                    <span>Visually Similar Styles</span>
                    <span className="count-pill">{visualRecs.length}</span>
                  </h2>
                  <span className="meta-chip">Matched via Visual Embeddings</span>
                </div>

                <div className="product-grid">
                  {visualRecs.map((item, idx) => (
                    <ProductCard
                      key={`vis-${item.id ?? idx}`}
                      item={item}
                      isSelected={false}
                      badgeText="Visual Match"
                      badgeClass="badge-visual"
                      onClick={handleCardClick}
                    />
                  ))}
                </div>
              </section>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}