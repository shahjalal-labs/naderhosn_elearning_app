import express from 'express';
import { schoolControllers } from "./school.controller";
 
const router = express.Router();
 
router.post('/', schoolControllers.createSchool);
router.get('/', schoolControllers.getAllSchools);
router.get('/:id', schoolControllers.getSchoolById);
router.patch('/:id', schoolControllers.updateSchool);
router.delete('/:id', schoolControllers.deleteSchool);
 
export const schoolRoutes = router;
  