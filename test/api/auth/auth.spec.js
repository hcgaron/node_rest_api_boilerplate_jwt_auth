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
afterAll(async () => {
  await dbHandler.closeDatabase();
});

const createUser = async (userInfo) => {
  try {
    const res = await request(app)
      .post("/api/v1/users")
      .send(userInfo)
      .set("Content-Type", "application/json")
      .set("Accept", "application/json")
      .expect(201);
    return res;
  } catch (error) {
    console.log(error);
    throw new Error("Error creating user");
  }
};

const loginUser = async (credentials) => {
  try {
    const res = request(app)
      .post("/api/v1/users/login")
      .send(credentials)
      .set("Content-Type", "application/json")
      .set("Accept", "application/json")
      .expect(200);
    return res;
  } catch (error) {
    console.log(error);
    throw new Error("Error loggin in user");
  }
};

const stringifyUserSignup = (name, email, password) => {
  return JSON.stringify({ name, email, password });
};

describe("auth middleware", function () {
  it("should create a new user", async function (done) {
    const jsonUser = JSON.stringify({
      name: "aTestUser",
      email: "aTestEmail@email.com",
      password: "aTestPassword",
    });

    const res = await createUser(jsonUser);
    expect(res.status).to.be.equal(201);
    done();
  });

  it("should log in a user and return a token", async function (done) {
    const email = "test@email.com";
    const password = "aTestPassword";

    const newUser = JSON.stringify({
      name: "testuser",
      email,
      password,
    });

    const res = await createUser(newUser);

    const credentials = {
      email: res.body.data.newUser.email,
      password,
    };

    const loginRes = await loginUser(credentials);
    expect(Object.keys(loginRes.body.data)).to.contain("token");
    done();
  });

  it("should get the logged in user authenticated with token", async function (done) {
    const email = "moose@moose.com";
    const password = "mooseDog7";

    const newUser = stringifyUserSignup("moose", email, password);

    const res = await createUser(newUser);
    const credentials = {
      email: res.body.data.newUser.email,
      password,
    };

    const loginRes = await loginUser(credentials);
    expect(Object.keys(loginRes.body.data)).to.contain("token");

    const authenticateRes = await request(app)
      .get("/api/v1/users/me")
      .set("Content-Type", "application/json")
      .set("Accept", "application/json")
      .set("Authorization", `Bearer ${loginRes.body.data.token}`);

    expect(authenticateRes.body.data.email).to.be.equal(email);
    done();
  });

  it("should get a user by id if that is the logged in users id", async function (done) {
    const email = "delilah@moose.com";
    const password = "delilahDog7";

    const newUser = stringifyUserSignup("delilah", email, password);

    const res = await createUser(newUser);
    const credentials = {
      email: res.body.data.newUser.email,
      password,
    };

    const loginRes = await loginUser(credentials);
    expect(Object.keys(loginRes.body.data)).to.contain("token");

    const token = loginRes.body.data.token;
    const validID = loginRes.body.data.user._id;

    const authenticateRes = await request(app)
      .get(`/api/v1/users/${validID}`)
      .set("Content-Type", "application/json")
      .set("Accept", "application/json")
      .set("Authorization", `Bearer ${token}`);

    expect(authenticateRes.body.data.email).to.be.equal(email);
    done();
  });

  it("should not return a user by ID if that id is not the current user id", async function (done) {
    const email = "delilah@moose.com";
    const password = "delilahDog7";
    const newUser = stringifyUserSignup("delilah", email, password);

    const res = await createUser(newUser);
    const credentials = {
      email: res.body.data.newUser.email,
      password,
    };

    const loginRes = await loginUser(credentials);
    expect(Object.keys(loginRes.body.data)).to.contain("token");

    const token = loginRes.body.data.token;
    const invalidID = "5ea9b49b6e618168495e3bc8";

    const authenticateRes = await request(app)
      .get(`/api/v1/users/${invalidID}`)
      .set("Content-Type", "application/json")
      .set("Accept", "application/json")
      .set("Authorization", `Bearer ${token}`);

    expect(authenticateRes.status).to.be.equal(404);
    expect(authenticateRes.body.description).to.be.equal(
      "No users found in the system"
    );
    done();
  });

  it("should log out a user and remove token from their tokens array", async function (done) {
    const email = "delilah@moose.com";
    const password = "delilahDog7";

    const newUser = stringifyUserSignup("delilah", email, password);

    const res = await createUser(newUser);
    const credentials = {
      email: res.body.data.newUser.email,
      password,
    };

    const loginRes = await loginUser(credentials);
    expect(Object.keys(loginRes.body.data)).to.contain("token");

    const token = loginRes.body.data.token;

    expect(
      loginRes.body.data.user.tokens.filter((tk) => tk.token === token)[0].token
    ).to.contain(token);

    const logoutRes = await request(app)
      .post(`/api/v1/users/me/logout`)
      .set("Content-Type", "application/json")
      .set("Accept", "application/json")
      .set("Authorization", `Bearer ${token}`);

    expect(logoutRes.body.description).to.be.equal("log out successful");

    // log user in again and check their tokens doesn't contain the previous token
    const loginResTwo = await loginUser(credentials);
    expect(
      loginResTwo.body.data.user.tokens
        .filter((tk) => tk.token === token)
        .join("")
    ).to.not.contain(token);

    done();
  });

  it("should log out user from all logged in devices", async function (done) {
    const email = "delilah@moose.com";
    const password = "delilahDog7";

    const newUser = stringifyUserSignup("delilah", email, password);

    // log into 5 devices
    let NUM_DEVICES = 5;
    let token;
    let credentials;
    for (let index = 0; index < NUM_DEVICES; index++) {
      if (index === 0) {
        const res = await createUser(newUser);
        credentials = {
          email: res.body.data.newUser.email,
          password,
        };
      } else {
        const loginRes = await loginUser(credentials);
        expect(Object.keys(loginRes.body.data)).to.contain("token");
        if (index === NUM_DEVICES - 1) {
          token = loginRes.body.data.token;
        }
      }
    }

    // confirm there are 5 tokens associated to this user
    const authenticateRes = await request(app)
      .get("/api/v1/users/me")
      .set("Content-Type", "application/json")
      .set("Accept", "application/json")
      .set("Authorization", `Bearer ${token}`);

    expect(authenticateRes.body.data.tokens.length).to.be.equal(NUM_DEVICES);

    const logoutAllRes = await request(app)
      .post("/api/v1/users/me/logoutall")
      .set("Content-Type", "application/json")
      .set("Accept", "application/json")
      .set("Authorization", `Bearer ${token}`);

    // console.log(logoutAllRes.);
    expect(logoutAllRes.status).to.be.equal(200);

    // log back in and make sure there's only one token
    const loginRes = await loginUser(credentials);
    const newToken = loginRes.body.data.token;
    const authenticateResTwo = await request(app)
      .get("/api/v1/users/me")
      .set("Content-Type", "application/json")
      .set("Accept", "application/json")
      .set("Authorization", `Bearer ${newToken}`);
    expect(authenticateResTwo.body.data.tokens.length).to.be.equal(1);
    done();
  });
});
