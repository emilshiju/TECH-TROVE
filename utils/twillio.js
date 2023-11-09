// import Twilio from 'twilio';
import Twilio from 'twilio'; 
import dotenv from 'dotenv';
dotenv.config()

const TWILIOSID= process.env.TWILIO_SID   // Your Twilio Account SID
const TWILIOTOKEN= process.env.TWILIO_AUTH_TOKEN  // Your Twilio Auth Token

  const verifyServiceSid = process.env.TWILIO_VERIFY;

  const client=Twilio(TWILIOSID,TWILIOTOKEN)
const sendOtp=async (phone)=>{
    try {
		const verification=await client.verify.v2.services(verifyServiceSid).verifications.create({
            to: `+91${phone}`,
            channel: 'whatsapp', // You can use 'sms' or 'call' depending on how you want to send the verification code.
        })
        .then(verification=>console.log(verification.status))


  

	} catch (error) {
        console.log(error)
		throw new Error(error.message)
	}
}
 const verifyOtp=async (phone,otpCode)=>{
    try{
         const verification =await client.verify.v2.services(verifyServiceSid).verificationChecks.create({
            to:`+91${phone}`,
            code:otpCode,
         })

         if(verification.status === 'approved'){
            console.log("verification success")
            return true
         }else{
            return false
         }
    }catch(error){
          console.log(error)
    }
 }


 export default{sendOtp,verifyOtp}


