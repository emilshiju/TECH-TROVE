import  jwt  from "jsonwebtoken";
import user from "../models/user.js";
export default{

//JWT Authentication
authenticateToken:async(req,res,next)=>{
    try{
    const token=req.cookies.jwt;

    if(!token){
        console.log("no token")
        const allowedRoutes=['/','/shop']

        if(allowedRoutes.includes(req.path)){
          console.log("keor")
          
            return  next()
        }

        const routes=['/singleProduct','/shop','/categoryShop']
        if(routes.some(route=>req.path.startsWith(route))){
            console.log("vanu")
            next()
            return 
        }
      
        if(req.xhr){
           return  res.json({success:false,message:"please login"})
        }

        

        return res.status(401).redirect('/register')
    }
    

    const secret =process.env.JWT_SECRET
    
    jwt.verify(token,secret, async(err,decoded)=>{
        console.log("yeh tokennnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn")
        console.log(secret)
        console.log(token)
  

        if(err){
            res.clearCookie('jwt');
            console.log('token',err)

            return res.status(403).redirect('/')
        }

        req.user=decoded
       
        const find=await user.findById({_id:req.user.userId})
        if (find && find.is_blocked) {
            res.clearCookie('jwt');
            req.user=null
            console.log('token', err);
            return res.status(403).redirect('/');
          }
        console.log(req.user)

        next()
    })
}catch(error){
    console.log(error)
}
},


//checking isLoggedIn

  isLoggedIn:(req,res,next)=>{
 
    const token=req.cookies.jwt
    console.log(token)
    if(!token){
        next()
    }else{
        
        const secret=process.env.JWT_SECRET
        jwt.verify(token,secret,(err,decoded)=>{
            if(err){
                console.log(err)
                res.render('user/user-Register')
            }else{
                console.log("yeh")
                res.redirect('/')
            }
        })
    }
}

}