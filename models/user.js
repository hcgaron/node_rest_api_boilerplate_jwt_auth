let mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

let Schema = mongoose.Schema;

const User = new Schema(
  {
    name: {
      type: String,
      required: [true, "name is required"],
      lowercase: true,
      trim: true,
    },
    email: {
      type: String,
      required: [true, "email is required"],
      unique: true,
      lowercase: true,
      validate: (value) => {
        if (!validator.isEmail(value)) {
          throw new Error({ error: "Invalid Email address" });
        }
      },
    },
    password: {
      type: String,
      required: true,
      minlength: 7,
    },
    tokens: [
      {
        token: {
          type: String,
          required: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

User.pre("save", async function (next) {
  // Hash the password before saving the user model
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 8);
  }
  next();
});

User.methods.generateAuthToken = async function (next) {
  // Generate an auth token for the user
  // can customize fields in token by extending this object
  const token = jwt.sign({ _id: this._id }, process.env.JWT_KEY);
  this.tokens = this.tokens.concat({ token });
  await this.save();
  return token;
};

User.statics.findByCredentials = async function (email, password) {
  // search for a user by email and password
  const user = await this.findOne({ email });
  if (!user) {
    throw new Error({ error: "Invalid login credentials" });
  }
  const isPasswordMatch = await bcrypt.compare(password, user.password);
  if (!isPasswordMatch) {
    throw new Error({ error: "Invalid login credentials" });
  }
  return user;
};

module.exports = mongoose.model("User", User);
