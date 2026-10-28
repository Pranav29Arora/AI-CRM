import { dataService } from '../services/data.service.js';

export const getDashboardAnalytics = (req, res, next) => {
  try {
    const analytics = dataService.getDashboardAnalytics();
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    next(error);
  }
};
