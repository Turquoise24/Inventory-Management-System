const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const products = require("./routes/products");
const auth = require("./routes/auth");
const requests = require("./routes/requests");
const notifications = require("./routes/notifications");
const cookieParser = require("cookie-parser");
const mongoSanitize = require("express-mongo-sanitize");
const helmet = require("helmet");
const xss = require("xss-clean");
const rateLimit = require("express-rate-limit");
const hpp = require("hpp");
const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUI = require("swagger-ui-express");
const bodyParser = require("body-parser");
const cors = require("cors");

// Load environment variables
dotenv.config({ path: "./config/config.env" });

// Connect to database
connectDB();

const app = express();

// Security middleware
app.use(helmet());
app.use(xss());
app.use(mongoSanitize());
app.use(hpp());

// Rate limiting - more lenient for development
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 500, // increased to 500 requests per windowMs
  message: {
    success: false,
    error: "Too many requests from this IP, please try again later.",
  },
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === "/health" || req.path === "/";
  },
});
app.use(limiter);

// Body parsing middleware
app.use(bodyParser.json({ limit: "50mb" })); // Increased for base64 images
app.use(bodyParser.urlencoded({ extended: false, limit: "50mb" }));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Cookie parser
app.use(cookieParser());

// CORS configuration
const corsOptions = {
  origin: [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    process.env.FRONTEND_URL,
    /https:\/\/.*\.vercel\.app$/, // Allow all Vercel deployments
  ].filter(Boolean),
  methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
  credentials: true, // Required if you are using cookies or sessions
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 86400, // 24 hours for production
};

console.log("CORS configured for origins:", corsOptions.origin);

app.use(cors(corsOptions));

// API routes
app.use("/api/v1/products", products);
app.use("/api/v1/auth", auth);
app.use("/api/v1/requests", requests);
app.use("/api/v1/notifications", notifications);

// Swagger configuration
const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "StockMe Inventory Management API",
      version: "1.0.0",
      description:
        "A comprehensive RESTful API for inventory management with user authentication and role-based authorization. Supports both admin and staff user roles with different access levels.",
      contact: {
        name: "StockMe API Support",
        email: "support@stockme.com",
      },
      license: {
        name: "ISC",
        url: "https://opensource.org/licenses/ISC",
      },
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 5000}/api/v1`,
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./routes/*.js"],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use(
  "/api-docs",
  swaggerUI.serve,
  swaggerUI.setup(swaggerDocs, {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "StockMe API Documentation",
  }),
);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "StockMe API is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// Root endpoint
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to StockMe Inventory Management API",
    version: "1.0.0",
    documentation: "/api-docs",
    health: "/health",
  });
});

// 404 handler for undefined routes
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.originalUrl} not found`,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);

  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(
  PORT,
  console.log(
    `StockMe API Server running in ${
      process.env.NODE_ENV || "development"
    } mode on http://localhost:${PORT}`,
  ),
);

// Handle unhandled promise rejections
process.on("unhandledRejection", (err, promise) => {
  console.log(`Error: ${err.message}`);
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.log(`Error: ${err.message}`);
  process.exit(1);
});
