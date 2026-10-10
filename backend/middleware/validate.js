const validateCredentials = (req, res, next) => {
  const { username, email, password } = req.body;
  if (req.path === '/register' && (!username || String(username).trim().length < 2)) {
    return res.status(400).json({ error: 'Username must contain at least 2 characters' });
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
    return res.status(400).json({ error: 'A valid email is required' });
  }
  if (!password) {
    return res.status(400).json({ error: 'Password is required' });
  }
  if (req.path === '/register' && String(password).length < 8) {
    return res.status(400).json({ error: 'Password must contain at least 8 characters' });
  }
  next();
};

module.exports = { validateCredentials };
