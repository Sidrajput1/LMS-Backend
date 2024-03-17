import mongoose from "mongoose";

mongoose.set('strictQuery',false)

const connectToDB = async () => {

    try{
        const connection = await mongoose.connect(
            process.env.MONGODB_URL || `mongodb://localhost:27017/mydatabase`
        );

        if(connection){
            console.log(`Connected to MongoDB: ${connection.connection.host}`);
        }

    }catch(e){
        console.log(e);
        process.exit(1);

    }
}

export default connectToDB;