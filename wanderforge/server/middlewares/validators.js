const Joi = require("joi");

const signupValidator = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().required().min(2).max(50).messages({
      "string.min": "Name must be at least 2 characters",
      "string.max": "Name cannot exceed 50 characters",
      "any.required": "Name is required",
    }),
    email: Joi.string().email().required().messages({
      "string.email": "Please enter a valid email",
      "any.required": "Email is required",
    }),
    password: Joi.string().required().min(6).max(50).messages({
      "string.min": "Password must be at least 6 characters",
      "string.max": "Password cannot exceed 50 characters",
      "any.required": "Password is required",
    }),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};

const loginValidator = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().email().required().messages({
      "string.email": "Please enter a valid email",
      "any.required": "Email is required",
    }),
    password: Joi.string().required().min(6).max(50).messages({
      "string.min": "Password must be at least 6 characters",
      "any.required": "Password is required",
    }),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};

const otpValidator = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().email().required().messages({
      "string.email": "Please enter a valid email",
      "any.required": "Email is required",
    }),
    otp: Joi.string()
      .required()
      .length(6)
      .pattern(/^[0-9]+$/)
      .messages({
        "string.length": "OTP must be 6 digits",
        "string.pattern.base": "OTP must contain only numbers",
        "any.required": "OTP is required",
      }),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};

module.exports = { signupValidator, loginValidator, otpValidator };
