import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import dotenv from 'dotenv';
import * as authModel from '../../models/auth/authModel';

dotenv.config();

// In production, store reset tokens in a database instead of memory.
const resetTokens: { [email: string]: { token: string; expires: number } } = {};

interface AuthResult {
  success: boolean;
  message: string;
  token?: string;
  user?: any;
  code?: number;
}

// Login a user with email and password
export const loginUser = async (email: string, password: string): Promise<AuthResult> => {
  try {
    // Find user by email
    const user = await authModel.getUserByEmail(email);
    if (!user) {
      return { success: false, message: 'Invalid credentials.' };
    }

    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      return { success: false, message: 'Invalid credentials.' };
    }

    // Generate a JWT token
    const token = jwt.sign(
      { user_id: user.user_id, email: user.email },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '1h' }
    );

    return { 
      success: true, 
      message: 'Login successful.',
      token,
      user: {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        fname: user.first_name,
        lname: user.last_name,
        mobile: user.mobile_number
      }
    };
  } catch (error) {
    console.error('Login service error:', error);
    throw error;
  }
};

// Register a new user
export const registerUser = async (
  firstName: string, 
  lastName: string, 
  email: string, 
  password: string
): Promise<AuthResult> => {
  try {
    // Check if user already exists
    const userExists = await authModel.checkUserExists(email);
    if (userExists) {
      return { success: false, message: 'User already exists. Please try a different email.' };
    }

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert the new user
    const newUser = await authModel.createUser({
      email,
      password_hash: hashedPassword,
      first_name: firstName,
      last_name: lastName
    });

    return { success: true, message: 'User created successfully.', user: newUser };
  } catch (error) {
    console.error('Registration service error:', error);
    throw error;
  }
};

// Update user profile
export const updateUserProfile = async (
  userId: number, 
  profileData: { email?: string; first_name?: string; last_name?: string; mobile_number?: string }
): Promise<AuthResult> => {
  try {
    // Check if the user exists
    const user = await authModel.getUserById(userId);
    if (!user) {
      return { success: false, message: 'User not found.', code: 404 };
    }

    if (Object.keys(profileData).length === 0) {
      return { success: false, message: 'No profile data provided to update.' };
    }

    const updatedUser = await authModel.updateUser(userId, profileData);
    
    return {
      success: true,
      message: 'Profile updated successfully.',
      user: updatedUser,
    };
  } catch (error) {
    console.error('Profile update service error:', error);
    throw error;
  }
};

// Create password reset token
export const createPasswordResetToken = async (email: string): Promise<AuthResult> => {
  try {
    // Check if user exists
    const user = await authModel.getUserByEmail(email);
    if (!user) {
      return { success: false, message: 'No user found with that email.' };
    }
    
    // Generate a reset token
    const token = crypto.randomBytes(32).toString('hex');
    // Token expires in 1 hour
    const expires = Date.now() + 3600000;
    resetTokens[email] = { token, expires };

    // In production, email the reset token or link to the user
    return { success: true, message: 'Password reset token generated.', token };
  } catch (error) {
    console.error('Create password reset token service error:', error);
    throw error;
  }
};

// Reset user password
export const resetUserPassword = async (
  email: string, 
  token: string, 
  newPassword: string
): Promise<AuthResult> => {
  try {
    const record = resetTokens[email];
    if (!record || record.token !== token || record.expires < Date.now()) {
      return { success: false, message: 'Invalid or expired token.' };
    }
    
    // Hash the new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    // Update the user's password in the database
    await authModel.updatePassword(email, hashedPassword);
    
    // Invalidate the token
    delete resetTokens[email];
    
    return { success: true, message: 'Password has been reset successfully.' };
  } catch (error) {
    console.error('Reset password service error:', error);
    throw error;
  }
};

// Handle Google auth callback
export const handleGoogleAuthCallback = async (user: any): Promise<AuthResult> => {
  try {
    // Generate a JWT token
    const token = jwt.sign(
      { user_id: user.user_id, email: user.email },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '1h' }
    );
    
    return { success: true, message: 'Google authentication successful', token };
  } catch (error) {
    console.error('Google auth callback service error:', error);
    throw error;
  }
};

// Configure Google OAuth strategy
export const configureGoogleStrategy = () => {
  const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
  const passport = require('passport');
  
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback'
  },
  async (accessToken: string, refreshToken: string, profile: any, done: Function) => {
    try {
      const email = profile.emails?.[0].value;
      if (!email) {
        return done(new Error('No email found'), false);
      }
      
      // Check if user exists
      let user = await authModel.getUserByEmail(email);
      
      if (!user) {
        // Create a new user with a random password
        const randomPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(randomPassword, 10);
        
        const newUser = await authModel.createUser({
          email,
          password_hash: hashedPassword
        });
        
        user = await authModel.getUserByEmail(email);
      }
      
      return done(null, user);
    } catch (error) {
      return done(error, false);
    }
  }));

  passport.serializeUser((user: any, done: Function) => {
    done(null, user.user_id);
  });

  passport.deserializeUser(async (id: number, done: Function) => {
    try {
      const user = await authModel.getUserById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
}; 