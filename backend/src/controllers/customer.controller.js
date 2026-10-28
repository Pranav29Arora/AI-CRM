import { dataService } from '../services/data.service.js';

export const getAllCustomers = (req, res, next) => {
  try {
    const { search, status } = req.query;
    const customers = dataService.getAllCustomers({ search, status });
    res.json({
      success: true,
      count: customers.length,
      data: customers
    });
  } catch (error) {
    next(error);
  }
};

export const getCustomerById = (req, res, next) => {
  try {
    const { id } = req.params;
    const customer = dataService.getCustomerById(id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        error: `Customer with ID ${id} not found.`
      });
    }

    const negotiations = dataService.getAllNegotiations().filter(n => n.customerId === id);
    const conversation = dataService.getConversationByCustomerId(id);
    const reminders = dataService.getAllReminders().filter(r => r.customerId === id);

    res.json({
      success: true,
      data: {
        ...customer,
        negotiations,
        conversation,
        reminders
      }
    });
  } catch (error) {
    next(error);
  }
};

export const createCustomer = async (req, res, next) => {
  try {
    const { name, company, phone, email, budget, leadStatus, preferences, notes, interestedProducts } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: "Customer name is required."
      });
    }

    const newCustomer = await dataService.createCustomer({
      name,
      company,
      phone,
      email,
      budget,
      leadStatus,
      preferences,
      notes,
      interestedProducts
    });

    res.status(201).json({
      success: true,
      message: "Customer created successfully in Cloud Firestore.",
      data: newCustomer
    });
  } catch (error) {
    next(error);
  }
};

export const updateCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updated = await dataService.updateCustomer(id, req.body);
    res.json({
      success: true,
      message: "Customer updated successfully in Cloud Firestore.",
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await dataService.deleteCustomer(id);
    res.json({
      success: true,
      message: "Customer deleted successfully from Cloud Firestore.",
      data: deleted
    });
  } catch (error) {
    next(error);
  }
};
