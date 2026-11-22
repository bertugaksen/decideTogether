import rateLimit from 'express-rate-limit';

/**
 * General API Rate Limiter
 * Applied across all /api routes to prevent DoS and brute-force traffic.
 */
export const generalApiLimiter = rateLimit({
  windowMs: process.env.RATE_LIMIT_GENERAL_WINDOW_MS
    ? parseInt(process.env.RATE_LIMIT_GENERAL_WINDOW_MS, 10)
    : 60_000, // 1 minute
  max: process.env.RATE_LIMIT_GENERAL_MAX
    ? parseInt(process.env.RATE_LIMIT_GENERAL_MAX, 10)
    : 120, // 120 requests per minute
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    error: 'Çok fazla istek gönderildi, lütfen biraz bekleyin.',
  },
  skip: () => process.env.NODE_ENV === 'test',
});

/**
 * Location Resolve Rate Limiter
 * Protects /api/locations/resolve from exhausting Google Places / Geocoding quotas.
 */
export const locationResolveLimiter = rateLimit({
  windowMs: 60_000, // 1 minute
  max: process.env.RATE_LIMIT_LOCATIONS_MAX
    ? parseInt(process.env.RATE_LIMIT_LOCATIONS_MAX, 10)
    : 30, // 30 requests per minute
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    error: 'Konum çözümleme sınırı aşıldı, lütfen biraz bekleyin.',
  },
  skip: () => process.env.NODE_ENV === 'test',
});

/**
 * Photo Proxy Rate Limiter
 * Protects /api/venues/photo from excessive Google Places Photo API bandwidth and upstream costs.
 */
export const photoProxyLimiter = rateLimit({
  windowMs: 60_000, // 1 minute
  max: process.env.RATE_LIMIT_PHOTOS_MAX
    ? parseInt(process.env.RATE_LIMIT_PHOTOS_MAX, 10)
    : 120, // 120 requests per minute
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    error: 'Fotoğraf proxy istek sınırı aşıldı, lütfen biraz bekleyin.',
  },
  skip: () => process.env.NODE_ENV === 'test',
});
