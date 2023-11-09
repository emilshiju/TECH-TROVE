import mongoose from "mongoose";

const wishListSchema=new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
    },
    wishList:[
        {
            productId:{
                type:mongoose.Schema.Types.ObjectId,
                ref:"product"
            },
            createdAt:{
                type:Date,
                default:Date.now(),
            }
        }
    ]
})

const wishList=mongoose.model('wishList',wishListSchema)

export default wishList;