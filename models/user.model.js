import {Schema,model} from "mongoose";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';


const userSchema = new Schema (
    {
        fullname:{
            type:String,
            required: [true, 'Name is required'],
            minlength: [5, 'Name must be at least 5 characters'],
            lowercase: true,
            trim: true, 
        },
        email:{
            type:String,
            required:[true, 'email is required'],
            unique:true,
            lowercase:true,
            // match: [
            //     /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
            //     'Please fill in a valid email address',
            //   ], // Matches email against regex

        },
        password:{
            type:String,
            required:[true,'Password is required'],
            minlength:[8,'Password must be at least 8 characters'],
            select:false,
        },
        subscription: {
            id: String,
            status: String,
        },
        avatar:{
            public_id:{
                type:String,
            },
            secure_url:{
                type:String,
            },
        },
        role:{
            type:String,
            enum:["USER","ADMIN"],
            default:'USER'
        },
        forgotPasswordToken:String,
        forgotPasswordExpiry:Date,       
    },
    {
        timestamps: true,
    }
);

userSchema.pre('save',async function(next){
    if(!this.isModified('password')){
        next()
    }
    this.password = await bcrypt.hash(this.password,10)
})
//for generating jwt token

userSchema.methods = {
    generateJWTToken: async function(){
         return await jwt.sign(
            {id:this._id,email:this.email,subscription:this.subscription},
            process.env.SECRET,
            {
                expiresIn : process.env.JWT_EXPIRY,
            }
        )       
    },
    comparePassword: function(plainTextPassword){
        return bcrypt.compare(plainTextPassword,this.password)

    },
    generatePasswordResetToken: async function() {
        const resetToken = crypto.randomBytes(20).toString('hex');

        this.forgotPasswordToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex')
        this.forgotPasswordExpiry = Date.now() + 15 *60*1000;

    }
};



const User = model('user',userSchema);

export default User;