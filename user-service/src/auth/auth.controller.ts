import { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service';

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { username, email, password } = req.body;

    const result = await authService.register(username, email, password);

    res.status(201).json({
      success: true,
      message: 'User registered',
      data: result,
      error: null
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { emailOrUsername, password } = req.body;

    const result = await authService.login(emailOrUsername, password);

    const { accessToken, refreshToken } = result as any;

    // set httpOnly secure cookie for refresh token
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/api/v1/auth'
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: { accessToken },
      error: null
    });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const refreshToken = req.body.refreshToken || (req as any).cookies?.refreshToken;
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'Refresh token required', data: null, error: 'Missing refresh token' });
    }

    const result = await authService.refresh(refreshToken);
    const { accessToken, refreshToken: newRefreshToken } = result as any;

    // rotate refresh token cookie
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/v1/auth'
    });

    res.json({ success: true, message: 'Token refreshed', data: { accessToken }, error: null });
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const refreshToken = req.body.refreshToken || (req as any).cookies?.refreshToken;

    if (refreshToken) {
      await authService.logout(refreshToken);
    }

    // clear cookie
    res.clearCookie('refreshToken', { path: '/api/v1/auth' });

    res.json({ success: true, message: 'Logged out successfully', data: null, error: null });
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const adminKey = req.headers['x-admin-key'];
    if (!adminKey || adminKey !== process.env.ADMIN_KEY) {
      return res.status(401).json({ success: false, message: 'Unauthorized', data: null, error: 'Invalid admin key' });
    }

    const { email, newPassword } = req.body;

    const result = await authService.resetPassword(email, newPassword);

    res.json({ success: true, message: 'Password reset', data: result, error: null });
  } catch (err) {
    next(err);
  }
}