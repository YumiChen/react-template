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
const roomSchema = new Schema({
  name: {
      type: String,
      required: true
  },
  members: {
      type: [{
          _id: String,
          name: String
      }]
  },
  log: {
    type: [{
        _id: String,
        name: String,
        msg: String,
        time: {
             type: Date, 
             default: Date.now,
             required: true
        }
    }],
    default: []
  },
  valid: {
      type: Boolean,
      default: true
  }
});

// Create the model class
const ModelClass = mongoose.model('room', roomSchema);

// Export the model
module.exports = ModelClass;