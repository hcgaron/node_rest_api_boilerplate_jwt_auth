const _ = require("lodash");
require("dotenv").config(); // environment variables in .env
const env = process.env.NODE_ENV || "local";
const envConfig = require("./" + env);
let defaultConfig = {
  env,
};
module.exports = _.merge(defaultConfig, envConfig);
