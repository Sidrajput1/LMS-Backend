// import paymentroute from '../routes/payment.route.js'
import crypto from 'crypto'
import User from "../models/user.model.js";
import payment from "../models/payment.model.js";
import Apperror from "../utils/appError.js";
import { razorpay } from '../server.js';

export const getRozorpayApiKey = async (_req, res, next) => {
    try {
        res.status(200).json({
            success: true,
            message: 'RazorPay API Key',
            key: process.env.RAZORPAY_KEY_ID,
        });
        
    } catch (error) {
        return next(
            new Apperror(error,400)
        )
        
    }
    

};

export const buySubscription = async (req, res, next) => {
    try {
        const { id } = req.user;
        const user = await User.findById(id);
        

    if (!user) {
        return next(
            new Apperror('unauthorized please login', 400)
        )
    }
    if (user.role === 'ADMIN') {
        return next(
            new Apperror('Admin cannot purchase subscription', 400)
        )
    }

    const subscription = await razorpay.subscriptions.create({
        plan_id: process.env.RAZORPAY_PLAN_SECRET,
        customer_notify: 1

    })
    user.subscription.id = subscription.id;
    user.subscription.status = subscription.status;

    await user.save();

    res.status(200).json({
        success: true,
        message: 'User subscribe succesfully',
        subscription_id: subscription.id
    });

        
    } catch (error) {
        return next(
            new Apperror("Failed to Buy Course",error,400)
        )
        
    }

    
}

export const verifySubscription = async (req, res, next) => {

    try {

        const { id } = req.user;
        const { razorpay_payment_id, razorpay_signature, razorpay_subscription_id } = req.body;

        const user = await User.findById(id)

        if (!user) {
            return next(
                new Apperror('unauthorized please login', 400)
            )
        }

        const subscriptionId = user.subscription.id;

        const generatedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpay_payment_id}|${subscriptionId}`)
            .digest('hex')

        if (generatedSignature !== razorpay_signature) {
            return next(
                new Apperror('Payment not verified,please try again', 500)
            )
        }

        await payment.create({
            razorpay_payment_id,
            razorpay_signature,
            razorpay_subscription_id
        });

        user.subscription.status = 'active';
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Payment verified sucessfully'

        })


        
    } catch (error) {
        return next(
            new Apperror('Payment Verification failed',error.message,400)
        )
        
    }

}

export const cancelSubscription = async (req, res, next) => {

    try {
        const { id } = req.user;
        const user = await User.findById(id);
        if (user.role === 'ADMIN') {
            return next(
                new Apperror('Admin does not need to cannot cancel subscription', 400)
            );
        }

        const subscriptionId = user.subscription.id;

        const subscription = await razorpay.subscriptions.cancel(
            subscriptionId
        );

        user.subscription.status = subscription.status;

        await user.save();


    } catch (e) {
        return next(
            new Apperror(e.message,400)
        )

    }



}

export const allPayments = async (req, res, next) => {

    try{

        const {count} = req.query;
        const subscription = await razorpay.subscriptions.all({
            count : count || 10
        })

        res.status(200).json({
            success:true,
            message:'All Payments',
            subscription
        })

    }catch(e){
        return next(
            new Apperror(e.message,400)
        )
    }

}



