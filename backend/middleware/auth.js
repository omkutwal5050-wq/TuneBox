const jwt = require('jsonwebtoken');

const getSecret = () => process.env.JWT_SECRET || 'tunebox-development-secret';

const requireAuth = (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return res.status(401).json({ error: 'Authentication required' });

  try {
    req.auth = jwt.verify(token, getSecret());
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

const sameUser = (req, res, next) => {
  if (String(req.auth.userId) !== String(req.params.userId)) {
    return res.status(403).json({ error: 'You cannot modify another user' });
  }
  next();
};

const requireAdmin = (req, res, next) => {
  if (req.auth?.role !== 'admin') return res.status(403).json({ error: 'Administrator access required' });
  next();
};

module.exports = { getSecret, requireAuth, sameUser, requireAdmin };
