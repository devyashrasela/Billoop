export const notFound = (req, res) =>
  res.status(404).json({ status: 404, message: 'Route not found' });

export const errorHandler = (err, req, res, _next) => {
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({
    status,
    message: status >= 500 ? 'Internal server error' : err.message,
    fieldErrors: err.fieldErrors,
  });
};

