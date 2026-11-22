import { dataService } from '../services/data.service.js';

export const getSystemStatus = (req, res) => {
  res.json({
    success: true,
    data: {
      firestore: dataService.getFirestoreStatus(),
      counts: {
        customers: dataService.customers.length,
        products: dataService.products.length,
        negotiations: dataService.negotiations.length
      },
      projectId: "ai-crm-f73a5",
      rulesUrl: "https://console.firebase.google.com/project/ai-crm-f73a5/firestore/rules",
      timestamp: new Date().toISOString()
    }
  });
};

export const retrySync = async (req, res, next) => {
  try {
    const status = await dataService.retryFirestoreSync();
    res.json({
      success: true,
      message: status.connected 
        ? "Connected to Cloud Firestore. All records synchronized." 
        : `Sync failed: ${status.error || 'Check Firestore security rules.'}`,
      data: status
    });
  } catch (error) {
    next(error);
  }
};
