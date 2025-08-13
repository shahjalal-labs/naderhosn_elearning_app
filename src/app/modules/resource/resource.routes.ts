import express from 'express';
import { resourceControllers } from "./resource.controller";
 
const router = express.Router();
 
router.post('/', resourceControllers.createResource);
router.get('/', resourceControllers.getAllResources);
router.get('/:id', resourceControllers.getResourceById);
router.patch('/:id', resourceControllers.updateResource);
router.delete('/:id', resourceControllers.deleteResource);
 
export const resourceRoutes = router;
  