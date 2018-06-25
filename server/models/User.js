const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt-nodejs');
const config = require("../../config");

mongoose.connect(config.db,
    {
      useMongoClient: true,
      autoIndex: false, // Don't build indexes
      reconnectTries: Number.MAX_VALUE, // Never stop trying to reconnect
      reconnectInterval: 500, // Reconnect every 500ms
      poolSize: 10, // Maintain up to 10 socket connections
      // If not connected, return errors immediately rather than waiting for reconnect
      bufferMaxEntries: 0
    },
  function(err, db) {
    if(!err) {
      console.log("MongoDB connected");
    }else{
        console.log("error:");
        console.log(err);
    }
  }
);

// Define our model
const userSchema = new Schema({
  _id: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true},
  name: {type: String, required: true},
  password: {type: String, required: true},
  rooms: {
    type: [{
        _id: Schema.ObjectId,
        name: String
    }],
    default: []
},
  confirmed: {
    type: Boolean,
    default: false
  },
  valid: {
      type: Boolean,
      default: true
  }
});

// On Save Hook, encrypt password
// Before saving a model, run this function
userSchema.pre('save', function(next) {
  // get access to the user model
  const user = this;

  // generate a salt then run callback
  bcrypt.genSalt(10, function(err, salt) {
    if (err) { return next(err); }

    // hash (encrypt) our password using the salt
    bcrypt.hash(user.password, salt, null, function(err, hash) {
      if (err) { return next(err); }

      // overwrite plain text password with encrypted password
      user.password = hash;
      next();
    });
  });
});

userSchema.methods.comparePassword = function(candidatePassword, callback) {
  bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
    if (err) { return callback(err); }

    callback(null, isMatch);
  });
}

// Create the model class
const ModelClass = mongoose.model('user', userSchema);

// Export the model
module.exports = ModelClass;