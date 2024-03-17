import fs from 'fs/promises';
import User from "../models/user.model.js";
import Apperror from "../utils/appError.js";
import cloudinary from 'cloudinary'
import sendEmail from '../utils/sendEmail.js';
import crypto from 'crypto';
//import jwt from 'jsonwebtoken';

const cookieOptions = {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: true
};

const registerUser = async (req, res, next) => {
    try {

        const { fullname, email, password } = req.body
        if (!fullname, !email, !password) {
            return next(new Apperror('All fields are requires', 404));
        }


        const userExist = await User.findOne({ email });
        if (userExist) {
            return next(new Apperror("Email already exists", 400));
        }

        const user = await User.create({
            fullname,
            email,
            password,
            avatar: {
                public_id: email,
                secure_url: 'https://res.cloudinary.com/du9jzqlpt/image/upload/v1674647316/avatar_drzgxv.jpg'
            },
            

        });
        // If user not created send message response
        if (!user) {
            return next(new Apperror("User Registration Failed", 400));
        }
        //file uploade using cloudinary

        console.log('file details:', JSON.stringify(req.file))

        if (req.file) {
            try {
                const result = await cloudinary.v2.uploader.upload(req.file.path, {
                    folder: 'lms',
                    height: 250,
                    width: 250,
                    gravity: 'faces',
                    crop: 'fill'
                })

                if (result) {
                    user.avatar.public_id = result.public_id;
                    user.avatar.secure_url = result.secure_url;

                    //remove file from local
                    fs.rm(`uploads/${req.file.filename}`)
                }

            } catch (e) {

                return next(
                    new Apperror(e || 'file not uploaded,please try again', 500)
                )

            };

        }

        await user.save()
        user.password = undefined

        const token = await user.generateJWTToken();
        res.cookie("token", token, cookieOptions);


        res.status(200).json({
            success: true,
            messsage: "User register succesfully",
            user,
        })

    } catch (e) {
        return next(new Apperror(e.message, 400));
    }

}

const loginUser = async (req, res, next) => {

    try {

        const { email, password } = req.body

        if (!email || !password) {
            return next(new Apperror('All fields are required', 400));
        }
        const user = await User.findOne({ email }).select("+password");

        if (!user || !user.comparePassword(password)) {
            return next(new Apperror('incorrect user or password', 400));
        }

        const token = await user.generateJWTToken();

        user.password = undefined
        res.cookie('token', token, cookieOptions);

        res.status(200).json({
            success: true,
            messsage: 'user login successfully',
            user,

        });

    } catch (e) {
        return next(new Apperror('something went wrong', 404));

    }


}

const logoutUser = (req, res) => {
    res.cookie = ('token', null, {
        secure: true,
        maxAge: 0,
        httpOnly: true
    });
    res.status(200).json({
        success: true,
        message: 'user logged out successfully'
    });


};

const userDetails = async (req, res) => {

    try {
        const userId = req.user.id;
        const user = await User.findById(userId)

        res.status(200).json({
            success: true,
            message: 'user Details',
            user
        });

    } catch (e) {
        return next(new Apperror('can not find user details', 400));

    }


};

const forgotPassword = async (req, res, next) => {

    const { email } = req.body

    if (!email) {
        return next(new Apperror('email can not be empty', 400))
    }
    const user = await User.findOne({ email });

    if (!user) {
        return next(new Apperror('email not registered', 400))
    }

    const resetToken = await user.generatePasswordResetToken();

    await user.save();

    const resetPasswordUrl = `${process.env.FRONT_URL}/reset-password/${resetToken}`
    // const message = `${resetPasswordUrl}`

    const subject = 'Reset Password';

    const message = `You can reset your password by clicking <a href=${resetPasswordUrl} target="_blank">Reset your password</a>\nIf the above link does not work for some reason then copy paste this link in new tab ${resetPasswordUrl}.\n If you have not requested this, kindly ignore.`;

    try {
        await sendEmail(email, subject, message)

        res.send(200).json({
            success: true,
            message: `Reset password token has been successfully sent to ${email}`
        });

    } catch (e) {

        user.forgotPasswordExpiry = undefined;
        user.forgotPasswordToken = undefined;

        await user.save();

        return next(new Apperror(e.message, 500))

    }

}


const resetPassword = async (req, res) => {
    const { resetToken } = req.params

    const { password } = req.body;

    const forgotPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex')

    const user = await User.findOne({
        forgotPasswordToken,
        forgotPasswordExpiry: { $gt: Date.now() }
    });

    if (!user) {
        return next(new Apperror('token is invalid or expired,please try again!', 400))
    }
    user.password = password;
    user.forgotPasswordToken = undefined;
    user.forgotPasswordExpiry = undefined;


    user.save();

    res.status(200).json({
        success: true,
        message: 'password changed sucessfully'
    })

}

const changePassword = async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const { id } = req.user;

    if (!oldPassword || !newPassword) {
        // new Apperror('All fields are required,please try again',400)
        return next(new Apperror('All fields are required,please try again', 400))
    }

    const user = await User.findById(id).select('+password');

    if (!user) {
        return next(new Apperror('user does not exist', 400));
    }

    const isPasswordValid = await user.comparePassword(oldPassword)

    if (!isPasswordValid) {
        return next(new Apperror('Invalid old password', 400));
    }

    user.password = newPassword;
    await user.sava();

    user.password = undefined;

    res.status(200).json({
        success: true,
        message: 'Password changed sucessfully'
    });


};

const updateProfile = async (req, res) => {

    const { fullname } = req.body;
    //const { id } = req.user.id;
    const {id} = req.params

    const user = await User.findById(id);

    if (!user) {
        return next(new Apperror('User does not exist', 400))
    }
    if (req.fullname) {
        user.fullname = fullname;
    }
    if (req.file) {
        await cloudinary.v2.uploader.destroy(user.avatar.public_id);

        try {
            const result = await cloudinary.v2.uploader.upload(req.file.path, {
                folder: 'lms',
                height: 250,
                width: 250,
                gravity: 'faces',
                crop: 'fill'
            })

            if (result) {
                user.avatar.public_id = result.public_id;
                user.avatar.secure_url = result.secure_url;

                //remove file from local
                fs.rm(`uploads/${req.file.filename}`)
            }

        } catch (e) {

            return next(
                new Apperror(e || 'file not uploaded,please try again', 500)
            )

        };
    }
    await user.save();

    res.status(200).json({
        success: true,
        message: 'User details updated successfully',
    });

};

export {
    registerUser,
    loginUser,
    logoutUser,
    userDetails,
    forgotPassword,
    resetPassword,
    changePassword,
    updateProfile

}