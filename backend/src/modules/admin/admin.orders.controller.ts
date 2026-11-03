import { asyncHandler } from '../../utils/asyncHandler.js';
import { adminService } from './admin.service.js';

export const adminOrdersController = {
  getAll: asyncHandler(async (_req, res) => {
    const orders = await adminService.getAllOrders();
    res.status(200).json(orders);
  }),

  updateStage: asyncHandler(async (req, res) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { stage, trackingNumber } = req.body;
    const order = await adminService.updateOrderStage(id, stage, trackingNumber);
    res.status(200).json(order);
  }),

  issueVaultCertificate: asyncHandler(async (req, res) => {
    const cert = await adminService.issueVaultCertificate(req.body);
    res.status(201).json(cert);
  })
};
