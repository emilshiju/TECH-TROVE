import mongoose from "mongoose"
// import bcrypt from "bcrypt.js"

const userSchema =new mongoose.Schema({
    firstName:{
        type:String,
        required:true,

    },
    lastName:{
        type:String,
        required:true,
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    mobile:{
        type:String,
        required:true,
    },
    password:{
        type:String,
        required:true
    },
    is_blocked:{
        type:Boolean,
        default:false
    },
    is_admin:{
        type:Boolean,
        default:false
    },
    Wallet:{
        type:Number,
        default:0
    },
    WalletTransaction:{
        type:Array
    },
    coupons:{
        type:Array
    }
})

const User = mongoose.model("User", userSchema);

export default User;