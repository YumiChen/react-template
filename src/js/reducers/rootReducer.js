import reducers from "./reducers";
import { combineReducers } from "redux";

const rootReducer = combineReducers({
    lastAction: reducers.lastAction,
    loading: reducers.loading
  });

  module.exports = rootReducer;