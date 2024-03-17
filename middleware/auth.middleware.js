import Apperror from "../utils/appError.js";
import  jwt  from "jsonwebtoken";

const isLoggedIn = async (req,res,next) => {

    const {token} = req.cookies;

    if(!token){
        return next(new Apperror('Unauthenticated,please log in again',404))
    }

    const userDetails =  await jwt.verify(token,process.env.SECRET);

    req.user = userDetails;
    next();

};

const authorizeRole = (...roles) => async(req,res,next) => {
    if(!roles.includes(req.user.role)){
        return next(
            new Apperror('You do not have permission to view this route',403)
        )
    }
    next();


};

export {
    isLoggedIn,
    authorizeRole
}