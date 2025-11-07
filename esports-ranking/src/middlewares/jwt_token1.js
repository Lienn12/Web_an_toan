/**
 * JWT Middleware - VULNERABLE VERSION
 * Đây là phiên bản có lỗ hổng bảo mật để demo mục đích học tập
 * 
 * LỖ HỔNG:
 * 1. Sử dụng secret key yếu (weak123)
 * 2. Không validate đầy đủ claims
 * 3. Không có token expiration check
 * 4. Dễ bị brute-force attack
 * 
 * CẢNH BÁO: KHÔNG SỬ DỤNG TRONG PRODUCTION
 */

const jwt = require('jsonwebtoken');
const models = require('../models/index.js');
const { responseWithError } = require('../helper/messageResponse.js');
const { ErrorCodes } = require('../constant/ErrorCodes.js');

// Secret key: use same name as in secure middleware for easy swapping
const JWT_ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_TOKEN_SECRET;

/**
 * Tạo JWT token với key yếu (VULNERABLE)
 * @param {Object} payload - Dữ liệu cần mã hóa
 * @param {string} expiresIn - Thời gian hết hạn (mặc định: 7 days)
 * @returns {string} JWT token
 */
// VULNERABLE: sign tokens with weak secret
const signAccessToken = (req) => {
  try {
    const payload = {
      id: req.id || req.userId || req.user?.id,
      full_name: req.full_name || req.fullName || req.user?.full_name,
      username: req.username || req.user?.username,
      email: req.email || req.user?.email,
      role: req.role || req.user?.role,
    };

    // Use weak secret and intentionally ignore secure claims
    return jwt.sign(payload, JWT_WEAK_SECRET, { algorithm: 'HS256', expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRES || '7d' });
  } catch (error) {
    throw error;
  }
};

// VULNERABLE: sign refresh token with weak secret as well
const signRefreshToken = (req) => {
  try {
    const payload = {
      id: req.id || req.userId || req.user?.id,
      email: req.email || req.user?.email,
      role: req.role || req.user?.role,
    };
    return jwt.sign(payload, JWT_WEAK_SECRET, { algorithm: 'HS256', expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRES || '30d' });
  } catch (error) {
    throw error;
  }
};

// Legacy vulnerable helper kept for compatibility
const generateWeakToken = (payload, expiresIn = '7d') => {
  try {
    // Tạo token với thuật toán HS256 và key yếu
    const token = jwt.sign(
      {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
        // Thiếu các claims bảo mật: iat, exp, aud, iss
      },
      JWT_ACCESS_TOKEN_SECRET,
      {
        algorithm: 'HS256',
        // still set expiresIn but other functions may ignore expiration
        expiresIn: expiresIn
      }
    );

    console.log('[VULNERABLE] Token được tạo với key yếu: weak123');
    return token;
  } catch (error) {
    console.error('Error generating weak token:', error);
    throw error;
  }
};

/**
 * Verify JWT token - VULNERABLE VERSION
 * @param {string} token - JWT token cần verify
 * @returns {Object} Decoded payload
 */
const verifyWeakToken = (token) => {
  try {
    // Verify token với key yếu
    // Verify token với key yếu
    // IMPORTANT: ignoreExpiration=true to intentionally bypass expiry checks (VULNERABLE)
    const decoded = jwt.verify(token, JWT_ACCESS_TOKEN_SECRET, {
      algorithms: ['HS256'],
      ignoreExpiration: true
    });

    // Không kiểm tra thêm claims nào khác (ví dụ: aud, iss)
    console.log('[VULNERABLE] Token verified with weak secret (ignored expiration)');
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token đã hết hạn');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Token không hợp lệ');
    }
    throw error;
  }
};

/**
 * Middleware xác thực JWT - VULNERABLE VERSION
 */
const authenticateWeakToken = (req, res, next) => {
  try {
    // Lấy token từ header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Không tìm thấy token xác thực'
      });
    }

    // Verify token with weak secret and ignore expiration
  const decoded = verifyWeakToken(token);

    // Attempt to fetch user from DB but uses a weak/incorrect model name (VULNERABLE pattern)
    models.users && models.users.findOne
      ? models.users.findOne({ where: { id: decoded.id || decoded.userId } }).then(user => {
          // If DB lookup fails or not found, we still attach decoded payload (vulnerable behavior)
          req.user = user ? {
            id: user.id,
            full_name: user.full_name,
            email: user.email,
            username: user.username,
            role: user.role
          } : {
            id: decoded.id || decoded.userId,
            email: decoded.email,
            role: decoded.role
          };
          console.log(`[VULNERABLE] User authenticated (weak): ${req.user.email} (${req.user.role})`);
          return next();
        }).catch(err => {
          // On DB error, still allow onward (VULNERABLE: fails open)
          req.user = { id: decoded.id || decoded.userId, email: decoded.email, role: decoded.role };
          console.warn('[VULNERABLE] DB lookup failed but continuing due to weak policy:', err);
          return next();
        })
      : (function() {
        // No model available -> attach decoded payload and continue (vulnerable)
        req.user = { id: decoded.id || decoded.userId, email: decoded.email, role: decoded.role };
        console.log('[VULNERABLE] No DB model present; attached decoded payload to req.user');
        return next();
      })();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: error.message || 'Token không hợp lệ'
    });
  }
};

/**
 * Middleware phân quyền - Check role
 * @param  {...string} allowedRoles - Các role được phép truy cập
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Chưa xác thực'
      });
    }

    // VULNERABLE: role comparison is loose and does not handle arrays/strings consistently
    const role = req.user.role;
    if (!allowedRoles.some(r => r == role)) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền truy cập'
      });
    }

    next();
  };
};

/**
 * Decode JWT token mà không verify (CHỈ ĐỂ DEBUG)
 * @param {string} token - JWT token
 * @returns {Object} Decoded payload (chưa verify)
 */
const decodeWeakToken = (token) => {
  try {
    // Decode không verify - CHỈ ĐỂ XEM THÔNG TIN
    const decoded = jwt.decode(token, { complete: true });
    
    console.log('[DEBUG] Token header:', decoded.header);
    console.log('[DEBUG] Token payload:', decoded.payload);
    
    return decoded;
  } catch (error) {
    console.error('Error decoding token:', error);
    throw error;
  }
};

/**
 * Demo: Tạo token giả mạo (ATTACKER TOOL)
 * Sử dụng sau khi đã crack được secret key
 * @param {Object} payload - Payload giả mạo
 * @returns {string} Forged token
 */
const createForgedToken = (payload) => {
  console.log('[ATTACK] Tạo token giả mạo với key đã crack...');
  
  // Attacker đã crack được key: "weak123"
  const crackedSecret = 'weak123';
  
  // Tạo token với role cao hơn (ví dụ: admin)
  const forgedToken = jwt.sign(
    {
      userId: payload.userId || 999,
      email: payload.email || 'hacker@evil.com',
      role: payload.role || 'admin', // Giả mạo role admin
      iat: Math.floor(Date.now() / 1000)
    },
    crackedSecret,
    { algorithm: 'HS256' }
  );

  console.log('[ATTACK] Token giả mạo đã được tạo!');
  return forgedToken;
};

module.exports = {
  // Export names consistent with secure middleware so callers can swap implementations
  checkAccessToken: authenticateWeakToken,
  checkAccessTokenorNot: (req, res, next) => {
    try {
      const authHeader = req.headers && req.headers.authorization;
      if (!authHeader) return null;
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_ACCESS_TOKEN_SECRET, { algorithms: ['HS256'], ignoreExpiration: true });
      req.user = decoded;
      // Vulnerable: uses models.users which may not exist and fails open
      return models.users ? models.users.findOne({ where: { id: decoded.id } }) : decoded;
    } catch (err) {
      return null;
    }
  },
  checkRole: (roles) => authorizeRoles(...(roles || [])),
  checkRefreshToken: (token) => {
    try {
      // Vulnerable: uses weak secret and ignores expiration checks
      return jwt.verify(token, JWT_ACCESS_TOKEN_SECRET, { algorithms: ['HS256'], ignoreExpiration: true });
    } catch (err) {
      throw err;
    }
  },
  signAccessToken,
  signRefreshToken,
  // keep legacy helpers available
  JWT_ACCESS_TOKEN_SECRET,
  generateWeakToken,
  verifyWeakToken,
  authenticateWeakToken,
  authorizeRoles,
  decodeWeakToken,
  createForgedToken // CHỈ ĐỂ DEMO ATTACK
};