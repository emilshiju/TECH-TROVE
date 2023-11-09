import mongoose from "mongoose";

const oderSchema=new mongoose.Schema({

    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    oders:{
        type:Array
    }
})

const Oder=mongoose.model('Oder',oderSchema)

export default Oder;

