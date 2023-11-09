    
import mongoose from "mongoose";

const connectDB = async () => {
      try {
        await mongoose.connect(process.env.DATABASE_URI ,{
          useNewUrlParser: true,
          useUnifiedTopology: true,
          ssl: true, // Add this line to explicitly enable SSL
          tlsAllowInvalidCertificates: true,
        });
        console.log("Successfully connected to MongoDB");
      } catch (error) {
        console.error("Connection to MongoDB failed:", error);
        process.exit(1);
      }
    };
    

export default connectDB;

