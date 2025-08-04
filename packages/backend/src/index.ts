import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import projectRoutes from './routes/project.routes';
import communityRoutes from './routes/community.routes';
import revenueRoutes from './routes/revenue.routes';
import codespacesRoutes from './routes/codespaces.routes';
import templateRoutes from './routes/template.routes';
import userRoutes from './routes/user.routes';
import deploymentRoutes from './routes/deployment.routes';
import aiModelRoutes from './routes/aiModel.routes';
import successStoryRoutes from './routes/successStory.routes';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Basic middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/revenue', revenueRoutes);
app.use('/api/codespaces', codespacesRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/users', userRoutes);
app.use('/api/deployment', deploymentRoutes);
app.use('/api/ai-models', aiModelRoutes);
app.use('/api/success-stories', successStoryRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
console.log('Attempting to start server...');
try {
  const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔐 Auth API: http://localhost:${PORT}/api/auth`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
      console.log('Process terminated');
    });
  });

  process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    server.close(() => {
      console.log('Process terminated');
    });
  });
} catch (error) {
  console.error('❌ Failed to start server:', error);
}

export default app;
