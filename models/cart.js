import mongoose from "mongoose";

const cartSchema=new mongoose.Schema(
    {
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
    },
    cartItems:[
        {
          product:{
                type:mongoose.Schema.Types.ObjectId,
                ref:'products',
                required:true
            },
            quantity:{  
                type:Number,
                default:0,
            }
        }
    ]
},{
    timestamps:true
}
)

const cart =mongoose.model('Cart',cartSchema)

export  default  cart