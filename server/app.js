const fs = require('fs');
require('dotenv').config();
const config = require('./config/config');
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('passport');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
var logger = require('morgan');

const connectToDB = require('./db');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const mpesaRouter = require('./routes/mpesa');
const leagueRouter = require('./routes/league');
const tournamentRouter = require('./routes/tournament');

const app = express();

// --------------------- Security Middleware ---------------------
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // max requests per window
  handler: (req, res) => {
    console.log('Rate limit exceeded for:', req.ip);
    res.status(429).send('Too many requests, please try again later.');
  },
});
// Apply to all requests unless in test environment
if (process.env.NODE_ENV !== 'test') {
  app.use(limiter);
}

// --------------------- CORS Middleware ---------------------
const allowedOrigins = [config.frontendUrl]; // e.g., 'https://secondstriker.vercel.app'

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // allow non-browser requests
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `CORS policy: Origin ${origin} not allowed`;
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Authorization','Content-Type']
}));

// Preflight for all routes
app.options('*', cors());

// --------------------- Database ---------------------
if (process.env.NODE_ENV !== 'test') {
  connectToDB();
}

// --------------------- Middleware ---------------------
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(morgan('combined'));
app.use(bodyParser.json());
app.use(compression());

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

app.use(passport.initialize());
app.use(passport.session());

// --------------------- Routes ---------------------
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/mpesa', mpesaRouter);
app.use('/league', leagueRouter);
app.use('/tournament', tournamentRouter);

// --------------------- Logging Middleware ---------------------
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} request to ${req.path}`);
  next();
});

// --------------------- Error Handling ---------------------
app.use(function (err, req, res, next) {
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.json({ error: err.message });
});

// --------------------- Graceful Shutdown ---------------------
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  if (global.client) global.client.close();
  process.exit();
});

module.exports = app;
