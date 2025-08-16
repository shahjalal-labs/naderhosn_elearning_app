import express from 'express';
import { announcementControllers } from "./announcement.controller";
 
const router = express.Router();
 
router.post('/:gradeId', announcementControllers.createAnnouncement);
router.get('/', announcementControllers.getAllAnnouncements);
router.get('/:id', announcementControllers.getAnnouncementById);
router.patch('/:id', announcementControllers.updateAnnouncement);
router.delete('/:id', announcementControllers.deleteAnnouncement);
 
export const announcementRoutes = router;
  