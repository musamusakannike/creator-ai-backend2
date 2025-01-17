import { Request, Response } from 'express';

// Login Success
export const loginSuccess = (req: Request, res: Response) => {
  if (req.user) {
    res.status(200).json({
      message: 'Login successful',
      user: req.user,
    });
  } else {
    res.status(401).json({ message: 'Not authenticated' });
  }
};

// Login Failure
export const loginFailure = (req: Request, res: Response) => {
  res.status(401).json({ message: 'Login failed' });
};

// Logout
export const logout = (req: Request, res: Response) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ message: 'Error logging out' });
    res.status(200).json({ message: 'Logged out successfully' });
  });
};
