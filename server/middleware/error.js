exports.notFound = (req, res) => res.status(404).json({ message: `Route not found: ${req.originalUrl}` });

exports.errorHandler = (err, req, res, next) => {
  let status = err.status || 500;
  let message = err.message || 'Server error';

  if (err.name === 'ValidationError') {
    status = 400;
    message = Object.values(err.errors).map((e) => e.message).join('. ');
  } else if (err.code === 11000) {
    status = 400;
    message = `That ${Object.keys(err.keyValue || {})[0] || 'value'} is already in use`;
  } else if (err.name === 'CastError') {
    status = 400;
    message = 'Invalid ID';
  }

  if (status === 500) console.error(err);
  res.status(status).json({ message });
};
