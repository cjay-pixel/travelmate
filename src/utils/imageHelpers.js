// Utility helpers to extract primary image(s) from destination/place objects
export function getImageList(obj) {
  if (!obj) return [];

  // Prefer explicit images array
  if (Array.isArray(obj.images) && obj.images.length) return obj.images.filter(Boolean);

  // Common single-image fields
  const candidates = [];
  const knownFields = ['image', 'imageUrl', 'photo', 'photoUrl', 'mainImage', 'coverImage'];
  for (const f of knownFields) {
    if (obj[f]) candidates.push(obj[f]);
  }

  // If there are nested media fields, try to collect urls
  if (Array.isArray(obj.photos) && obj.photos.length) candidates.push(...obj.photos);
  if (obj.media && Array.isArray(obj.media)) {
    for (const m of obj.media) {
      if (!m) continue;
      if (typeof m === 'string') candidates.push(m);
      else if (m.url) candidates.push(m.url);
      else if (m.path) candidates.push(m.path);
    }
  }

  // Look through object for any URL-like strings (shallow)
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    if (typeof v === 'string' && /(https?:)?\/\/.+\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(v)) candidates.push(v);
  }

  // Normalize and return unique list
  const list = candidates.filter(Boolean).map(s => String(s).trim());
  return Array.from(new Set(list));
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
