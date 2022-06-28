const express = require("express");
const app = express();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const bodyParser = require("body-parser");
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const _ = require('lodash');

dotenv.config();

const uvalidation = require('./validations/user.validation');
const cvalidation = require('./validations/category.validation');
const pvalidation = require('./validations/product.validation');
const avalidation = require('./validations/auth.validation');

const transporter = nodemailer.createTransport({
  service: 'outlook',
  auth: {
    user: 'skd08719@outlook.com',
    pass: 'skd24680'
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
      cb(null, 'uploads')
  },
  filename: (req, file, cb) => {
      cb(null, file.fieldname + '-' + Date.now())
  }
});

const upload = multer({ storage: storage });

const saltRounds = 10;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.set("view engine", "ejs");

mongoose.connect("mongodb://localhost:27017/mini", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
    console.log("Connected to the database");
})
.catch(err => {
    console.log("Cannot connected to database",err);
    process.exit();
});

var userSchema = new mongoose.Schema({
  user_id : { type : mongoose.Schema.Types.ObjectId, ref : "product" },
  name : String,
  mobile : Number,
  email: String,
  password: String,
  address : [{
    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    pincode: {
      type: Number,
      required: true,
      trim: true,
    },
    Line1: {
      type: String,
      required: true,
      trim: true,
      min: 10,
      max: 100,
    },
    Line2: {
      type: String,
      required: true,
      trim: true,
      min: 10,
      max: 100,
    },
  }],
  image: {
    data : Buffer,
    contentType : String
  },
  userType : {
    type : String,
    enum : ['admin','consumer'],
    default : 'consumer'
  },
  status : {
    type : Boolean,
    default : true 
  },
  isDeleted : {
    type : Boolean,
    default : false
  },
  isVerified : {
    type : Boolean,
    default : false
  },
  createdBy : String,
});

var categorySchema = new mongoose.Schema({
  name : String,
  image : Buffer,
  status : {
    type : Boolean,
    default : true
  },
  isDeleted : {
    type : Boolean,
    default : false
  },
  createdBy : String,
});

var productSchema = new mongoose.Schema({
  product_id : {
    type : mongoose.Schema.Types.ObjectId , ref : "user"
  },
  name : String,
  category_id : Number,
  price : Number,
  discount : Number,
  description : String,
  quantity : Number,
  size : Number,
  color : String,
  createdBy : String,
  status : {
    type : Boolean,
    default : true
  },
  isDeleted : {
    type : Boolean,
    default : false
  },
});

var authSchema = new mongoose.Schema({
  name : String,
  mobile : Number,
  email: String,
  password: String,
  resetLink : {
    data : String,
    default : ""
  }
});


userSchema.set('timestamps',true);
categorySchema.set('timestamps',true);
authSchema.set('timestamps',true);

const Detail = mongoose.model("user", userSchema);
const Details = mongoose.model("category", categorySchema);
const Detailed = mongoose.model("product",productSchema);
const authenication = mongoose.model("authenication",authSchema);

Detail.findOne({ name : "KLM"} ).
populate('result').
exec(function (err, detail) {
  if (err) return (err);
  console.log('The Product is %s', detail.insertResult.name);
});

app.get("/", (req, res) => {
  res.send("Trying to create a Mini Project using Node.js");
});

app.get("/userTable/:id",(req,res)=>{
  Detail.findById(req.params.id)
  .then(doc => {
    res.send(doc);
  })
  .catch(err => {
    res.send(err);
  });
});

app.get("/category/:id",(req,res)=>{
  Details.findById(req.params.id)
  .then(doc => {
    res.send(doc);
  })
  .catch(err => {
    res.send(err);
  });
});

app.get("/product/:id",(req,res)=>{
  Detailed.findById(req.params.id)
  .then(doc => {
    res.send(doc);
  })
  .catch(err => {
    res.send(err);
  });
});

app.post("/userTable", upload.single('image'), async (req, res) => {
  const { error } = uvalidation.userValidation(req.body);
  if(error)return res.json({
    success : false,
    error: error.details[0].message
  });

  try {
    const hashedPwd = await bcrypt.hash(req.body.password, saltRounds);
    const insertResult = await Detail.create({
      name : req.body.name,
      mobile : req.body.mobile,
      email: req.body.email,
      password: hashedPwd,
      address : [{
        city : req.body.city,
        state : req.body.state,
        pincode : req.body.pincode,
        Line1 : req.body.Line1,
        Line2 : req.body.Line2
      }],
      image: {
        data: fs.readFileSync(path.join(__dirname + '/uploads/' + req.file.filename)),
        contentType: 'image/jpeg'
    },
    });
    insertResult
    .save()
    .then((result)=>{
        sendOTPtoVerifyMail(result,res)
    })
    .catch((err)=>{
      console.log(err);
    })
   
  } catch (error) {
    res.status(500).send("Internal Server error Occured");
  }
});

app.post("/posts", verifyToken, (req,res)=>{
  jwt.verify(req.token,'secretkey',(err, authData)=>{
    if(err){
      res.sendStatus(403);
    }else{
      res.json({
        message : "Post Created ",
        authData
      });
    }
  });
 
});

app.post("/category",(req,res)=>{
    const { error } = cvalidation.categoryValidation(req.body);
    if(error) return res.json({
      success : false,
      error: error.details[0].message
  });

    const result = Details.create({
      name : req.body.name,
      createdBy : req.body.createdBy
    });

    jwt.sign({result}, 'secretkey', { expiresIn : "30s"}, (err,token)=>{
      res.json({
        token
      });
    });
});

app.post("/product",(req,res)=>{
    const { error } = pvalidation.productValidation(req.body);
      if(error) return res.json({
        success : false,
        error: error.details[0].message
    });

    const result = Detailed.create({
      name : req.body.name,
      category_id : req.body.category_id,
      price : req.body.price,
      discount : req.body.discount,
      description : req.body.description,
      quantity : req.body.quantity,
      size : req.body.quantity,
      color : req.body.color,
      createdBy : req.body.createdBy
    });
    res.send(result);
});

app.post("/login", async (req, res) => {
  try {
    const user = await Detail.findOne({ email: req.body.email });
    if (user) {
      const cmp = await bcrypt.compare(req.body.password, user.password);
      if (cmp) {
        res.send("Auth Successful");
      } else {
        res.send("Wrong username or password.");
      }
    } else {
      res.send("Wrong username or password.");
    }
  } catch (error) {
    res.status(500).send("Internal Server error Occured");
  }
});

app.post("/verifyOTP",async(req,res)=>{
  try 
  {
    const { userID,otp} = req.body;
    if(!userID || !otp)
    {
      throw Error("OTP must be entered");
    } 
    else
    {
      const OTPverificationRecords = await otpVerification.find({
        userID,
      });
      if(OTPverificationRecords.length <= 0)
      {
        throw new Error("Account record not exist or user already verified . Please Login");
      }
      else
      {
        const { expiresAt } = OTPverificationRecords[0];
        const hashedOtp = OTPverificationRecords[0].otp;
        if(expiresAt < Date.now())
        {
          await otpVerification.deleteMany({userID});
          throw new Error("Code has expired . Please Request again");
        } 
        else 
        {
          const validOTP = await bcrypt.compare(otp,hashedOtp)
          if(!validOTP)
          {
            throw new Error("Invalid OTP . Check Once Again");
          } 
          else 
          {
            await Detail.updateOne({ _id : userID }, { isVerified : true});
            await otpVerification.deleteMany({ userID });
            res.json({
              status : "Verified",
              message : "User Email id is verified",
            });
          }
        }
      }
    }
  } 
  catch (error) 
  {
    res.json({
      status : "Failed",
      message : error.message,
    });
  }
});

app.post("/resendOTPCode", async(req,res)=>{
  try 
  {
    const { userID,email } = req.body;
    if(!userID || !email)
    {
      throw Error("userID is not availale");
    } 
    else
    {
      await otpVerification.deleteMany({userID});
      sendOTPtoVerifyMail({ _id:userID,email },res);
    }  
  } 
  catch (error) 
  {
    res.json({
      status : "Failed",
      message : error.message
    });
  }
});

app.patch("/userTable/:id",(req,res)=>{
  Detail.findByIdAndUpdate(req.params.id,req.body,{new: true})
  .then(doc =>{
    if (!doc) {
      return res.status(404).send();
  }
  res.send(doc);
  })
  .catch(err => {
    res.send(err);
  });
});

app.patch("/category/:id",(req,res)=>{
  Details.findByIdAndUpdate(req.params.id,req.body,{new: true})
  .then(doc =>{
    if (!doc) {
      return res.status(404).send();
  }
  res.send(doc);
  })
  .catch(err => {
    res.send(err);
  });
});

app.patch("/product/:id",(req,res)=>{
  Detailed.findByIdAndUpdate(req.params.id,req.body,{new: true})
  .then(doc =>{
    if (!doc) {
      return res.status(404).send();
  }
  res.send(doc);
  })
  .catch(err => {
    res.send(err);
  });
});

app.delete("/userTable/:id",(req,res)=>{
  Detail.findByIdAndDelete(req.params.id)
  .then(doc =>{
    if (!doc) {
      return res.status(404).send();
  }
  res.send(doc);
  })
  .catch(err => {
    res.send(err);
  });
});

app.delete("/category/:id",(req,res)=>{
  Details.findByIdAndDelete(req.params.id)
  .then(doc =>{
    if (!doc) {
      return res.status(404).send();
  }
  res.send(doc);
  })
  .catch(err => {
    res.send(err);
  });
});

app.delete("/product/:id",(req,res)=>{
  Detailed.findByIdAndDelete(req.params.id)
  .then(doc =>{
    if (!doc) {
      return res.status(404).send();
  }
  res.send(doc);
  })
  .catch(err => {
    res.send(err);
  });
});

app.listen(8000, () => {
  console.log("Server started at port 8000");
});

const otpVerification = require('./models/OTPverification');


app.post("/auth",async(req,res)=>{
  const { error } = avalidation.authValidation(req.body);
  if(error) return res.json({
    success : false,
    error: error.details[0].message
});

  const hashedPwd = await bcrypt.hash(req.body.password, saltRounds);
  const insertResult = await authenication.create({
    name : req.body.name,
    mobile : req.body.mobile,
    email: req.body.email,
    password: hashedPwd,
  });

  jwt.sign({insertResult}, 'secretkey', { expiresIn : "1h"}, (err,token)=>{
    res.json({
      token
    });
  });
});

app.post("/authPost", verifyToken, (req,res)=>{
  jwt.verify(req.token,'secretkey',(err, authData)=>{
    if(err){
      res.sendStatus(403);
    }else{
      res.json({
        message : "Post Created ",
        authData
      });
    }
  });
});

app.put("/forgotPassword",(req,res)=>{
  const { email } = req.body;
  authenication.findOne({email}, (err,user)=>{
    if(err || !user){
      return res.status(400).json({message : "User with email id does not exists"})
    }
    const token = jwt.sign({_id : user._id}, process.env.RESET_PASSWORD_KEY, { expiresIn : "20m"}); 
    const mailOptions = {
      from: 'skd08719@outlook.com',
      to: email,
      subject: 'Sending Email to Reset your Password',
      html : `<h2>Please click on given link to reset your password</h2>
              <p>${process.env.CLIENT_URL}/resetPassword/${token} </p>`
    }
    return user.updateOne({resetLink : token},(err, success) => {
      if(err){
        return res.status(400).json({message : "Reset Link Error"})
      }else{
        transporter.sendMail(mailOptions);
        res.json({
        status : "PENDING",
        message : "Reset Password Link mail Sent",
    });
      }
    });
  });
});

app.put("/resetPassword",(req,res)=>{
  const { resetLink , newPass } = req.body;
  if(resetLink){
    jwt.verify(resetLink, process.env.RESET_PASSWORD_KEY, (err,decodedData)=>{
      if(err){
       return res.status(401).json({ error : "Invalid Token or token is expired" });
      }
      authenication.findOne({resetLink}, (err,user)=>{
        if(err || !user){
          return res.status(400).json({message : "User with token does not exist"});
        }
        const obj = {
          password : newPass,
          resetLink : ""
        }
        user = _.extend(user,obj);
        user.save((err, result) => {
          if(err){
            return res.status(400).json({message : "Reset Password Error"});
          }else{
            return res.status(400).json({message : "Your password changed Successfully"});
      }
      });
    });
    });
  }
  else{
    return res.status(400).json({message : "Authenication Error"});
  }
});

const sendOTPtoVerifyMail = async({_id,email},res) =>{
  try {
    const otp = `${Math.floor(1000 + Math.random() * 9000)}`;

    var mailOptions = {
      from: 'skd08719@outlook.com',
      to: 'sivakumard3333@gmail.com',
      subject: 'Sending Email for Verification',
      html : `<p>Enter <b>${otp}</b> in your app and verify your email and complete the process</P>
              <p>OTP Express in <b>60 Minutes</b></p> 
              <p>Please Verify whether You or not</p>`
    }
    //hash the OTP
    const saltRounds = 10;
    const hashedOtp = await bcrypt.hash(otp,saltRounds);

    const newOtpVerification = await new otpVerification({
      userID : _id,
      otp : hashedOtp,
      createdAt : Date.now(),
      expiresAt : Date.now() + 3600000,
    });

    await newOtpVerification.save();

    await transporter.sendMail(mailOptions);
    res.json({
      status : "PENDING",
      message : "Verification OTP mail Sent",
      data : {
        userID : _id,
        email,
      }
    });
    
  } catch (error) {
    res.json({
      status : "FAILED",
      message : error.message,
    });
  }
};

//Token Format : Authorization : Bearer <access:token>

function verifyToken(req, res, next){
  //Get the auth Head value
  const bearerHeader = req.headers['authorization'];
  if(typeof bearerHeader !== 'undefined')
  {
    //split spaces
    const bearer = bearerHeader.split(' ');
    //Get token from array
    const bearerToken = bearer[1];
    //Set the token
    req.token = bearerToken;
    //Next middleware
    next();
  }
  else
  {
    res.sendStatus(403);
  }
}