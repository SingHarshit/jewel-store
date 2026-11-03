import { Router } from 'express';
import { catalogController } from './catalog.controller.js';

export const catalogRoutes = Router();

catalogRoutes.get('/', catalogController.getAll);
catalogRoutes.get('/categories', catalogController.getCategories);
catalogRoutes.get('/:slug', catalogController.getBySlug);
