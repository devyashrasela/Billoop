export const notFound = (req, res) =>
  res.status(404).json({ status: 404, message: `Route not found: ${req.method} ${req.originalUrl}` });

export const errorHandler = (err, req, res, _next) => {
  const status = err.status || 500;

  if (status >= 500 && process.env.NODE_ENV !== 'test') {
    const timestamp = new Date().toISOString();
    console.error(
      `💥 [Server Error ${timestamp}] ${req.method} ${req.originalUrl} (User: ${req.user?.id || 'anonymous'})`
    );
    console.error(err.stack || err);
  }

  res.status(status).json({
    status,
    message: status >= 500 ? 'Internal server error' : err.message,
    fieldErrors: err.fieldErrors,
  });
};
