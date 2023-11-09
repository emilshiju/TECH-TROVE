import mongoose from "mongoose";

const userAddressSchema=new mongoose.Schema(
  
    {
        user:{
            type:mongoose.Schema.Types.String,
            ref:'User',
            required:true
        },
        address:[
            {
                name:{
                    type:String,
                    required:true   
                },
                mobileNumber:{
                    type:String,
                    required:true
                },
                address:{
                    type:String,
                    required:true
                },
                locality:{
                    type:String,
                    required:true
                },
                city:{
                    type:String,
                    required:true
                },
                pincode:{
                    type:String,
                    required:true
                },
                state:{
                    type:String,
                    requied:true
                }

            }
        ]

    }
  
)

const Address=mongoose.model('Address',userAddressSchema)

export default Address;