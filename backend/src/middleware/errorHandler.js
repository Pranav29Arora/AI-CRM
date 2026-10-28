export const errorHandler = (err, req, res, next) => {
  console.error('[API Error]:', err.message);

  const status = err.status || 500;
  res.status(status).json({
    success: false,
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};
