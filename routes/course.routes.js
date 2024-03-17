import { Router } from 'express';
import { authorizeRole, isLoggedIn } from '../middleware/auth.middleware.js';
import { addLectureToCourseById, createCourse, getAllCourses, getLectureByCourseId, removeCourse, updateCourse } from '../controllers/course.controller.js';
import upload from '../middleware/multer.middleware.js';

const router =  Router();

router.route('/')
           .get(getAllCourses)
           .post(
               isLoggedIn,
               authorizeRole('ADMIN'),
               upload.single('thumbnail'),
               createCourse
            )

router.route('/:id')
          .get(isLoggedIn,getLectureByCourseId)
          .put(
            isLoggedIn,
            authorizeRole('ADMIN'),
            updateCourse
         )
          .delete(
            isLoggedIn,
            authorizeRole('ADMIN'),
            removeCourse
         )
         .post(
            isLoggedIn,
            authorizeRole('ADMIN'),
            upload.single('lecture'),
            addLectureToCourseById
         )

export default router;
