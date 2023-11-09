import mongoose  from "mongoose";

const bannerSchema=new mongoose.Schema({
    title:{
        type:String,
        required:true
    },
    link:{
        type:String,
        required:true
    },
    image:{
        type:String,
        required:true
    },
    created_At:{
        type:Date,
        default:Date.now
    },
    updated_At:{
        type:Date,
        default:Date.now
    }
})


const banner= mongoose.model('banner',bannerSchema)

export default banner
