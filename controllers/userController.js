import asyncHandler from "express-async-handler"
import User from "../models/user.js"
import bcrypt from "bcrypt"
import  Jwt  from "jsonwebtoken"
import category from "../models/category.js"
import Product from "../models/product.js"
import Address from "../models/address.js"
import verificationHelper from "../utils/twillio.js"
import { ObjectId } from 'mongodb';
import Banner from "../models/banner.js"
import Cart from "../models/cart.js"
import WishList from "../models/wishList.js"
import { PhoneNumberContextImpl } from "twilio/lib/rest/lookups/v2/phoneNumber.js"

// import url from'url';
// import { log } from "console"
// import { exists } from "moongose/models/user_model.js"



export default{

    getHomePage:asyncHandler(async(req,res,next)=>{

    try{
        let cartlengths;
        let wishlistcount=0;
        let wishListProduct;
        console.log(req.user)
       if(req.user){
        console.log("keri")
        const userId=req.user.userId
        const cart=await Cart.findOne({userId:userId})
        // console.log(cart)
        
     
        
        if(cart){
            if(cart.cartItems){
                cartlengths=cart.cartItems.length
            }else{
                cartlengths=0
            }
        }else{
            cartlengths=0
        }
        
       
        let userWishList=await WishList.findOne({user:userId})
       
         if(userWishList){
            wishlistcount=userWishList.wishList.length
         }

          wishListProduct=await WishList.find()
    }
    console.log("wishhhhhhhhhhhhhhlisssssssssssssssssssstttttttttttttttttttttttttttttttttttt")
    console.log(wishListProduct)

   
        
       
        const banner=await Banner.find({})
        const categorys =await category.find({is_listed:{$ne:true}})
        console.log(categorys)
        const Products=await Product.find({status:{$ne:true}}).populate('category')
        console.log(Products)
        const categoryImage=await Product.find({}).limit(7)
        const newArrival=await Product.find().sort({updated_At:-1}).limit(5)
        
            
        
            res.render('user/user-Home',{
                user:req.user,
                categorys,
                Products,
                categoryImage,
                newArrival,
                cartlengths,
                banner,
                wishlistcount,
                wishListProduct
            })
       

    }catch(error){
        console.log(error)
        next(error)
        
    }
    
    }),
    getShopPage:asyncHandler(async(req,res,next)=>{
      
        try{
            let cartlengths;
            let wishlistcount=0;
         
            if(req.user){
             const userId=req.user.userId
             const cart=await Cart.findOne({userId:userId})
             
            
        if(cart){
            if(cart.cartItems){
                cartlengths=cart.cartItems.length
            }else{
                cartlengths=0
            }
        }else{
            cartlengths=0
        }

       
        let userWishList=await WishList.findOne({user:userId})
       
         if(userWishList){
            wishlistcount=userWishList.wishList.length
         }
         }
        
        
     

            const categorys=await category.find({})
            const products=await Product.find({})

            res.render('user/user-Shop',{
                user:req.user,
                categorys,
                products,
                cartlengths,
                wishlistcount
            })

        }catch(error){
            console.log(error)
            next(error)
           
        }
    }),
    getSignupForm:asyncHandler(async(req,res)=>{
     
         res.render('user/user-Register')
           
        
    }),
    registerUser:asyncHandler(async(req,res,next)=>{
        try{
            const email=req.body.email
            const phone=req.body.phone
            console.log(phone)
            const emails= await User.findOne({email:email})
            const mobile=await User.findOne({mobile:phone})
            
            if(emails){
                return res.render('user/user-Register',{message:'email already exists'})
            }
            if(mobile){
                return res.render('user/user-Register',{message:'phone number already existst'})
            }
            if(req.body.password!=req.body.confpassword){
                 return res.render('user/user-Register',{message:'password and confmpassword  check'})
            }

            req.session.userData=req.body
            await verificationHelper.sendOtp(phone)
     
            res.redirect(`/getverifyOtp?phone=${phone}`)

    }catch(err){
        console.log(err)
        next(err)
    
        
    }

    }),
    getLoginForm:asyncHandler(async(req,res,next)=>{
        
        try {
            if(res.locals.user){
                console.log("am")
                res.redirect('/')
            }else{
                res.render('user/user-Login')
            }
        } catch (error) {
            console.log(error)
            next(error)
        }
    }),
    userLogin:asyncHandler(async(req,res,next)=>{
        try{
            const {email,password}=req.body
     
            
          
            const user=await User.findOne({email:email})
            console.log(user)
            if(user&&user.is_blocked){
                console.log("keri")
                return res.render('user/user-Login',{message:'your permssion declined'})
            }

            if(user){


                if(password.length==4){
                    console.log(user.mobile)
                    const verified= await  verificationHelper.verifyOtp(user.mobile,password)
                    if(verified){
                        req.session.user=user
                        console.log('addddddddddddddddddddddddddddddddddddddddddddd',req.session.user)
                        const secretKey=process.env.JWT_SECRET ;
                        const token =Jwt.sign({userId:user._id},secretKey,{expiresIn:'1d'});
                        res.cookie('jwt', token, { httpOnly: true }); // Set the JWT as a cookie
                        res.redirect('/')
                    }else{
                       return  res.render('user/user-Login',{message:'invalid entry'})
                    }
                }


                const isMath=await bcrypt.compare(password,user.password)

                if(isMath){
                    if(user.is_blocked){
                        res.render('user/user-Login',{message:"your permission declined"})
                    }else{
                        req.session.user=user
                        console.log('addddddddddddddddddddddddddddddddddddddddddddd',req.session.user)
                        const secretKey=process.env.JWT_SECRET ;
                        const token =Jwt.sign({userId:user._id},secretKey,{expiresIn:'1d'});
                        res.cookie('jwt', token, { httpOnly: true }); // Set the JWT as a cookie
                        res.redirect('/')
                    }
                }else{
                    res.render('user/user-Login',{message:"invalid entry"})
                }
            }else{
                res.render('user/user-Login',{message:"invalid email"})
            }

            
        }catch(err){
            console.log(err)
            next(err)
        }
       
    }),
    getLogout:async(req,res,next)=>{
        try{
            console.log(req.session)
            

            req.session.destroy(err=>{
                console.log("kerii")
                console.log(req.session)
                if(err){
                    console.log(err)
                }else{
                    console.log(req.session)
                }
            })
            console.log("log")
           
            res.clearCookie('jwt')

            res.redirect('/')
        }catch(err){
            console.log(err)
            next(err)
            
        }
    },

    // verify OTP 
    getOtpForm:async(req,res,next)=>{
        try{
            const phone=req.query.phone
            console.log(phone)
             
           
           
        res.render('user/verify-Otp',{phone})
        }catch(error){
            console.log(error)
          next(error)
        }
    },
    otpLogin:async(req,res)=>{
        try{
          console.log(req.body)
          const email = req.query.email;
            
            const user=await User.findOne({email:email})
            if(!user) return res.json({message:'enter valid email '})
            const phone=user.mobile
            console.log("poyiiiiiiiiippppppppooooooooooooooyyyiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii")
            console.log(phone)
           await verificationHelper.sendOtp(phone)
        }catch(error){
            res.render('user/verify-Otp',{message:"otp failed"})
            console.log(error)
            // throw new Error(error.message)
        }
    },
    resendOtp:async(req,res)=>{
        try{
           const user= req.session.userData
           console.log(user)
            
           if(!user){
            res.status(400).json({messagge:"invaid"})
           }

           await verificationHelper.sendOtp(user.phone)

           res.render('user/verify-Otp',{message:'otp send successfully',phone:user.phone})

        }catch(error){
            console.log(error)
        }
    },
    verifyOTP:async(req,res)=>{
        try{
            const user=req.session.userData
             console.log(user)
             const mobile=req.body.phone
             console.log(mobile)
            const otp=req.body.otp

           const verified= await  verificationHelper.verifyOtp(user.phone,otp)
           
           if(!verified){
            return res.render('user/verify-Otp',{message:"otp not correct"})
           }

            const saltRounds=10;
           bcrypt.hash(user.password,saltRounds,(err,hash)=>{
                 if(err){
                    res.status(500).send({
                        message:
                        err.message||"errors occured while hashing"
                    })
                    return;
                 }
          
        const newUser=new User({
            firstName:user.firstName,
            lastName:user.lastName,
            password:hash,
            email:user.email,
            mobile:user.phone
            
        })

        newUser.save()
        console.log(newUser)
         const secretKey=process.env.JWT_SECRET
         const token=Jwt.sign({userId:newUser._id},secretKey,{expiresIn:'1d'})
         res.cookie('jwt', token, { httpOnly: true }); // Set the JWT as a cookie
         res.redirect('/')


      
    })
           
        }catch(error){
            res.render('user/verify-Otp',{message:'error'})
            throw new Error(error.message)
        }
    },
    getForgotPassword:async(req,res)=>{
        try{
            res.render('user/forgot-Password')
        }catch(error){
            console.log(error)
        }
    },
    displayProduct:async(req,res,next)=>{
        try{
            // for cart lenght
            let cartlengths;
            let wishlistcount=0;
            let wishListProduct;
       if(req.user){
        const userId=req.user.userId
        const cart=await Cart.findOne({userId:userId})
        
        if(cart){
            if(cart.cartItems){
                cartlengths=cart.cartItems.length
            }else{
                cartlengths=0
            }
        }else{
            cartlengths=0
        }

     
        let userWishList=await WishList.findOne({user:userId})
       
         if(userWishList){
            wishlistcount=userWishList.wishList.length
         }
       

          wishListProduct=await WishList.find()
    }

       
        
            const Category=await category.find({})   
            const page=parseInt(req.query.page)||1
            
            const limit=4
            const skip=(page-1)*limit; // Calculate the number of products to skip
            const searchQuery=req.query.search||''
            const sortQuery=req.query.sort||'default'
            const minPriceString=req.query.minPrice?req.query.minPrice.replace(/,/g, ''):'';
            const maxPriceString=req.query.maxPrice?req.query.maxPrice.replace(/,/g, ''):'';
            
            const minPrice=parseFloat(minPriceString)
            const maxPrice=parseFloat(maxPriceString)
          console.log(minPrice)

            // build the search filter
            const searchFilter={
                $and:[
                    {status:false},
                    {
                      $or:[
                        {name:{$regex:new RegExp(searchQuery,'i')}}
                      ]
                    }
                ]
            };
            if(!isNaN(minPrice)&&!isNaN(maxPrice)){
                searchFilter.$and.push({price:{$gte:minPrice,$lte:maxPrice}})
            }

            let sortOption={}
            
            if(sortQuery==='price_asc'||sortQuery===''){
               
                sortOption={price:1};
            }else if(sortQuery==='price_desc'){
                
                sortOption={price:-1}
            }

            const totalProducts=await Product.countDocuments(searchFilter)
            const totalPages=Math.ceil(totalProducts/limit)
            const count=totalProducts
            const product=await Product.find(searchFilter)
              .skip(skip)
              .limit(limit)
              .sort(sortOption)
              .populate('category')
              res.render('user/user-Shop',{products:product,Category,currentPage:page,totalPages,count,user:req.user,cartlengths,wishlistcount,wishListProduct})
            //   console.log(product)
        }catch(error){

            console.log(error)
            next(error)
       
        }
    },

    
    displayCategory:async(req,res)=>{

       // for cart lenght
       let cartlengths;
       let wishlistcount=0;
       if(req.user){
        const userId=req.user.userId
        const cart=await Cart.findOne({userId:userId})
        if(cart){
            if(cart.cartItems){
                cartlengths=cart.cartItems.length
            }else{
                cartlengths=0
            }
        }else{
            cartlengths=0
        }

        
        let userWishList=await WishList.findOne({user:userId})
       
         if(userWishList){
            wishlistcount=userWishList.wishList.length
         }
        
    }

         console.log(req.query.id)
        const id=req.query.id||''  //category query
        console.log(id)
        
        const Category=await category.find({})   
        const page=parseInt(req.query.page)||1
        
        const limit=8
        const skip=(page-1)*limit; // Calculate the number of products to skip
        const searchQuery=req.query.search||''
        const sortQuery=req.query.sort||'default'
        const minPriceString=req.query.minPrice?req.query.minPrice.replace(/,/g, ''):'';
        const maxPriceString=req.query.maxPrice?req.query.maxPrice.replace(/,/g, ''):'';

        const minPrice=parseFloat(minPriceString)
        const maxPrice=parseFloat(maxPriceString)
      console.log(minPrice)

        // build the search filter
        const searchFilter={
            $and:[
                {status:false},
                {
                  $or:[
                    {name:{$regex:new RegExp(searchQuery,'i')}}
                  ]
                }
             ]
        };
        if(id){
            searchFilter.$and.push({category:{$in:id}})
        }
       

        if(!isNaN(minPrice)&&!isNaN(maxPrice)){
            searchFilter.$and.push({price:{$gte:minPrice,$lte:maxPrice}})
        }

        let sortOption={}
        // sortQuery==='price_asc'||
        if(sortQuery===''){
            // sortOption={price:1};
        }else if(sortQuery==='price_desc'){
            console.log("des")
            sortOption={price:-1}
        }else if(sortQuery==='price_asc'){
            console.log("kerii")
            sortOption={price:1};
        }

        
        const totalProducts=await Product.countDocuments(searchFilter)
        const totalPages=Math.ceil(totalProducts/limit)
        const count=totalProducts
   
       console.log(id)
       console.log(Category)
        const product=await Product.find(searchFilter)
          .skip(skip)
          .limit(limit)
          .sort(sortOption)
          .populate('category')
          res.render('user/categoryShop',{products:product,Category,currentPage:page,totalPages,id,count,user:req.user,cartlengths,wishlistcount})
        
    
    },
    userProfile:asyncHandler(async(req,res,next)=>{
        try{

             // for cart lenght
             const userId=req.user.userId
             const cart=await Cart.findOne({userId:userId})
             let cartlengths;
             if(cart){
                if(cart.cartItems){
                    cartlengths=cart.cartItems.length
                }else{
                    cartlengths=0
                }
            }else{
                cartlengths=0
            }

            const id=req.user.userId
            const USER=await User.findById(id)
            console.log(USER)
            console.log("hereeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee")

            res.render('user/user-Profile',{
                user:req.user,
                USER,
                cartlengths
            })
        }catch(error){
            console.log(error)
            next(error)
            
        }
    }),
    getUserAddress:asyncHandler(async(req,res,next)=>{
        try{

             // for cart lenght
             const Id=req.user.userId
             const userId=req.user.userId
             const cart=await Cart.findOne({userId:Id})
             let cartlengths;
             let wishlistcount=0;
             if(cart){
                if(cart.cartItems){
                    cartlengths=cart.cartItems.length
                }else{
                    cartlengths=0
                }
            }else{
                cartlengths=0
            }

           
            let userWishList=await WishList.findOne({user:userId})
           
             if(userWishList){
                wishlistcount=userWishList.wishList.length
             }


            let num=parseInt(req.query.number)||0
           
            

            let ans;
            
            let edit=false;
            let show=true;
            let add;
            let lenght;
            let notadd=true;
            let narrowbar=false;
            let totalPages=4;
            

           
           
            const flashMessage=req.flash('message')
           
            const find=await Address.findOne({user:userId})
            let count=0;

            if(find){
                count=find.address.length
            }
            if(find&&find.address.length){
                ans=find.address[num]
                lenght=find.address.length
            }

            if(find&&find.address.length) show=true
            else show=false,add=true

            if(req.query.add){
                add=true
                show=false
                // num=1
            }
           
        
            
            if(req.query.edit){
                edit=true
                show=false
            }

            if(lenght>=4) notadd=false
           
            console.log(lenght)
            // if(lenght ===2){
            // if(num==0) narrowbar=true
            // }

            console.log(num)
            res.render('user/user-address',{
                user:req.user,
                show,
                notadd,
                narrowbar,
                flash:flashMessage,
                ans,
                add,
                count,
                num,
                totalPages,
                edit,
                cartlengths,
                wishlistcount

            })
            
            // if(find){
            //     const address=find.address
          
            //     res.render('user/user-address',{
            //         user:req.user,
            //         show:true,
            //         flash:flashMessage,
            //         address:address
            //     })
            // }else{
            //     res.render('user/user-address',{
            //         user:req.user,
            //         display:true,
            //         flash:flashMessage
            //     })
            // }
          
        }catch(error){
            console.log(error)
            next(error)
           
        }
    }),
    userAddress:asyncHandler(async(req,res,next)=>{
 
        try{

            

            const userId=req.user.userId
            let existingAddressIndex
            let index=req.body.index
            
            const address={
                name:req.body.name,
                locality:req.body.locality,
                city:req.body.city,
                pincode:req.body.pincode,
                state:req.body.state,
                mobileNumber:req.body.mobile,
                address:req.body.address
            }

            let find=await Address.findOne({user:userId})
              
            if(!find){
                find=new Address({user:userId,address:[address]})
            }else{
                console.log(req.body.value)
               
                existingAddressIndex=find.address.findIndex(addr => addr._id.toString() ===req.body.value)
                 // if not match found will become negative one
                if(existingAddressIndex !==-1){
                    find.address[existingAddressIndex]=address
                }else{
                    find.address.push(address)
                }
            }
            await find.save();
            req.flash('message','sucesfuly updated')
                 res.redirect(`/my-address?number=${index}`)

        //     if(!find){
            
        //     const userAddress=await Address({
        //         user:userId,
        //         address:[address]
        //     })

        //     await userAddress.save()
        //     req.flash('message','sucesfuly created')
        //     res.redirect('/my-address')
        // }else{
        //     const userAddress=await Address.findOneAndUpdate(

        //         {user:userId},
        //         {address:[address]}
        //     )

        //     await userAddress.save()
        //     req.flash('message','sucesfuly updated')
        //      res.redirect('/my-address')
        // }

        }catch(error){
            console.log(error)
            next(error)
            
        }
    }),
    editAddress:asyncHandler(async(req,res,next)=>{
        try{
              // for cart lenght
              const Id=req.user.userId
              const cart=await Cart.findOne({userId:Id})
              let cartlengths;
              if(cart){
                if(cart.cartItems){
                    cartlengths=cart.cartItems.length
                }else{
                    cartlengths=0
                }
            }else{
                cartlengths=0
            }

            let wishlistcount=0;
            let userWishList=await WishList.findOne({user:userId})
           
             if(userWishList){
                wishlistcount=userWishList.wishList.length
             }

            const userId=req.user.userId
            const find=await Address.findOne({user:userId})

            res.render('user/user-address',{
                user:req.user,
                editAddress:true,
                address:find.address,
                cartlengths,
                wishlistcount
            })
        }catch(error){
            console.log(error)
            next(error)
            
        }
    }),
    getUserAccountDetails:asyncHandler(async(req,res,next)=>{
        try{
              // for cart lenght
              const Id=req.user.userId
              const cart=await Cart.findOne({userId:Id})
              const userId=req.user.userId
              let cartlengths;
              let wishlistcount=0;
              if(cart){
                if(cart.cartItems){
                    cartlengths=cart.cartItems.length
                }else{
                    cartlengths=0
                }
            }else{
                cartlengths=0
            }

           
            let userWishList=await WishList.findOne({user:userId})
           
             if(userWishList){
                wishlistcount=userWishList.wishList.length
             }

           
            const users=await User.findById(userId)
             const flashMessage=req.flash('message')
            if(req.query.edit){
              
                const show=req.query.edit
               
                return res.render('user/user-account-details',{
                    user:userId,
                    users,
                    cartlengths,
                    wishlistcount
                })
            }
            
            res.render('user/user-account-details',{
            
                user:userId,
                users,
                show:true,
                flash:flashMessage,
                cartlengths
            })
        }catch(error){
            console.log(error)
            next(error)
           
        }
    }),
    myAddresDelete:asyncHandler(async(req,res,next)=>{
        try{
            const userId=req.user.userId
            const addres=req.query.delete
           

            const deleteAddres=await Address.findOneAndUpdate(
                {user:userId},
                {$pull:{address:{_id: new ObjectId(addres) }}},
                {new:true}
            )
         
            res.redirect('/my-address')
        }catch(error){
            console.log(error)
            next(error)
            
        }
    }),
    changePassword:asyncHandler(async(req,res,next)=>{
        try{
            
            res.render('user/changePassword')

        }catch(error){
            console.log(error)
            next(error)
            
        }
    }),
    changePasswordOtp:asyncHandler(async(req,res,next)=>{
        try{
            const email = req.query.email;
            console.log(email)
            const user=await User.findOne({email:email})
            if(!user) return res.json({message:'enter valid email ',status:false})
            const phone=user.mobile
           
           await verificationHelper.sendOtp(phone)

        }catch(error){
            console.log(error)
            next(error)
         
        }
    }),
    verifychanging:asyncHandler(async(req,res,next)=>{
        try{

            const {email,password}=req.body
         console.log(req.body)
            const user=await User.findOne({email:email})
            if(user){
                const verified= await  verificationHelper.verifyOtp(user.mobile,password)
                if(verified) return res.redirect('/user-account-details?edit=false')
                else return res.render('user/changePassword',{message:'invalid'})
            }else{
                return res.render('user/changePassword',{message:"something missing"})
            }

            

        }catch(error){
            console.log(error)
            next(error)
            
        }
    }),
    resetUserDetails:asyncHandler(async(req,res,next)=>{
        try{
           
            const userId=req.user.userId

            const {firstName,lastName,mobile,email}=req.body
            console.log(req.body)
               
            const hash=await bcrypt.hash(req.body.password,10)
            const user=await User.findByIdAndUpdate(
                userId,
                {firstName,lastName,mobile,password:hash,email}
            )
            req.flash('message','sucessfuly updated')
            res.redirect('/user-account-details')
        }catch(error){
            console.log(error)
            next(error)
           
        }
    }),
    walletTransaction:asyncHandler(async(req,res,next)=>{
        try{

            const userId=req.user.userId
            console.log(userId)

            const wallet=await User.aggregate([
                {$match:{_id: new ObjectId(userId)}},
                {$unwind:"$WalletTransaction"},
                {$sort:{"WalletTransaction.date":-1}},
                {$project:{WalletTransaction:1,Wallet:1}}
            ])
            let amount=await User.findById(userId)
            console.log("am here")

            console.log(wallet)
            res.render('user/walletTransaction',{
                user:req.user,
                wallet,
                amount

            })
        }catch(error){
            console.log(error)
            next(error)
            
        }
    }),
    addToWishlist:asyncHandler(async(req,res,next)=>{
        try{

            let proId=req.body.ProId
            let userId=req.user.userId
            console.log(proId)

            let findWishlist=await WishList.findOne({user:new ObjectId(userId)})
            //    console.log(findWishlist.wishList)
            if(findWishlist){
                let productExists=findWishlist.wishList.findIndex(
                    (wishlist) =>wishlist.productId ==  proId
                )
                console.log('ooooooooooooooooooooooooooooooooooooooooo')
                console.log(productExists)

                if(productExists != -1){
                    // this item in wish list
                    res.json({status:false,message:"exist product"})
                }else{
                    await WishList.updateOne(
                        {user:new ObjectId(userId)},
                        {
                            $push:{
                                wishList:{productId:new ObjectId(proId)}
                            }
                        }
                    )
                    res.json({status:true,message:'added succecssfuly'})
                }

            }else{
                let wishListData={
                    user:new ObjectId(userId),
                    wishList:[{productId:new ObjectId(proId)}]
                }

                let newWishList=new  WishList(wishListData)
                newWishList.save()
                res.json({status:true,message:'added succecssfuly'})
            }


        }catch(error){
            next(error)
        }
    }),
    getWishList:asyncHandler(async(req,res,next)=>{
        try{
            let userId=req.user.userId

            // get the  wishlist count
            let wishlistcount=0;
            let cartlengths
            let userWishList=await WishList.findOne({user:userId})
           
             if(userWishList){
                wishlistcount=userWishList.wishList.length
             }

             const carts=await Cart.findOne({userId:userId})
             if(carts){
                if(carts.cartItems){
                    cartlengths=carts.cartItems.length
                }else{
                    cartlengths=0
                }
            }else{
                cartlengths=0
            }



             // get    products   from   wishList
             let getWishList=await WishList.aggregate([
                {
                    $match:{
                        user:new ObjectId(userId)
                    }
                },
                {
                    $unwind:"$wishList",
                }
                ,{
                    $project:{
                        productId:"$wishList.productId",
                        createdAt:"$wishList.createdAt"
                    }
                }
                ,{
                    $lookup:{
                        from:"products",
                        localField:"productId",
                        foreignField:"_id",
                        as:"wishListed"
                    }

                },
                {
                    $project:{
                        productId:1,
                        createdAt:1,
                        wishListed:{$arrayElemAt:["$wishListed",0]}
                    }
                }
             ])
             console.log('p666666666666666666666666666666666qqqqqqqqqqqqqqqqqq')
             console.log(getWishList)
             console.log("9oooooooooooooooooooooooooooooooo")
             console.log(wishlistcount)
             res.render('user/wish-List',{getWishList,wishlistcount,user:req.user,cartlengths})


        }catch(error){
            next(error)
        }
    }),
    removeProductWishlist:asyncHandler(async(req,res,next)=>{
        try{
            const userId=req.user.userId
            const proId=req.body.proId

            let updateWishList=await WishList.updateOne(
                {user:userId},
                {
                    $pull:{wishList:{productId:proId}}
                }
            )
            res.json({status:true,message:"succesfuly Updated"})



        }catch(error){
            next(error)
        }
    })
}


