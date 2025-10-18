const fs = require('fs');
require('dotenv').config();
const config = require('./config/config');
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const morgan = require('morgan');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('passport');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');

const connectToDB = require('./db');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const mpesaRouter = require('./routes/mpesa');
const leagueRouter = require('./routes/league');
const tournamentRouter = require('./routes/tournament');

var app = express();

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Max requests
  handler: (req, res, next) => {
    console.log('Rate limit exceeded for:', req.ip);
    res.status(429).send('Too many requests, please try again later.');
  },
});
app.use(limiter);

app.use(cors({
  origin: config.frontendUrl,  
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],  
  credentials: true,
  allowedHeaders: ['Authorization', 'Content-Type'], 
}));

// Handle preflight requests for PATCH and other non-simple methods
app.options('*', cors(), (req, res) => {
  console.log('Handling OPTIONS request for:', req.path);
  res.sendStatus(200);
});

// Database connection
connectToDB();

const frontendProxy = createProxyMiddleware({
  target: config.frontendUrl, 
  changeOrigin: true,
  pathRewrite: { '^/frontend': '' },

  onProxyReq: (proxyReq, _req, res) => {
    console.log(`Proxying request to: ${config.frontendUrl}`);
    console.log('Headers sent:', proxyReq.getHeaders());
    proxyReq.setHeader('Access-Control-Allow-Origin', config.frontendUrl);
    proxyReq.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    proxyReq.setHeader('Access-Control-Allow-Headers', 'content-type');
  },
});

app.use('/frontend', frontendProxy);

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

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

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/mpesa', mpesaRouter);
app.use('/league', leagueRouter);
app.use('/tournament', tournamentRouter);

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} request to ${req.path}`);
  next();
});

app.use(function (err, req, res, next) {
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

process.on('SIGINT', () => {
  client.close();
  process.exit();
});


module.exports = app;