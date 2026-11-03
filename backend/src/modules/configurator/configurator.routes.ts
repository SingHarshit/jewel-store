import { Router } from 'express';
import { configuratorController } from './configurator.controller.js';

export const configuratorRoutes = Router();

configuratorRoutes.post('/calculate', configuratorController.calculatePricing);
configuratorRoutes.post('/sku/encode', configuratorController.encodeSku);
configuratorRoutes.get('/sku/decode/:sku', configuratorController.decodeSku);
configuratorRoutes.post('/sku/decode', configuratorController.decodeSku);
configuratorRoutes.get('/currency/convert', configuratorController.convertCurrency);
configuratorRoutes.get('/currency/rates', configuratorController.getFxRates);
