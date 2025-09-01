const userModel = require("../models/user.model");
const userService = require("../services/user.service");
const { validationResult } = require("express-validator");

module.exports.registerUser = async (req, res, next) => {
  const errors = validationResult(req); 
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { fullname, email, password } = req.body;

  const isUserAlready = await userModel.findOne({ email });

  if (isUserAlready) {
    return res.status(400).json({ message: "User already exist" });
  }
  
  const hashPassword = await userModel.hashPassword(password);

  const user = await userService.createUser({
      firstname: fullname.firstname,
      lastname: fullname.lastname,
    email,
    password: hashPassword,
  });

  const token = user.generateAuthToken();

  res.status(201).json({ token, user });
};

module.exports.loginUser = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  const user = await userModel.findOne({ email }).select("+password"); // (userModel me hamne password me select ko false kara tha, vha pe false karne ka ye mtlb tha ki agr user pe kuch bhi find query lagayenge to password by default nhi aayega par yha pe select('+password') ka ye mtlb hai ki jab user ko find karo to password sath me lana, kyuki hame check karna hai ki jo password user ne bheja hai vo shi hai ya nhi) userModel me findOne method se email se user ko dhoondh lenge, aur select('+password') se password bhi mil jayega kyuki by default password ko select nahi karte hain

  // checking if user exists or not
  if (!user) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  // checking if password matches
  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    return res.status(401).json({ message: "Invalid email or passwords" });
  }

  // generating auth token
  const token = user.generateAuthToken();

  // status code 200 ke sath token aur user ko bhej denge
  res.status(200).json({ token, user });
};
