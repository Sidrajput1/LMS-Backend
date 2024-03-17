import express from 'express'
config();
import cors from 'cors'
import cookieParser from 'cookie-parser';
import {config} from 'dotenv'
import morgan from 'morgan';
import userRoutes from './routes/userRoutes.js'
import errorMiddleware from './middleware/error.middleware.js';
import courseRoutes from './routes/course.routes.js'
import paymentroute from './routes/payment.route.js';


const app = express();

app.use(express.json());

app.use(express.urlencoded({extended:true}));
app.use(
    cors({
        origin:'http://localhost:5173',
        credentials:true,
    })
);

// define morgan here
app.use(cookieParser());
app.use(morgan('dev'));

app.get('/ping',(req,res)=>{
    res.send('pong')
});

app.use('/api/v1/user',userRoutes);

app.use('/api/v1/courses',courseRoutes);

app.use('api/v1/payment',paymentroute);

app.all('*',(req,res)=>{
    res.status(404).send('oops! 404 error not found')
});

app.use(errorMiddleware);

export default app;