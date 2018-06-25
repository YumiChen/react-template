const express = require('express');
const router = express.Router();
const User = require("./models/User");
const Room = require("./models/Room");
const ObjectId = require('mongoose').Types.ObjectId
const passportService = require("./passport");
const nodemailer = require("nodemailer");
const mailer = require("./mailer");
const passport = require('passport');
// send index page
router.get("/" , function(req,res){
  res.sendfile('index.html', {root: './public'});
});

router.get("/404" , function(req,res){
  res.sendfile('404.html', {root: './public'});
});

/*- USER -*/

// delete user
// id, password
router.post("/user/delete", passportService.authenticate,function(req,res){
    try{
      User.findOne({_id: req.query._id, valid: true, confirmed: true}, null, function(err, user) {
        if (err) throw err;
        // check password
        if(!user){
          res.setHeader('Content-Type', 'application/json');
          res.send(JSON.stringify({ success: false }));
          return;
        }
        // check password
        user.comparePassword(req.query.password, function(err, isMatch) {
          if (err) { throw err; }
          if (!isMatch) { 
            res.setHeader('Content-Type', 'application/json');
            console.log("wrong password");
            res.send(JSON.stringify({ success: false, err: "wrongPassword" }));
            return;
          }else{
            User.findOneAndUpdate({_id: user._id}, {$set: {valid: false}},{new: true},function(err,user){
              if(err) throw err;
              // remove user from room
              for(var i = 0;i<user.rooms.length;i++){
                Room.findOneAndUpdate({_id: new ObjectId(user.rooms[i]._id)}, {$pull: {members:{_id:user._id,name:user.name}}},null, function(err, resp) {
                  if (err) throw err;
                    if(!resp){
                      res.setHeader('Content-Type', 'application/json');
                      res.send(JSON.stringify({ success: false }));
                      return;
                    }
                  });
              };
              res.setHeader('Content-Type', 'application/json');
              res.send(JSON.stringify({ success: true }));
            });
          }
        });

      });
    }
    catch(err){
      console.log(err);
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify({ success: false }));
    }
});

// search user
// term
router.get("/user/search", passportService.authenticate,function(req,res){
  var term = req.query.term, reg = new RegExp(term, 'i')
  try{
    User.find({ $and: [ {$or:[{ _id:{$regex: reg}}, {name: {$regex: reg}}]} , {_id: {$not: /System/}} ] },{name: true}).sort().limit(10).exec(function(err, result) {
      if(err) throw err;
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify({ success: true, result: result }));
    });
  }catch(err){
    console.log(err);
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({ success: false }));
  }
});

/* ROOM */
// create room
// param: name, userId, userName
// return objectId
router.get("/room/insert", passportService.authenticate,function(req,res){
  // founder of room would be automatically added to room members
  var userId = req.query.userId,
      userName = req.query.userName,
      name = req.query.roomName,
      _id;

    var newRoom = new Room({
      name: name,
      members:[{_id:userId,name:userName}],
      log: [{_id:"System", name: "newUser", msg: userId}],
      valid: true
    }), result;

    try{
      // insert into room collection
      newRoom.save(function(err, resp) {
        if(err) throw err;
        if(resp === undefined){
          res.setHeader('Content-Type', 'application/json');
          res.send(JSON.stringify({ success: false }));
          return;
        }
        // modify user data
        result = resp;
        _id = resp._id;

        User.findOneAndUpdate({
          _id:  userId
        },
        {$push: {'rooms':{_id: _id, name: name}}},
        null,
        function(err, resp) {
          if (err) throw err;
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify({ success: true, result: result }));
        });
      });
    }
    catch(err){
      console.log(err);
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify({ success: false }));
    }
  
});

// find one room
router.get("/room/findOne", passportService.authenticate,function(req,res){
  // only query valid documents
  req.query.valid = true;
  
    try{
      Room.findOne({_id: new ObjectId(req.query._id), valid: true}, null,function(err, result) {
        if (err) throw err;
        console.log(result);
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({ success: true, result: result }));
      });
    }
    catch(err){
      console.log(err);
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify({ success: false }));
    }
  
});

/*-----      UPDATE      -----*/

// add log
// param: roomId, userId, userName, msg
router.get("/room/addLog", passportService.authenticate,function(req,res){
    var msg = req.query.msg, roomId = req.query.roomId,
        userId = req.query.userId,
        name = req.query.userName;
    try{
      Room.findOneAndUpdate({_id: new ObjectId(roomId)}, {$addToSet: {log:{_id: userId, name: name, msg:msg}}}, null, function(err, resp) {
        if (err) throw err;
          res.setHeader('Content-Type', 'application/json');
          res.send(JSON.stringify({ success: true }));

      });
    }
    catch(err){
      console.log(err);
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify({ success: false }));
    }
});

// update username
// param: id, name
router.get("/user/updateName", passportService.authenticate,function(req,res){
  // valid should not be set through this api
  req.query.valid = true;

    try{
      var _id = req.query._id,
          name = req.query.name,
          result = {};
      User.findOneAndUpdate({_id: _id}, {$set: {name: name}}, {new : true}, function(err, resp) {
        result._id = _id;
        result.name = resp.name;
        result.rooms = resp.rooms;
        if (err) throw err;
        Room.update({'members._id': _id,}, {$set: {'members.$.name': name}},{multi: true}, function(err, resp) {
          if (err) throw err;
          console.log(resp);
          Room.find({'log._id': _id},function(err, resp) {
            resp.forEach(function(room){
              room.log.forEach(function(log){
                if(log._id == _id) log.name = name;
              })
              room.save(function(err){ if(err) throw err});
            });
            // return user data;
              res.setHeader('Content-Type', 'application/json');
              res.send(JSON.stringify({ success: true , result: result}));
          });
        });
      });
    }
    catch(err){
      console.log(err);
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify({ success: false }));
    }
});



// if password is correct, pass in user id and room id, add user to room
// param: userId, userName, password
router.get("/user/addToRoom", passportService.authenticate,function(req,res){
    var userId = req.query.userId,
        password = req.query.password;
    try{
      var room = Room.findOne({_id: new ObjectId(password), valid: true}, null, function(err,room){
        if(!room) throw err; // password is wrong, no corresponding room exists
              User.findOneAndUpdate({_id: userId}, {$addToSet: {rooms:{_id:room._id,name:room.name}}}, {new: true}, function(err, user) {
                if (err) throw err;
                if(!user){
                  res.setHeader('Content-Type', 'application/json');
                  res.send(JSON.stringify({ success: false, err: "noExistedUser"}));
                }else{
                  Room.findOneAndUpdate({_id: new ObjectId(password)}, {$addToSet: {members:{_id:userId,name:user.name}}}, null, function(err, resp) {
                    if (err) throw err;
                    // 順便推播有新成員加入
                    resp.log.push({_id: "System", name: "newUser", msg: userId});
                    resp.save(function(err, resp){
                      if(err) throw err;
                      res.setHeader('Content-Type', 'application/json');
                      res.send(JSON.stringify({ success: true, result: resp }));
                    });
                  });
                }
              });
      });
    }
    catch(err){
      console.log(err);
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify({ success: false }));
    }
});


// pass in room id and user id, remove user from room
// userId, userName, roomId, roomName
router.get("/user/leaveRoom",passportService.authenticate,function(req,res){
    var userId = req.query.userId,
        roomId = req.query.roomId,
        userName = req.query.userName,
        roomName = req.query.roomName;
    try{
        // !!!TODO room.valid as false if no members are left in the room
        Room.findOneAndUpdate({_id: new ObjectId(roomId)}, {$pull: {members:{_id:userId,name:userName}}},null, function(err, resp) {
        if (err) throw err;
          User.updateOne({_id: userId}, {$pull: {rooms:{_id: new ObjectId(roomId),name:roomName}}}, null, function(err, resp) {
            // 順便推播有成員離開
            if (err) throw err;
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify({ success: true }));
          });
        });
    }
    catch(err){
      console.log(err);
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify({ success: false }));
    }
});

/* AUTH */
const jwt = require('jsonwebtoken');
const config = require('../config');

function tokenForUser(user,time) {
  const timestamp = new Date().getTime();
  if(time) return jwt.sign({ sub: user._id, iat: timestamp }, config.secret, {
    expiresIn: time
  });
  return jwt.sign({ sub: user._id, iat: timestamp }, config.secret);
}

// create user
// id(email), name
router.post("/user/insert",function(req,res){
  try{
    var newUser = new User({
      _id: req.body._id,
      email: req.body.email,
      name: req.body._id,
      password: req.body.password,
      rooms: [],
      valid: true
  });
    newUser.isNew = true;
    User.findOne({_id: newUser._id},function(err, user){
    if(err) throw err;
    if(user){
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify({ success: false, err: "idUsed"}));
    }else{
      console.log(newUser.email);
      User.findOne({email: newUser.email, valid: true},function(err,user){
        if(err) throw err;
        console.log(user);
        if(user){
          res.setHeader('Content-Type', 'application/json');
          res.send(JSON.stringify({ success: false, err: "emailRegistered" }));
        }else{
          newUser.save(function(err, resp) {
            if (err) throw err;
            if(resp===undefined){
              res.setHeader('Content-Type', 'application/json');
              res.send(JSON.stringify({ success: false }));
              return;
            }
              // resp.email = null;
              // resp.password = null;

              // res.setHeader('Content-Type', 'application/json');
              // res.send(JSON.stringify({ 
              //   success: true, 
              //   result: resp,
              //   token: tokenForUser(resp)
              //  }));

              mailer.sendConfirmationMail(req.body._id, req.body.email);

              res.setHeader('Content-Type', 'application/json');
              res.send(JSON.stringify({ 
                success: true,
                token: tokenForUser(newUser)
               }));
          });
        }
      });
    }
  });
  }
  catch(err){
    console.log(err);
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({ success: false }));
  }
});

router.post("/user/login",function(req,res){
    var _id = req.body._id,
        password = req.body.password;
    console.log(req.body);
    try{
        // TODO room.valid as false if no members are left in the room
        User.findOne({_id: _id, valid: true}, { name: true, rooms: true , password: true, confirmed: true }, function(err,user){
          // user decript method
          console.log(user);
          if(!user){
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify({ success: false, err: "unexistedUser" }));
            return;
          }
          user.comparePassword(password, function(err, isMatch) {
            if (err) { throw err; }
            if (!isMatch) { 
              console.log("wrongPassword");
              res.setHeader('Content-Type', 'application/json');
              res.send(JSON.stringify({ success: false, err: "wrongPassword" }));
              return;
            }
      
            user.password = null;

            if(user.confirmed === false){
              res.setHeader('Content-Type', 'application/json');
              res.send(JSON.stringify({ 
                success: false ,
                err: "notConfirmed",
                token: tokenForUser(user)
              }));
              return;
            }

            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify({ 
              success: true ,
              result: user,
              token: tokenForUser(user)
            }));
          });
        });
    }
    catch(err){
      console.log(err);
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify({ success: false }));
    }
});


/*----- reset password -----*/
// _id, email
router.get("/reset/:token",function(req,res){
  var token = req.params.token;
  try{
    jwt.verify(token,config.secret,function(err,decoded){
      if(err) throw err; // invalid token
      console.log(decoded);
      User.findById(decoded.sub,function(err,user){
        if(err) throw err;
        console.log(user);
        if(!user){
          res.writeHead(404,
            {Location: '/404'}
          );
          res.end();
        }else{
          console.log("rest page is requested");
          res.sendfile('reset.html', {root: './public'});
        }
      });
    });
  }catch(err){
    res.writeHead(404,
      {Location: '/404'}
    );
    res.end();
  }
});

router.get("/confirmation/:token",function(req,res){
  var token = req.params.token;
  try{
    jwt.verify(token,config.secret,function(err,decoded){
      if(err) throw err; // invalid token
      console.log(decoded);
      User.findOneAndUpdate({_id: decoded.sub, valid: true},{$set: { confirmed: true }},{new : true} ,function(err,user){
        if(err) throw err;
        console.log(user);
        if(!user){
          console.log("no such user");
          res.sendfile('404.html', {root: './public'});
        }else{
            console.log("confirmation success");
            res.writeHead(301,
              {Location: '/'}
            );
            res.end()
        }
      });
    });
  }catch(err){
    res.sendfile('404.html', {root: './public'});
  }
});

// _id, password
router.post("/sendResetPasswordMail",passportService.authenticate,mailer.sendResetPasswordMail);
// email
router.post("/sendForgetPasswordEmail",mailer.sendForgetPasswordEmail);
// token
router.post("/resendConfirmationMail/:token",passportService.authenticate,mailer.resendConfirmationMail);

// _id, password
router.post("/resetPassword",function(req,res){
  var token = req.body.token, 
      password = req.body.password;
  
  try{
  
  jwt.verify(token,config.secret,function(err,decoded){
    if(err) throw err;
    if(!decoded){
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify({ success: false }));
      return;
    }

    User.findById(decoded.sub,function(err,user){
      if(!user){
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({ success: false }));
        return;
      }
      user.password = password;
      user.save(function(err,resp){
        if(err) throw err;
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({ success: true }));
      });
    });
  });
  }catch(err){
    console.log(err);
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({ success: false }));
  }
});


module.exports = router;