import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret-key-for-development',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Add error logging middleware for JSON parsing
app.use((req, res, next) => {
  console.log(`=== INCOMING REQUEST ===`);
  console.log(`${req.method} ${req.path}`);
  console.log('Headers:', req.headers);
  console.log('Environment:', process.env.NODE_ENV);
  next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Add middleware to catch JSON parsing errors
app.use((err: any, req: any, res: any, next: any) => {
  if (err instanceof SyntaxError && 'body' in err) {
    console.error('JSON Parse error:', err.message);
    return res.status(400).json({ message: 'Invalid JSON format' });
  }
  next(err);
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Ultra-simple test endpoint BEFORE all middlewares
app.post('/api/debug/simple-test', (req, res) => {
  console.log('=== ULTRA SIMPLE TEST ENDPOINT HIT ===');
  console.log('Body exists:', !!req.body);
  console.log('Raw body type:', typeof req.body);
  res.json({ 
    success: true, 
    message: 'Ultra simple test works',
    bodyExists: !!req.body,
    timestamp: new Date().toISOString()
  });
});

// Direct login endpoint to bypass routing issues
app.post('/api/auth/direct-login', async (req, res) => {
  try {
    console.log('=== DIRECT LOGIN START ===');
    console.log('Environment:', process.env.NODE_ENV);
    console.log('Body received:', !!req.body);
    console.log('Body type:', typeof req.body);
    console.log('Body content:', req.body);
    
    if (!req.body || typeof req.body !== 'object') {
      console.log('Invalid body');
      return res.status(400).json({ message: 'Corps de requête invalide' });
    }

    const { username, password } = req.body;
    
    if (!username || !password) {
      console.log('Missing credentials');
      return res.status(400).json({ message: 'Identifiants manquants' });
    }

    console.log('Looking for user...');
    const { storage } = await import('./storage');
    const user = await storage.getUserByUsername(username);
    
    if (!user || !user.isActive) {
      console.log('User not found or inactive');
      return res.status(401).json({ message: 'Utilisateur invalide' });
    }

    console.log('Verifying password...');
    const { AuthService } = await import('./auth');
    const isValid = await AuthService.verifyPassword(password, user.password);
    
    if (!isValid) {
      console.log('Invalid password');
      return res.status(401).json({ message: 'Mot de passe incorrect' });
    }

    console.log('Creating token...');
    const token = await AuthService.createSession(user.id);

    console.log('=== DIRECT LOGIN SUCCESS ===');
    res.json({
      message: 'Connexion réussie',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error('=== DIRECT LOGIN ERROR ===');
    console.error('Error:', error);
    res.status(500).json({ 
      message: 'Erreur de connexion directe',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error(`Server error on ${req.method} ${req.path}:`, err);
    console.error('Error stack:', err.stack);

    if (!res.headersSent) {
      res.status(status).json({ message });
    }
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
