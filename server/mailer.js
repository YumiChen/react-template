var nodemailer = require("nodemailer");
const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('./models/User');

// _id, email
function tokenThatExpires(user) {
  const timestamp = new Date().getTime();
  return jwt.sign({ sub: user._id, iat: timestamp }, config.secret,{
    expiresIn: '1m'
  });
}

// email
exports.sendForgetPasswordEmail = function(req,res){
  var email = req.body.email;
      console.log(email);

  try{
  User.findOne({email: email, valid: true},null,function(err,user){
    console.log(user);
    if(err) throw err;

    if(!user){
      console.log("resetPass: no user using this email");
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify({ success: false, err: "wrongEmail"}));
      return;
    }else{

      var url = config.server + "reset/" + tokenThatExpires(user),
      mailOptions = {
        from: config.mail.user,
        to: email,
        subject: "ChatChat - 密碼重設",
        html: "<p>您好:</p><p>您的帳號為 <b>"+ user._id +"</b></p><p>請點擊以下連結重設您的密碼:</p><a href='"+url+"'>"+url+"</a>"
      };
      
      var transporter = nodemailer.createTransport({
        service: config.mail.service,
        auth: {
          type: 'OAuth2',
          user: config.mail.user,
          clientId: config.mail.clientId,
          clientSecret: config.mail.clientSecret,
          refreshToken: config.mail.refreshToken
        }
      });
    
      transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.log(error);
          res.send(JSON.stringify({ success: false}));
        } else {
          console.log('Email sent: ' + info.response);
          res.send("Email is successfully sent.");
        }
      });
    
      transporter.close();

      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify({ success: true }));
    }
  });
  
  }catch(err){
    console.log(err);
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({ success: false }));
  }
};

// _id, password
exports.sendResetPasswordMail = function(req,res){
  var _id = req.body._id,
      password = req.body.password;
      console.log(_id);
      console.log(password);
  try{
  User.findOne({_id: _id, valid: true},null,function(err,user){
    console.log(user);
    if(err) throw err;

    if(!user){
      console.log("resetPass: no such user");
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify({ success: false}));
      return;
    }else{
      // compare password
      user.comparePassword(password, function(err, isMatch) {
        if (err) { throw err; }
        if (!isMatch) { 
          console.log("wrongPassword");
          res.setHeader('Content-Type', 'application/json');
          res.send(JSON.stringify({ success: false, err: "wrongPassword" }));
        }else{
          var url = config.server + "reset/" + tokenThatExpires(user),
          mailOptions = {
            from: config.mail.user,
            to: user.email,
            subject: "ChatChat - 密碼重設",
            html: "<p>您好:</p><p>請點擊以下連結重設您的密碼:</p><a href='"+url+"'>"+url+"</a>"
          };
          
          var transporter = nodemailer.createTransport({
            service: config.mail.service,
            auth: {
              type: 'OAuth2',
              user: config.mail.user,
              clientId: config.mail.clientId,
              clientSecret: config.mail.clientSecret,
              refreshToken: config.mail.refreshToken
            }
          });
        
          transporter.sendMail(mailOptions, function(error, info){
            if (error) {
              console.log(error);
              res.send(JSON.stringify({ success: false}));
            } else {
              console.log('Email sent: ' + info.response);
              res.send("Email is successfully sent.");
            }
          });
        
          transporter.close();
    
          res.setHeader('Content-Type', 'application/json');
          res.send(JSON.stringify({ success: true }));
        }
      });
      
    }
  });
  }catch(err){
    console.log(err);
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({ success: false }));
  }
}

exports.sendConfirmationMail = function(_id, email){
    var url = config.server + "confirmation/" + jwt.sign({ sub: _id, iat: new Date().getTime() }, config.secret,{
      expiresIn: "1m"
    }),
    mailOptions = {
      from: config.mail.user,
      to: email,
      subject: "ChatChat - 信箱驗證",
      html: "<p>您好:</p><p>請點擊以下連結驗證信箱:</p><a href='"+url+"'>"+url+"</a>"
    };
    
    var transporter = nodemailer.createTransport({
      service: config.mail.service,
      auth: {
        type: 'OAuth2',
        user: config.mail.user,
        clientId: config.mail.clientId,
        clientSecret: config.mail.clientSecret,
        refreshToken: config.mail.refreshToken
      }
    });
  
    transporter.sendMail(mailOptions, function(error, info){
      if (error) {
        console.log(error);
        throw error;
      } else {
        console.log('Email sent: ' + info.response);
      }
    });
  
    transporter.close();
}

exports.resendConfirmationMail = function(req, res){
  try{
    var token = req.params.token,
        _id, email;
        
      jwt.verify(token,config.secret,function(err, decoded){
        if(err) throw err;
        _id = decoded.sub;
        console.log(decoded);
      });

      console.log(_id);

      User.findOne({_id: _id, valid: true},null,function(err,user){
        if(err) throw err;
        if(!user){
          res.setHeader('Content-Type', 'application/json');
          res.send(JSON.stringify({ success: false }));
          return;
        }
        email = user.email;

        console.log(user);

        var url = config.server + "confirmation/" + tokenThatExpires(user),
        mailOptions = {
          from: config.mail.user,
          to: email,
          subject: "ChatChat - 信箱驗證",
          html: "<p>您好:</p><p>請點擊以下連結驗證信箱:</p><a href='"+url+"'>"+url+"</a>"
        };
        
        var transporter = nodemailer.createTransport({
          service: config.mail.service,
          auth: {
            type: 'OAuth2',
            user: config.mail.user,
            clientId: config.mail.clientId,
            clientSecret: config.mail.clientSecret,
            refreshToken: config.mail.refreshToken
          }
        });
      
        transporter.sendMail(mailOptions, function(error, info){
          if (error) {
            console.log(error);
            res.send(JSON.stringify({ success: false}));
          } else {
            console.log('Email sent: ' + info.response);
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify({ success: true }));
          }
        });
      
        transporter.close();
    
      });

    }catch(err){
      console.log(err);
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify({ success: false }));
    }
  }