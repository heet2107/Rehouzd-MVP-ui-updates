import { Request, Response, NextFunction, RequestHandler } from 'express';
import passport from 'passport';
import * as authService from '../services/auth/authService';

// Login controller
export const login: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    res.status(400).json({ message: 'Email and password are required.' });
    return;
  }

  try {
    const result = await authService.loginUser(email, password);
    
    if (!result.success) {
      res.status(400).json({ message: result.message });
      return;
    }
    
    res.json({ 
      message: 'Login successful.', 
      token: result.token, 
      user: result.user 
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login.' });
  }
};

// Signup controller
export const signup: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { firstName, lastName, email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ message: 'Email and password are required.' });
    return;
  }

  try {
    const result = await authService.registerUser(firstName, lastName, email, password);
    
    if (!result.success) {
      res.status(400).json({ message: result.message });
      return;
    }
    
    res.status(201).json({ message: 'User created successfully.', user: result.user });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ message: 'Server error during signup.' });
  }
};

// Update user profile controller
export const updateProfile: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { user_id, email, first_name, last_name, mobile_number } = req.body;

  if (!user_id) {
    res.status(400).json({ message: 'User id is required.' });
    return;
  }

  try {
    const result = await authService.updateUserProfile(user_id, { email, first_name, last_name, mobile_number });
    
    if (!result.success) {
      res.status(result.code || 400).json({ message: result.message });
      return;
    }
    
    res.status(200).json({
      message: 'Profile updated successfully.',
      user: result.user,
    });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ message: 'Server error during profile update.' });
  }
};

// Password reset request controller
export const requestPasswordReset: RequestHandler = async (req, res, next) => {
  const { email } = req.body;
  
  if (!email) {
    res.status(400).json({ message: 'Email is required.' });
    return;
  }
  
  try {
    const result = await authService.createPasswordResetToken(email);
    
    if (!result.success) {
      res.status(400).json({ message: result.message });
      return;
    }
    
    res.json({ message: 'Password reset token generated.', token: result.token });
  } catch (err) {
    console.error('Request password reset error:', err);
    res.status(500).json({ message: 'Server error during password reset request.' });
  }
};

// Reset password controller
export const resetPassword: RequestHandler = async (req, res, next) => {
  const { email, token, newPassword } = req.body;
  
  if (!email || !token || !newPassword) {
    res.status(400).json({ message: 'Email, token, and new password are required.' });
    return;
  }
  
  try {
    const result = await authService.resetUserPassword(email, token, newPassword);
    
    if (!result.success) {
      res.status(400).json({ message: result.message });
      return;
    }
    
    res.json({ message: 'Password has been reset successfully.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ message: 'Server error during password reset.' });
  }
};

// Google OAuth initialization controller
export const googleAuthInitiate: RequestHandler = passport.authenticate('google', { scope: ['profile', 'email'] });

// Google OAuth callback controller
export const googleAuthCallback: RequestHandler = (req, res, next) => {
  passport.authenticate('google', { session: false }, async (err, user, info) => {
    if (err || !user) {
      return res.redirect('/login?error=google');
    }
    
    try {
      const result = await authService.handleGoogleAuthCallback(user);
      
      if (!result.success) {
        return res.redirect('/login?error=google');
      }
      
      return res.redirect(`/search?token=${result.token}`);
    } catch (error) {
      console.error('Google auth callback error:', error);
      return res.redirect('/login?error=google');
    }
  })(req, res, next);
}; 