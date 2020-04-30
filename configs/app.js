// server configuration
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

module.exports = function () {
  let server = express();

  let create = (config, db) => {
    let routes = require("../routes"); // routes/index.js
    // set all server settings
    server.set("env", config.env);
    server.set("port", config.port);
    server.set("hostname", config.hostname);

    // add middleware to parse the json
    server.use(bodyParser.json());
    server.use(
      bodyParser.urlencoded({
        extended: false,
      })
    );

    // connect the database
    mongoose.connect(db.database, {
      useNewUrlParser: true,
      useCreateIndex: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
    });

    // set up routes
    routes.init(server);
  };

  start = () => {
    let hostname = server.get("hostname");
    let port = server.get("port");
    return server.listen(port, () => {
      console.log(
        "Express server listening on - http://" + hostname + ":" + port
      );
    });
  };

  return {
    create,
    start,
  };
};
