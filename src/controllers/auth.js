const User = require("../models/user");
const Token = require("../models/token");
const {sendEmail} = require("../utils/index");
const validator = require("validator");

exports.register = async (req, res) => {
    try {
        const {
            email,
            password,
            confirmPassword,
            phoneNumber,
            type,
            providerType,
        } = req.body;

        const strongPassword = new RegExp(
            "(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])(?=.{8,})"
        );

        if (!phoneNumber) {
            return res
                .status(400)
                .json({message: "Please enter your phone number."});
        } else if (!password) {
            return res.status(400).json({message: "Please enter password."});
        } else if (!confirmPassword) {
            return res.status(400).json({
                message: "Please re-enter password to confirm.",
            });
        }

        if (email) {
            if (!validator.isEmail(email.trim()))
                return res
                    .status(401)
                    .json({message: "Please enter valid email"});
            const userWithEmail = await User.findOne({email: email.trim()});
            if (userWithEmail)
                return res.status(401).json({
                    message:
                        "The email address you have entered is already associated with another account.",
                });
        }

        const userWithPhoneNumber = await User.findOne({
            phoneNumber: phoneNumber.trim(),
        });

        if (userWithPhoneNumber) {
            return res.status(401).json({
                message:
                    "The phone number you have entered is already associated with another account.",
            });
        }

        if (!strongPassword.test(password.trim())) {
            return res.status(400).json({
                message:
                    "Password should be at least 8 characters long with at least one uppercase letter, one lowercase letter, one digit and one special character ",
            });
        }

        if (password.trim() != confirmPassword.trim()) {
            return res.status(400).json({
                message:
                    "Passwords are not matching. Please re-enter password.",
            });
        }
        if (type == "provider") {
            if (!providerType) {
                return res.status(400).json({
                    message: "Please specify provider type",
                });
            }
            if (Object.keys(req.files).length === 0) {
                return res.status(400).json({
                    message:
                        providerType == "Logistic company"
                            ? "Please upload CAC certificate."
                            : "Please upload your Driving license, International passpost or NIN",
                });
            }
        }

        const newUser = new User({...req.body});

        if (Object.keys(req.files).length > 0) {
            let legalID = req.files["identity"]
                ? process.env.TYPE === "development"
                    ? `http://localhost:3000/ILSP-identity/` +
                      req.files["identity"][0].filename.replace(/\s/g, "")
                    : `${process.env.PRODUCTION_URL}/ILSP-identity/` +
                      req.files["identity"][0].filename.replace(/\s/g, "")
                : process.env.TYPE === "development"
                ? `http://localhost:3000/LSP-certificates/` +
                  req.files["certificate"][0].filename.replace(/\s/g, "")
                : `${process.env.PRODUCTION_URL}/LSP-certificates/` +
                  req.files["certificate"][0].filename.replace(/\s/g, "");

            newUser.legalId = legalID;
        }

        const user_insert = await newUser.save();

        if (user_insert) {
            return res.status(200).json({
                message: "User Registered Successfully.",
            });
        } else {
            return res.json({
                code: 500,
                message: "Registration failed.",
                success: false,
            });
        }
    } catch (error) {
        return res.status(500).json({message: error.message});
    }
};

exports.verify = async (req, res) => {
    if (!req.params.token)
        return res
            .status(400)
            .json({message: "We were unable to find a user for this token."});

    try {
        const token = await Token.findOne({token: req.params.token});

        if (!token)
            return res.status(400).json({
                message:
                    "We were unable to find a valid token. Your token my have expired.",
            });

        User.findOne({_id: token.userId}, (err, user) => {
            if (!user)
                return res.status(400).json({
                    message: "We were unable to find a user for this token.",
                });

            if (user.isVerified)
                return res
                    .status(400)
                    .json({message: "This user has already been verified."});

            user.isVerified = true;
            user.save(function (err) {
                if (err) return res.status(500).json({message: err.message});

                res.status(200).send(
                    "The account has been verified. Please log in."
                );
            });
        });
    } catch (error) {
        res.status(500).json({message: error.message});
    }
};

exports.login = async (req, res) => {
    try {
        const {input, password} = req.body;

        const user = await User.findOne({
            $or: [{email: input.trim()}, {phoneNumber: input.trim()}],
        });

        if (!user)
            return res.status(401).json({
                message: "Invalid login credentials.",
            });

        if (!user.comparePassword(password.trim()))
            return res
                .status(401)
                .json({message: "Invalid login credentials."});

        user.loginToken = user.generateJWT();

        await user.save();

        console.log("user", user);
        res.status(200).json({
            success: true,
            message: `logged in ${user.type} Sucessfully`,
            user: user,
        });
    } catch (error) {
        res.status(500).json({message: error.message});
    }
};

exports.resendToken = async (req, res) => {
    try {
        const {email} = req.body;

        const user = await User.findOne({email});

        if (!user)
            return res.status(401).json({
                message:
                    "The email address " +
                    req.body.email +
                    " is not associated with any account. Double-check your email address and try again.",
            });

        if (user.isVerified)
            return res.status(400).json({
                message:
                    "This account has already been verified. Please log in.",
            });

        await sendVerificationEmail(user, req, res);
    } catch (error) {
        res.status(500).json({message: error.message});
    }
};

async function sendVerificationEmail(user, req, res) {
    try {
        const token = user.generateVerificationToken();

        // Save the verification token
        await token.save();

        let subject = "Account Verification Token";
        let to = user.email;
        let from = process.env.FROM_EMAIL;

        let link =
            "http://" + req.headers.host + "/api/auth/verify/" + token.token;
        let html = `<p>Hi ${user.username}<p><br><p>Please click on the following <a href="${link}">link</a> to verify your account.</p> 
                  <br><p>If you did not request this, please ignore this email.</p>`;

        await sendEmail({to, from, subject, html});

        return res.status(200).json({
            message:
                "A verification email has been sent to " + user.email + ".",
        });
    } catch (error) {
        res.status(500).json({message: error.message});
    }
}

exports.logout = async (req, res) => {
    req.logout();
    res.status(200).json({message: "User logged out."});
};
