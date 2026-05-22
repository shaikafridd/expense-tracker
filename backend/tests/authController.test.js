import { signup, signin, getProfile } from '../src/controllers/authController.js';
import User from '../src/models/User.js';
import jwt from 'jsonwebtoken';
import passport from 'passport';

jest.mock('../src/models/User.js');
jest.mock('jsonwebtoken');
jest.mock('passport');

describe('Auth Controller Unit Tests', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {
      body: {},
      user: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('signup', () => {
    it('should register a new user successfully and return a token', async () => {
      mockReq.body = {
        email: 'test@example.com',
        password: 'password123',
        full_name: 'Test User'
      };

      // Mock User.findOne to return null (user doesn't exist)
      User.findOne.mockResolvedValue(null);

      // Mock User.create to return the new user
      const mockCreatedUser = {
        _id: 'userid123',
        email: 'test@example.com',
        full_name: 'Test User'
      };
      User.create.mockResolvedValue(mockCreatedUser);

      // Mock JWT sign
      jwt.sign.mockReturnValue('mockedtoken123');

      await signup(mockReq, mockRes, mockNext);

      expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(User.create).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        full_name: 'Test User'
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        user: {
          id: 'userid123',
          email: 'test@example.com',
          user_metadata: { full_name: 'Test User' }
        },
        token: 'mockedtoken123'
      });
    });

    it('should return 400 error if user email is already registered', async () => {
      mockReq.body = {
        email: 'existing@example.com',
        password: 'password123',
        full_name: 'Existing User'
      };

      // Mock User.findOne to return an existing user
      User.findOne.mockResolvedValue({ email: 'existing@example.com' });

      await signup(mockReq, mockRes, mockNext);

      expect(User.findOne).toHaveBeenCalledWith({ email: 'existing@example.com' });
      expect(User.create).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'User already exists with this email.' });
    });
  });

  describe('signin', () => {
    it('should authenticate user and return token on successful login', () => {
      const mockUser = {
        _id: 'userid123',
        email: 'test@example.com',
        full_name: 'Test User'
      };

      // Mock passport.authenticate callback behavior
      passport.authenticate.mockImplementation((strategy, options, callback) => {
        return (req, res, next) => {
          callback(null, mockUser, null);
        };
      });

      // Mock JWT sign
      jwt.sign.mockReturnValue('mockedtoken123');

      signin(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({
        user: {
          id: 'userid123',
          email: 'test@example.com',
          user_metadata: { full_name: 'Test User' }
        },
        token: 'mockedtoken123'
      });
    });

    it('should return 401 on failed authentication', () => {
      passport.authenticate.mockImplementation((strategy, options, callback) => {
        return (req, res, next) => {
          callback(null, false, { message: 'Invalid credentials' });
        };
      });

      signin(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Invalid credentials' });
    });
  });

  describe('getProfile', () => {
    it('should return authenticated user data', async () => {
      mockReq.user = {
        _id: 'userid123',
        email: 'test@example.com',
        full_name: 'Test User'
      };

      await getProfile(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        user: {
          id: 'userid123',
          email: 'test@example.com',
          user_metadata: { full_name: 'Test User' }
        }
      });
    });
  });
});
