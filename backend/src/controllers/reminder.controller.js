import { dataService } from '../services/data.service.js';

export const getAllReminders = (req, res, next) => {
  try {
    const reminders = dataService.getAllReminders();
    res.json({
      success: true,
      count: reminders.length,
      data: reminders
    });
  } catch (error) {
    next(error);
  }
};

export const createReminder = async (req, res, next) => {
  try {
    const { customerId, customerName, title, dueDate, priority, notes } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        error: "Reminder title is required."
      });
    }

    const reminder = await dataService.createReminder({
      customerId: customerId || "",
      customerName: customerName || "General",
      title: title.trim(),
      dueDate: dueDate || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      priority: priority || "Medium",
      notes: notes || ""
    });

    res.status(201).json({
      success: true,
      message: "Reminder scheduled successfully in Cloud Firestore.",
      data: reminder
    });
  } catch (error) {
    next(error);
  }
};

export const updateReminder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updated = await dataService.updateReminder(id, req.body);
    res.json({
      success: true,
      message: "Reminder updated successfully in Cloud Firestore.",
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

export const deleteReminder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await dataService.deleteReminder(id);
    res.json({
      success: true,
      message: "Reminder deleted successfully from Cloud Firestore.",
      data: deleted
    });
  } catch (error) {
    next(error);
  }
};
