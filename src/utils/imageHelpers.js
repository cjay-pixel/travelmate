// Utility helpers to extract primary image(s) from destination/place objects
export function getImageList(obj) {
  if (!obj) return [];
  // Build a prioritized list of candidate images while avoiding duplicates.
  const seen = new Set();
  const out = [];

  const push = (url) => {
    if (!url) return;
    const s = String(url).trim();
    if (!s) return;
    if (seen.has(s)) return;
    seen.add(s);
    out.push(s);
  };

  // If object wraps the real place under common keys, prefer scanning those too
  const nestedSources = [];
  if (obj.raw && typeof obj.raw === 'object') nestedSources.push(obj.raw);
  if (obj.placeData && typeof obj.placeData === 'object') nestedSources.push(obj.placeData);

  // helper to gather images from an object (non-recursive except for known wrappers)
  const gather = (o) => {
    if (!o) return;
    if (Array.isArray(o.images) && o.images.length) {
      for (const it of o.images) push(it);
    }

    // Common single-image fields and numbered imageUrl fields (fallback)
    const knownFields = ['image', 'imageUrl', 'photo', 'photoUrl', 'mainImage', 'coverImage'];
    for (const f of knownFields) {
      if (o[f]) push(o[f]);
    }

    for (const k of Object.keys(o)) {
      if (/^image(url)?\d+$/i.test(k) || /^photo\d+$/i.test(k)) {
        push(o[k]);
      }
    }

    if (Array.isArray(o.photos) && o.photos.length) {
      for (const p of o.photos) push(p);
    }
    if (o.media && Array.isArray(o.media)) {
      for (const m of o.media) {
        if (!m) continue;
        if (typeof m === 'string') push(m);
        else if (m.url) push(m.url);
        else if (m.path) push(m.path);
      }
    }

    // Shallow scan for URL-like strings
    for (const k of Object.keys(o)) {
      const v = o[k];
      if (typeof v === 'string' && /(https?:)?\/\/[^\s]+\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(v)) push(v);
    }
  };

  // First gather from the main object
  gather(obj);
  // Then gather from common nested wrappers (preserve priority order)
  for (const src of nestedSources) gather(src);

  // Return up to 3 images (admin requirement: show only up to three)
  return out.slice(0, 3);
}

export function getPrimaryImage(obj, fallback = 'https://via.placeholder.com/600x400?text=No+Image') {
  const list = getImageList(obj);
  if (list.length) return list[0];

  // Also check nested placeData (common for wishlist/trip items)
  if (obj && obj.placeData) {
    const nested = getImageList(obj.placeData);
    if (nested.length) return nested[0];
  }

  return fallback;
}
