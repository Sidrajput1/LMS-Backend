import Course from "../models/course.model.js"
import Apperror from "../utils/appError.js"
import fs from 'fs/promises';
import cloudinary from 'cloudinary';
import upload from "../middleware/multer.middleware.js";


const getAllCourses = async (req, res, next) => {
    try {

        const courses = await Course.find({}).select('-lectures')

        res.status(200).json({
            success: true,
            message: "All courses",
            courses
        })

    } catch (e) {
        return next(new Apperror(e.message, 500));

    }


}


const getLectureByCourseId = async (req, res, next) => {
    try {

        const { id } = req.params;
        const course = await Course.findById(id);

        if (!course) {
            return next(new Apperror('course does not available', 400));
        }

        res.status(200).json({
            success: true,
            message: 'course lectured fetched successfully',
            course
        })


    } catch (e) {
        return next(new Apperror(e.message, 500));
    }

}

const createCourse = async (req, res, next) => {

    const { title, description, category, createdBy } = req.body;

    if (!title || !description || !category || !createdBy) {

        return next(new Apperror('All fields are required', 400));
    }

    const course = await Course.create({
        title,
        description,
        category,
        createdBy,
        thumbnail: {
            public_id: 'dummy',
            secure_url: 'dummy',
        },
    })

    if (!course) {
        return next(new Apperror('Course could not created,Please try again', 400));
    }

    try {

        if (req.file) {
            const result = await cloudinary.v2.uploader.upload(req.file.path, {
                folder: 'lms'
            });

            if (result) {
                course.thumbnail.public_id = 'result.public_id';
                course.thumbnail.secure_url = 'result.secure_url';
            }

            fs.rm(`uploads/${req.file.filename}`);
        }

    } catch (e) {
        return next(new Apperror(e.message, 400));

    }


    await course.save();

    res.status(200).json({
        success: true,
        message: 'Course created sucessfully',
        course
    })

};

const updateCourse = async (req, res, next) => {

    try {
        const { id } = req.params;
        const course = await Course.findByIdAndUpdate(
            id,
            {
                $set: req.body
            },
            {
                runValidators: true
            }
        );
        if (!course) {
            return next(new Apperror('Invalid course id or course not found.', 400));
        }

        res.status(200).json({
            success: true,
            message: 'Course updated sucessfully'

        });

    } catch (e) {
        return next(new Apperror(e.message, 400));
    }

};

const removeCourse = async (req, res, next) => {

    try {

        const { id } = req.params;
        const course = await Course.findById(id);

        if (!course) {
            return next(new Apperror('Course with given id does not exist', 404));
        }

        //await course.remove();
        await Course.findByIdAndDelete(id);

        res.send(200).json({
            success: true,
            message: 'Course remove successfully'
        })

    } catch (e) {

        return next(new Apperror(e.message, 400));
    }

};

const addLectureToCourseById = async(req,res,next) => {
    const {title,description} = req.body
    const {id} = req.params;

    if(!title || !description){
        return next(
            new Apperror('All feilds are required',400)
        )
    }

    const course = await Course.findById(id);
    if (!course) {
        return next(new Apperror('Invalid course id or course not found.', 400));
    }

    const lectureData = {
        title,
        description,
        lecture:{}
    };
    if(req.file){
        try{
            const result = await cloudinary.v2.uploader.upload(req.file.path,{
                folder:'lms'
            });
            console.log(JSON.stringify(result));
            if(result){
                lectureData.lecture.public_id = result.public_id;
                lectureData.lecture.secure_url = result.secure_url;
            }

            fs.rm(`uploads/${req.file.filename}`);


        }catch(e){
            return next(new Apperror(e.message, 400));
        }
    }

    course.lectures.push(lectureData);
    course.numberOfLectures = course.lectures.length;

    await course.save();

    res.send(200).json({
        success:true,
        message:"Successfully Add lecture",
        course
    })


}

export {
    getAllCourses,
    getLectureByCourseId,
    createCourse,
    updateCourse,
    removeCourse,
    addLectureToCourseById
}