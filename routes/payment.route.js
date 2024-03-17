import {Router} from 'express';
import {allPayments, buySubscription, cancelSubscription, getRozorpayApiKey, verifySubscription } from '../controllers/payment.controller.js';
import { authorizeRole, isLoggedIn } from '../middleware/auth.middleware.js';

const router = Router();

router
    .route('/razorpay-key')
    .get(
        isLoggedIn,
        getRozorpayApiKey
    );


router
    .route('/subscribe')
    .post(
        isLoggedIn,
        buySubscription
    );
   
   
router
    .route('/verify')
    .post(
        isLoggedIn,
        verifySubscription
    );  

router
    .route('/unsubscribe')
    .post(
        isLoggedIn,
        cancelSubscription
    );

router
    .route('/')
    .get(
        isLoggedIn,
        authorizeRole('AdMIN'),
        allPayments
    );   
   

export default router;