import { authService } from '../services/auth.service.js';
import { dataService } from '../services/data.service.js';

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

export const signup = async (req, res, next) => {
  try {
    const { name, email, password, company } = req.body;
    const result = await authService.signup(name, email, password, company);
    res.status(201).json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    res.json({
      success: true,
      user: req.user
    });
  } catch (error) {
    next(error);
  }
};

export const getDemoCredentials = (req, res) => {
  const credentials = authService.getDemoCredentials();
  res.json({
    success: true,
    credentials
  });
};

export const resetData = async (req, res, next) => {
  try {
    await dataService.resetToSeed();
    res.json({
      success: true,
      message: "Database and Cloud Firestore successfully reset to seed records."
    });
  } catch (error) {
    next(error);
  }
};
