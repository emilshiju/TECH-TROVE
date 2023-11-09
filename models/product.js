import mongoose from "mongoose";

const productSchema =new mongoose.Schema({
    name:{
        type:String,
        required:true,
        set: (value) => value.toLowerCase().replace(/\s/g, '')
    },
    description:{
        type:String,
        required:true
    },
    images:{
        type:Array
    },
    memory:{
        type:String,
        required:true
    },
    storage:{
        type:String,
        required:true
    },
    os:{
        type:String,
        required:true
    },
    brand:{
        type:String,
        required:true
    },
    category:{
        type:mongoose.Schema.ObjectId,
        ref:'category',
        required:true
    },
    price:{
        type:Number,
        required:true
    },
    stock:{
        type:Number,
        require:true
    },
    created_At:{
        type:Date,
        default:Date.now
    },
    updated_At:{
        type:Date,
        default:Date.now
    },
    status:{
        type:Boolean,
        default:false
    },
    offer:{
        type:Number,
        default:0,
    },
    realprice:{
        type:Number
    },
    rating: [
        {
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
            ratingValue: Number,
            review: String,
            createdAt:{
                type:Date,
                default:Date.now
            }
        }
    ]
})
const Product = mongoose.model('products', productSchema);

export default Product;