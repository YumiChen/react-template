const passport = require('passport');
const User = require('./models/User');
const config = require('../config');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;


// Setup options for JWT Strategy
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme('JWT'),
  secretOrKey: config.secret
};

// Create JWT strategy
const jwtLogin = new JwtStrategy(jwtOptions, function(payload, done) {

  User.findById(payload.sub, function(err, user) {
    console.log(payload);
    if (err) { return done(err, false,{
        error: "internal server error"
      }); 
    }

    if (user) {
      done(null, user);
    } else {
      done(null, false,{
        error: "unauthorized"
      });
    }
  });
});

// Tell passport to use this strategy
passport.use(jwtLogin);

module.exports = {
  initialize: function(){
    return passport.initialize();
  },
  authenticate: passport.authenticate('jwt', { session: false })
};