import axios from 'axios';
import crypto from 'crypto';

class ModulrService {
  constructor() {
    this.apiKey = process.env.MODULR_API_KEY;
    this.apiSecret = process.env.MODULR_API_SECRET;
    this.baseURL = process.env.MODULR_BASE_URL;
  }

  generateAuthHeaders(method, path, body = '') {
    const timestamp = Date.now().toString();
    const nonce = crypto.randomBytes(16).toString('hex');
    const contentMD5 = body ? crypto.createHash('md5').update(body).digest('base64') : '';
    
    const signatureRaw = [
      method.toUpperCase(),
      contentMD5,
      'application/json',
      timestamp,
      nonce,
      path
    ].join(',');
    
    const signature = crypto
      .createHmac('sha1', this.apiSecret)
      .update(signatureRaw)
      .digest('base64');
    
    return {
      'Content-Type': 'application/json',
      'Authorization': `APIAuth ${this.apiKey}:${signature}`,
      'Date': timestamp,
      'nonce': nonce
    };
  }

  async createCustomer(userData) {
    const path = '/api/customers';
    const body = JSON.stringify({
      name: `${userData.firstName} ${userData.lastName}`,
      email: userData.email,
      dateOfBirth: userData.dateOfBirth.toISOString().split('T')[0],
      address: {
        line1: userData.address.line1,
        line2: userData.address.line2,
        town: userData.address.city,
        postcode: userData.address.postcode,
        country: userData.address.country
      }
    });

    try {
      const response = await axios.post(`${this.baseURL}${path}`, body, {
        headers: this.generateAuthHeaders('POST', path, body)
      });
      
      return response.data;
    } catch (error) {
      console.error('Modulr API Error - Create Customer:', error.response?.data);
      throw new Error('Failed to create customer in payment system');
    }
  }

  async createAccount(customerId, accountName) {
    const path = '/api/accounts';
    const body = JSON.stringify({
      customerId,
      name: accountName,
      currency: 'GBP'
    });

    try {
      const response = await axios.post(`${this.baseURL}${path}`, body, {
        headers: this.generateAuthHeaders('POST', path, body)
      });
      
      return response.data;
    } catch (error) {
      console.error('Modulr API Error - Create Account:', error.response?.data);
      throw new Error('Failed to create account in payment system');
    }
  }

  async initiatePayment(sourceAccountId, destinationAccountId, amount, reference) {
    const path = '/api/payments';
    const body = JSON.stringify({
      accountId: sourceAccountId,
      currency: 'GBP',
      amount,
      reference,
      destination: {
        type: 'ACCOUNT',
        accountId: destinationAccountId
      }
    });

    try {
      const response = await axios.post(`${this.baseURL}${path}`, body, {
        headers: this.generateAuthHeaders('POST', path, body)
      });
      
      return response.data;
    } catch (error) {
      console.error('Modulr API Error - Initiate Payment:', error.response?.data);
      throw new Error('Payment failed');
    }
  }

  async getAccountBalance(accountId) {
    const path = `/api/accounts/${accountId}/balance`;
    
    try {
      const response = await axios.get(`${this.baseURL}${path}`, {
        headers: this.generateAuthHeaders('GET', path)
      });
      
      return response.data;
    } catch (error) {
      console.error('Modulr API Error - Get Balance:', error.response?.data);
      throw new Error('Failed to retrieve account balance');
    }
  }
}

export default new ModulrService();