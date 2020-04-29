const express = require("express");
const User = require("../../models/user");

// deprecated in production for normal users.  Perhaps for admin its useful
const getUsers = async (req, res, next) => {
  try {
    let users = await User.find({});

    if (users.length > 0) {
      return res.status(200).json({
        message: "users fetched successfully",
        data: users,
      });
    }

    return res.status(404).json({
      code: "BAD_REQUEST_ERROR",
      description: "No users found in the system",
    });
  } catch (error) {
    return res.status(500).json({
      code: "SERVER_ERROR",
      description: "Something went wrong; please try again.",
    });
  }
};

const getUserById = async (req, res, next) => {
  try {
    let user = await User.findById(req.params.id);
    if (user) {
      return res.status(200).json({
        message: `user with id ${req.params.id} fetched successfully`,
        data: user,
      });
    }

    return res.status(404).json({
      code: "BAD_REQUEST_ERROR",
      description: "No users found in the system",
    });
  } catch (error) {
    return res.status(500).json({
      code: "SERVER_ERROR",
      description: "Something went wrong; please try again.",
    });
  }
};

const getLoggedInUser = async (req, res, next) => {
  // View logged in uesr profile (auth has already been run)
  res.status(200).json({
    code: "SUCCESS",
    data: req.user,
  });
};

const createUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (name === undefined || name === "") {
      return res.status(422).json({
        code: "REQUIRED_FIELD_MISSING",
        description: "name is required",
        field: "name",
      });
    }

    if (email === undefined || email === "") {
      return res.status(422).json({
        code: "REQUIRED_FIELD_MISSING",
        description: "email is required",
        field: "email",
      });
    }

    let isEmailExists = await User.findOne({
      email,
    });

    if (isEmailExists) {
      return res.status(409).json({
        code: "ENTITY_ALREADY_EXISTS",
        description: "email already exists",
        field: "email",
      });
    }

    if (password === undefined || password === "") {
      return res.status(400).json({
        code: "INVALID_PASSWORD",
        description: "password field is required",
        field: "password",
      });
    }

    const temp = { name, email, password };
    let newUser = await User.create(temp);
    const token = await newUser.generateAuthToken();

    if (newUser) {
      return res.status(201).json({
        message: "user created successfully",
        data: { newUser, token },
      });
    } else {
      throw new Error("something went wrong");
    }
  } catch (error) {
    return res.status(500).json({
      code: "SERVER_ERROR",
      description: "something went wrong, Please try again",
    });
  }
};

const loginUser = async (req, res, next) => {
  // login a registered user
  try {
    const { email, password } = req.body;
    const user = await User.findByCredentials(email, password);
    if (!user) {
      return res.status(401).json({
        code: "AUTHORIZATION_FAIL",
        description: "Login failed! Check authentication credentials",
      });
    }
    const token = await user.generateAuthToken();
    res.status(200).json({
      code: "LOGIN_SUCCESSFUL",
      data: { user, token },
    });
  } catch (error) {
    res.status(500).json({
      code: "SERVER_ERROR",
      description: "something went wrong, Please try again",
    });
  }
};

const updateUser = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const { name, email } = req.body;

    if (name === undefined || name === "") {
      return res.status(422).json({
        code: "REQUIRED_FIELD_MISSING",
        description: "name is required",
        field: "name",
      });
    }

    if (email === undefined || email === "") {
      return res.status(422).json({
        code: "REQUIRED_FIELD_MISSING",
        description: "email is required",
        field: "email",
      });
    }

    let isUserExists = await User.findById(userId);
    if (!isUserExists) {
      return res.status(404).json({
        code: "BAD_REQUEST_ERROR",
        description: "No user found in the system",
      });
    }

    const temp = { name, email };
    let updatedUser = await User.findByIdAndUpdate(userId, temp, {
      new: true,
    });

    if (updatedUser) {
      return res.status(200).json({
        message: "user updated successfully",
        data: updatedUser,
      });
    } else {
      throw new Error("something went wrong");
    }
  } catch (error) {
    return res.status(500).json({
      code: "SERVER_ERROR",
      description: "something went wrong, Please try again",
    });
  }
};

const deleteUser = async (req, res, next) => {
  try {
    let user = await User.findByIdAndRemove(req.params.id);
    if (user) {
      return res.status(204).json({
        message: `user with id ${req.params.id} deleted successfully`,
      });
    }

    return res.status(404).json({
      code: "BAD_REQUEST_ERROR",
      description: "No users found in the system",
    });
  } catch (error) {
    return res.status(500).json({
      code: "SERVER_ERROR",
      description: "something went wrong, please try again",
    });
  }
};

module.exports = {
  getUsers,
  getUserById,
  getLoggedInUser,
  createUser,
  loginUser,
  updateUser,
  deleteUser,
};
