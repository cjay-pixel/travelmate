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

  // 1) Prefer explicit images array (admin canonical source). Keep original order.
  if (Array.isArray(obj.images) && obj.images.length) {
    for (const it of obj.images) push(it);
  }

  // 2) Common single-image fields and numbered imageUrl fields (fallback)
  const knownFields = ['image', 'imageUrl', 'photo', 'photoUrl', 'mainImage', 'coverImage'];
  for (const f of knownFields) {
    if (obj[f]) push(obj[f]);
  }

  // numbered fields like imageUrl1, imageUrl2, image1, image2
  for (const k of Object.keys(obj)) {
    if (/^image(url)?\d+$/i.test(k) || /^photo\d+$/i.test(k)) {
      push(obj[k]);
    }
  }

  // 3) Nested media arrays/objects
  if (Array.isArray(obj.photos) && obj.photos.length) {
    for (const p of obj.photos) push(p);
  }
  if (obj.media && Array.isArray(obj.media)) {
    for (const m of obj.media) {
      if (!m) continue;
      if (typeof m === 'string') push(m);
      else if (m.url) push(m.url);
      else if (m.path) push(m.path);
    }
  }

  // 4) Shallow scan for URL-like strings (last resort)
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    if (typeof v === 'string' && /(https?:)?\/\/[^\s]+\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(v)) push(v);
  }

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
