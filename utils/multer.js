import multer from "multer";
import path from "path"

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/assests')
  },
  filename: function (req, file, cb) {
		const extension = path.extname(file.originalname)
		const uniqueSuffix = new Date().toISOString().replace(/[-:.]/g, '')
		cb(null, uniqueSuffix + '-' + Math.round(Math.random() * 1e9) + extension)
    console.log("multerrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr")
console.log(req.files)
  }
 
})


export default  multer({storage:storage})




 
  
  