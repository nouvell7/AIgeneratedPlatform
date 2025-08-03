import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

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

// Basic auth routes
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // Mock authentication
  if (email === 'admin@aiplatform.com' && password === 'admin123!') {
    res.json({
      success: true,
      data: {
        user: {
          id: '1',
          email: 'admin@aiplatform.com',
          role: 'ADMIN',
        },
        tokens: {
          accessToken: 'mock-jwt-token',
          refreshToken: 'mock-refresh-token',
        },
      },
    });
  } else if (email === 'demo@example.com' && password === 'demo123!') {
    res.json({
      success: true,
      data: {
        user: {
          id: '2',
          email: 'demo@example.com',
          role: 'USER',
        },
        tokens: {
          accessToken: 'mock-jwt-token',
          refreshToken: 'mock-refresh-token',
        },
      },
    });
  } else {
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      },
    });
  }
});

app.post('/api/auth/register', (req, res) => {
  const { email, password, username } = req.body;
  
  res.json({
    success: true,
    data: {
      user: {
        id: '3',
        email,
        username: username || email.split('@')[0],
        role: 'USER',
      },
      tokens: {
        accessToken: 'mock-jwt-token',
        refreshToken: 'mock-refresh-token',
      },
    },
  });
});

// Mock auth profile endpoint
app.get('/api/auth/profile', (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'No token provided',
      },
    });
  }
  
  // Mock user based on token (in real app, decode JWT)
  res.json({
    success: true,
    data: {
      user: {
        id: '1',
        email: 'demo@example.com',
        username: 'demo_user',
        role: 'USER',
      },
    },
  });
});

// Mock projects endpoint
app.get('/api/projects', (req, res) => {
  res.json({
    success: true,
    data: {
      projects: [
        {
          id: '1',
          name: '내 첫 번째 AI 서비스',
          description: '이미지 분류를 위한 간단한 AI 서비스입니다.',
          category: 'image-classification',
          status: 'development',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      pagination: {
        page: 1,
        totalPages: 1,
        total: 1,
        hasMore: false,
      },
    },
  });
});

// Mock templates endpoints
app.get('/api/templates', (req, res) => {
  res.json({
    success: true,
    data: {
      templates: [
        {
          id: '1',
          name: '이미지 분류 서비스',
          description: 'Teachable Machine을 사용한 간단한 이미지 분류 웹 서비스입니다.',
          category: 'image-classification',
          difficulty: 'BEGINNER',
          rating: 4.5,
          usageCount: 0,
        },
        {
          id: '2',
          name: '텍스트 감정 분석',
          description: 'Hugging Face 모델을 사용한 텍스트 감정 분석 서비스입니다.',
          category: 'text-analysis',
          difficulty: 'INTERMEDIATE',
          rating: 4.2,
          usageCount: 0,
        },
        {
          id: '3',
          name: '음성 인식 서비스',
          description: '브라우저 Web Speech API를 활용한 음성 인식 서비스입니다.',
          category: 'audio-recognition',
          difficulty: 'ADVANCED',
          rating: 4.0,
          usageCount: 0,
        },
      ],
    },
  });
});

app.get('/api/templates/featured', (req, res) => {
  res.json({
    success: true,
    data: {
      templates: [
        {
          id: '1',
          name: '이미지 분류 서비스',
          description: 'Teachable Machine을 사용한 간단한 이미지 분류 웹 서비스입니다.',
          category: 'image-classification',
          difficulty: 'BEGINNER',
          rating: 4.5,
          usageCount: 0,
        },
      ],
    },
  });
});

// Mock project creation endpoint
app.post('/api/projects', (req, res) => {
  const { name, description, category } = req.body;
  
  const newProject = {
    id: Date.now().toString(),
    name,
    description,
    category,
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  res.json({
    success: true,
    data: {
      project: newProject,
    },
  });
});

// Mock project detail endpoint
app.get('/api/projects/:id', (req, res) => {
  const { id } = req.params;
  
  res.json({
    success: true,
    data: {
      project: {
        id,
        name: '내 첫 번째 AI 서비스',
        description: '이미지 분류를 위한 간단한 AI 서비스입니다.',
        category: 'image-classification',
        status: 'development',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    },
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} not found`,
    },
  });
});

// Start server
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

export default app;