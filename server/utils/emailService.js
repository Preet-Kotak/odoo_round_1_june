const {Resend}=require('resend');
const resend=new Resend(process.env.RESEND_API_KEY);

// a generic utility
const sendEmail=async(to,subject,messageContent)=>{
    try{
        const data=await resend.emails.send({
            from:'Auctions <noreply@contact.bidkar.in>',
            to:'krishkanjani86@gmail.com',
            subject:subject,
            message:messageContent
        });
        return data;
    }catch(err){
        console.error('Email utility failed!:',error);
        return null;
    }
};

module.exports={sendEmail};