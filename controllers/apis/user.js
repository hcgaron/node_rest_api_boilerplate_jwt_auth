const express = require("express");
const auth = require("../../middleware/auth");
const userService = require("../../services/users/user");
let router = express.Router();

// router.get("/", userService.getUsers);

router.get("/me", auth, userService.getLoggedInUser);

router.get("/:id", auth, userService.getUserById);

router.post("/", userService.createUser);

router.post("/login", userService.loginUser);

router.post("/me/logout", auth, userService.logoutUser);

router.post("/me/logoutall", auth, userService.logoutAll);

router.put("/:id", auth, userService.updateUser);

router.delete("/:id", auth, userService.deleteUser);

module.exports = router;
