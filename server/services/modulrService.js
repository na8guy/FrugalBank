const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

class ModulrService {
  constructor() {
    this.apiKey = process.env.MODULR_API_KEY;
    this.apiSecret = process.env.MODULR_API_SECRET;
    this.baseURL = process.env.MODULR_BASE_URL;
  }

  getAuthHeaders() {
    const token = Buffer.from(`${this.apiKey}:${this.apiSecret}`).toString('base64');
    return {
      'Authorization': `Basic ${token}`,
      'Content-Type': 'application/json',
    };
  }

  async createCustomer(userData) {
    // userData: { name, email, dateOfBirth, phone, address }
    const endpoint = `${this.baseURL}/api/customers`;
    const data = {
      ...userData,
      externalId: uuidv4(), // Generate a unique external ID
    };

    try {
      const response = await axios.post(endpoint, data, { headers: this.getAuthHeaders() });
      return response.data;
    } catch (error) {
      console.error('Error creating customer in Modulr:', error.response?.data || error.message);
      throw error;
    }
  }

  async createAccount(customerId, currency = 'GBP') {
    const endpoint = `${this.baseURL}/api/accounts`;
    const data = {
      customerId,
      currency,
      externalId: uuidv4(),
    };

    try {
      const response = await axios.post(endpoint, data, { headers: this.getAuthHeaders() });
      return response.data;
    } catch (error) {
      console.error('Error creating account in Modulr:', error.response?.data || error.message);
      throw error;
    }
  }

  async makeTransfer(accountId, payeeAccountId, amount, reference) {
    // This function is for transferring money between accounts (for example, from user's account to goal account)
    const endpoint = `${this.baseURL}/api/transfers`;
    const data = {
      sourceAccountId: accountId,
      destinationAccountId: payeeAccountId,
      amount,
      currency: 'GBP',
      reference,
      externalId: uuidv4(),
    };

    try {
      const response = await axios.post(endpoint, data, { headers: this.getAuthHeaders() });
      return response.data;
    } catch (error) {
      console.error('Error making transfer in Modulr:', error.response?.data || error.message);
      throw error;
    }
  }

  // Additional methods for getting account balance, transactions, etc.
}

module.exports = new ModulrService();