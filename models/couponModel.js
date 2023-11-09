import mongoose from "mongoose";

const couponSchema=new mongoose.Schema({
       
    couponCode:{
        type:String
    },
    validity:{
        type:Date,
        default:new Date()
    },
    minPurchase:{type:Number},
    minDiscountPercentage:{type:Number},
    maxDiscountValue:{type:Number},
    discription:{type:String},
    createdAt:{
        type:Date,
        default:new Date()
    }
})

const coupon=mongoose.model('Coupon',couponSchema)

export default coupon