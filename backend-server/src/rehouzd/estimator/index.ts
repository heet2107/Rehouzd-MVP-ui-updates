import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import fs from 'fs';
import passport from 'passport';

// Import configuration
import config from './config';

// Import routes
import authRoutes from './routes/auth/auth';
import propertyRoutes from './routes/property/property';
import savedEstimatesRoutes from './routes/savedEstimates/savedEstimates';
import underwriteSlidersRoutes from './routes/property/underwriteSliders';
import specialistRoutes from './routes/specialistCallback/specialistCallback';
import buyerMatchingRoutes from './routes/buyerMatching/buyerMatchingController';

// Import service routers
import userRouter from './services/auth/userService';
import estimateRouter from './services/estimate/estimateService';

// Import services for initialization
import { configureGoogleStrategy } from './services/auth/authService';

// Import middlewares
import httpLogger from './middleware/httpLogger';
import { errorHandler, notFound } from './middleware/errorHandler';

// Import logger
import logger from './utils/logger';

// Import database initialization
import runSQLScript from './config/dbInit';

// Import Key Vault service for Azure integration
import keyVaultService from './utils/keyVault';

// Constants
const app = express();
const PORT = config.server.port;
const NODE_ENV = config.env;

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Initialize Passport and authentication strategies
configureGoogleStrategy();
app.use(passport.initialize());

// Middleware
// Configure CORS with explicit options to handle cross-origin requests
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
  // Allow all origins during development/debugging
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
}));
app.use(httpLogger);
app.use(express.json());
app.use(bodyParser.json());

// Also add a middleware to log all requests for debugging
app.use((req, res, next) => {
  console.log(`Request received: ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/property', propertyRoutes);
app.use('/api/saved-estimates', savedEstimatesRoutes);
app.use('/api/users', userRouter);
app.use('/api/specialist-callback', specialistRoutes);
app.use('/api/estimates', estimateRouter);
app.use('/api/underwrite-sliders', underwriteSlidersRoutes);
app.use('/api/buyer-matching', buyerMatchingRoutes);


app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is up and running',
    environment: NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Initialize database and start server
const startServer = async () => {
  try {
    // Initialize Key Vault if running in production with Azure
    if (config.keyVault.enabled) {
      logger.info('Initializing Azure Key Vault integration...');
      await keyVaultService.initialize();
    }
    
    // Initialize database if needed
    // if (process.env.INITIALIZE_DB === 'true') {
    if (false) {
      await runSQLScript();
    }
    
    // Start the server
    const server = app.listen(PORT, () => {
      logger.info(`Server started in ${NODE_ENV} mode on port ${PORT}`);
    });
    
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err: Error) => {
      logger.error('UNHANDLED REJECTION! Shutting down...', { error: err });
      console.error(err);
      
      // Close server & exit process
      server.close(() => {
        process.exit(1);
      });
    });
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (err: Error) => {
      logger.error('UNCAUGHT EXCEPTION! Shutting down...', { error: err });
      console.error(err);
      
      // Exit process
      process.exit(1);
    });
    
    // Handle graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received. Shutting down gracefully');
      server.close(() => {
        logger.info('Process terminated');
      });
    });
    
    return server;
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
};

// Start the server
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;