import   jwt  from "jsonwebtoken";

export default{
    
        

    authenticateToken:(req,res,next)=>{
        const token=req.cookies.adminjwt;
        const secret=process.env.JWT_ADMIN_SECRET
        jwt.verify(token,secret,(err,decoded)=>{
           
            if(err){
                return res.status(400).redirect('/admin')
            }else{
                req.user=decoded;
                next()
            }
        })

    },
    isLoggedIn:(req,res,next)=>{
        const token=req.cookies.adminjwt
        if(!token){
            next()
        }else{
            const secret=process.env.JWT_SECRET
            jwt.verify(token,secret,(err,decoded)=>{
                if(err){
                    res.render('admin/admin-Login')
                }else{
                    res.redirect('/dashboard')
                }
            })
        }
    }
    


}