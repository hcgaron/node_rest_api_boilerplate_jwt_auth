const assert = require("assert");
const dbHandler = require("../../db/db-handler");
const { expect } = require("chai");
const chaiHttp = require("chai-http");
const request = require("supertest");

const app = require("../../../server");
const auth = require("../../../middleware/auth");

/*
 * Connect to a new in-memory database before running any tests.
 */
beforeAll(async () => await dbHandler.connect());

/*
 * Clear all test data after every test.
 */
afterEach(async () => await dbHandler.clearDatabase());

/*
 * Remove and close the db and server.
 */
afterAll(async () => await dbHandler.closeDatabase());

describe("auth middleware", function () {
  it("should create a new user", function (done) {
    // TODO
    const jsonUser = JSON.stringify({
      name: "aTestUser",
      email: "aTestEmail@email.com",
      password: "aTestPassword@password.com",
    });

    request(app)
      .post("/api/v1/users")
      .send(jsonUser)
      .set("Content-Type", "application/json")
      .set("Accept", "application/json")
      .expect(201)
      .end(function (err, res) {
        if (err) throw err;
        console.log(res.body);
        done();
      });
  });

  // it("should log in a user and return a token", function () {
  //   // TODO
  // });
});
