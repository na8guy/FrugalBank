const User = require('../models/User');
const modulrService = require('../services/modulrService');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password, dateOfBirth, phone, address } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user in Modulr
    let modulrCustomer;
    try {
      modulrCustomer = await modulrService.createCustomer({
        name,
        email,
        dateOfBirth,
        phone,
        address,
      });
    } catch (error) {
      return res.status(500).json({ message: 'Error creating customer in payment system' });
    }

    // Create user in database
    const user = await User.create({
      name,
      email,
      password,
      dateOfBirth,
      phone,
      address,
      modulrCustomerId: modulrCustomer.id,
    });

    // Create a primary account for the user
    let modulrAccount;
    try {
      modulrAccount = await modulrService.createAccount(modulrCustomer.id);
    } catch (error) {
      // If account creation fails, we may need to handle it (e.g., delete the user)
      return res.status(500).json({ message: 'Error creating account in payment system' });
    }

    // Update user with account details
    user.accounts.push({
      accountId: modulrAccount.id,
      currency: modulrAccount.currency,
      sortCode: modulrAccount.sortCode,
      accountNumber: modulrAccount.accountNumber,
      balance: modulrAccount.balance || 0,
    });
    await user.save();

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};