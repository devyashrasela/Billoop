/**
 * Middleware to measure request duration and append Server-Timing headers.
 * Also logs response metrics for monitoring and performance auditing.
 */
export const serverTiming = (req, res, next) => {
  const start = process.hrtime.bigint();

  // Store metrics hook on response
  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1e6;

    // Append standard Server-Timing header if headers haven't been sent yet
    if (!res.headersSent) {
      res.setHeader('Server-Timing', `total;dur=${durationMs.toFixed(2)}`);
    }

    // Log warnings for slow requests (> 1500ms)
    if (durationMs > 1500) {
      console.warn(
        `⚠️ [Slow Request Warning] ${req.method} ${req.originalUrl} took ${durationMs.toFixed(2)}ms (Status: ${res.statusCode})`
      );
    }
  });

  next();
};
