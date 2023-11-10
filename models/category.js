import mongoose from "mongoose"

const cateogarySchema= new mongoose.Schema({
    title:{
        type:String,
        required:true,
        set: (value) => value.toLowerCase().replace(/\s/g, '')
    },
    description:{
        type:String,
        required:true
    },
    is_listed:{
        type:Boolean,
        default:false
    },
    offer:{
        type:Number,
        default:0,
    }
})

const category= mongoose.model('category',cateogarySchema)

export default category;