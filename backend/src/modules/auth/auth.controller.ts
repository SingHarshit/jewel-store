import { asyncHandler } from '../../utils/asyncHandler.js';
import { authService } from './auth.service.js';

export const authController = {
  register: asyncHandler(async (req, res) => {
    const result = await authService.register(req.body);
    res.status(201).json(result);
  }),

  login: asyncHandler(async (req, res) => {
    const result = await authService.login(req.body);
    res.status(200).json(result);
  }),

  magicLink: asyncHandler(async (req, res) => {
    const result = await authService.requestMagicLink(req.body.email);
    res.status(200).json(result);
  }),

  verifyOtp: asyncHandler(async (req, res) => {
    const result = await authService.verifyOtp(req.body.email, req.body.otpCode);
    res.status(200).json(result);
  }),

  demoCustomer: asyncHandler(async (_req, res) => {
    const result = await authService.loginAsDemo('customer');
    res.status(200).json(result);
  }),

  demoAdmin: asyncHandler(async (_req, res) => {
    const result = await authService.loginAsDemo('admin');
    res.status(200).json(result);
  }),

  me: asyncHandler(async (req, res) => {
    const user = await authService.getMe(req.user!.id);
    res.status(200).json({ user });
  }),

  logout: asyncHandler(async (_req, res) => {
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  })
};
