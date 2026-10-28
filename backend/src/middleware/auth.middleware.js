import { authService } from '../services/auth.service.js';

export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: "Authentication required. Please log in."
      });
    }

    const token = authHeader.split(' ')[1];
    const user = await authService.getCurrentUser(token);
    req.user = user;
    next();
  } catch (error) {
    return res.status(error.status || 401).json({
      success: false,
      error: error.message || "Invalid or expired session."
    });
  }
};
