import redux from "redux";

const reducers = {
    loading:
    (state=false, action)=>{
      if(action.type == "LOADSTART" || action.type == "LOADEND"){
        return action.payload;
      }else{
        return state;
      }
    },
    lastAction:
    (state = null, action)=>{
      return action.type;
    }
  };

  module.exports = reducers;