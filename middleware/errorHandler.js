// Global error handler
export default function setupErrorHandler(app) {
  // 404 handler for API routes
  app.use('/api/*', (req, res) => {
    res.status(404).json({ 
      message: 'API endpoint not found',
      path: req.path 
    });
  });

  // Global error handler
  app.use((error, req, res, next) => {
    console.error('Global error handler:', error);
    
    // Handle specific error types
    if (error.type === 'entity.too.large') {
      return res.status(413).json({ 
        message: 'File too large',
        error: 'The uploaded file exceeds the maximum size limit' 
      });
    }
    
    if (error.code === 'ENOENT') {
      return res.status(404).json({ 
        message: 'File not found',
        error: 'The requested file could not be found' 
      });
    }
    
    // Default error response
    const statusCode = error.statusCode || error.status || 500;
    const message = process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error.message || 'An unexpected error occurred';
    
    res.status(statusCode).json({
      message,
      ...(process.env.NODE_ENV === 'development' && { 
        stack: error.stack,
        error: error.toString() 
      })
    });
  });
}