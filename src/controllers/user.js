const User = require("../models/user");
const {sendEmail} = require("../utils/index");
const fs = require("fs");
const validator = require("validator");

exports.index = async function (req, res) {
    const users = await User.find({});
    res.status(200).json({users});
};

exports.store = async (req, res) => {
    try {
        const {email} = req.body;

        // Make sure this account doesn't already exist
        const user = await User.findOne({email});

        if (user)
            return res.status(401).json({
                message:
                    "The email address you have entered is already associated with another account. You can change this users role instead.",
            });

        const password = "_" + Math.random().toString(36).substr(2, 9); //generate a random password
        const newUser = new User({...req.body, password});

        const user_ = await newUser.save();

        user_.generatePasswordResetCode();

        await user_.save();

        let domain = "http://" + req.headers.host;
        let subject = "New Account Created";
        let to = user.email;
        let from = process.env.FROM_EMAIL;
        let link =
            "http://" +
            req.headers.host +
            "/api/auth/reset/" +
            user.resetPasswordToken;
        let html = `<p>Hi ${user.username}<p><br><p>A new account has been created for you on ${domain}. Please click on the following <a href="${link}">link</a> to set your password and login.</p> 
                  <br><p>If you did not request this, please ignore this email.</p>`;

        await sendEmail({to, from, subject, html});

        res.status(200).json({
            message: "An email has been sent to " + user.email + ".",
        });
    } catch (error) {
        res.status(500).json({message: error.message});
    }
};

exports.getSingleUser = async function (req, res) {
    try {
        const _id = req.user.id;

        const user = await User.findById(_id, {
            createdAt: 0,
            updatedAt: 0,
            __v: 0,
        });

        if (!user)
            return res.status(401).json({message: "User does not exist"});

        res.status(200).json({user});
    } catch (error) {
        res.status(500).json({message: error.message});
    }
};

exports.getRegisteredCustomers = async function (req, res) {
    try {
        const user = await User.find(
            {type: "customer"},
            {
                createdAt: 0,
                updatedAt: 0,
                __v: 0,
                vehicle: 0,
                pastDelivery: 0,
            }
        );

        if (!user)
            return res.status(401).json({message: "No user registered yet."});

        res.status(200).json({"Number of registred users": user.length, user});
    } catch (error) {
        res.status(500).json({message: error.message});
    }
};
exports.getRegisteredProviders = async function (req, res) {
    try {
        const user = await User.find(
            {type: "provider"},
            {
                createdAt: 0,
                updatedAt: 0,
                __v: 0,
            }
        );

        if (!user)
            return res.status(401).json({message: "No user registered yet."});

        res.status(200).json({"Number of registred users": user.length, user});
    } catch (error) {
        res.status(500).json({message: error.message});
    }
};
exports.update = async function (req, res) {
    try {
        const {
            username,
            email,
            password,
            firstName,
            lastName,
            phoneNumber,
            address,
        } = req.body;
        const userId = req.user._id;
        let profileImage = "";

        if (!userId)
            return res.status(401).json({
                message: "Login to edit profile.",
            });

        if (email) {
            if (!validator.isEmail(email.trim()))
                return res
                    .status(401)
                    .json({message: "Please enter valid email"});

            const userWithEmail = await User.find({email, _id: {$ne: userId}});

            if (userWithEmail.length > 0) {
                return res.status(401).json({
                    message:
                        "The email address you have entered is already associated with another account.",
                });
            }
        }

        if (phoneNumber) {
            if (!validator.isMobilePhone(phoneNumber))
                return res
                    .status(401)
                    .json({message: "Please enter valid phone number"});

            const userWithPhoneNumber = await User.find({
                phoneNumber,
                _id: {$ne: userId},
            });

            if (userWithPhoneNumber.length > 0) {
                return res.status(401).json({
                    message:
                        "The phone number you have entered is already associated with another account.",
                });
            }
        }

        // if (password) {
        //     if (!confirmPassword) {
        //         return res
        //             .status(401)
        //             .json({message: "Re-enter password to confirm"});
        //     }
        //     if (password != confirmPassword) {
        //         return res.status(401).json({
        //             message:
        //                 "Passwords are not matching. Please re-enter password.",
        //         });
        //     }
        // }

        const user = await User.findOne({_id: userId});
        console.log(userId, user);

        if (user) {
            if (req.file) {
                profileImage =
                    process.env.TYPE === "development"
                        ? `http://localhost:3000/profile_images/` +
                          req.file.filename.replace(/\s/g, "")
                        : `${process.env.PRODUCTION_URL}/profile_images/` +
                          req.file.filename.replace(/\s/g, "");

                if (user.profileImage) {
                    fs.unlinkSync(
                        `src/public/profile_images/${user.profileImage
                            .split("/")
                            .pop()}`
                    );
                }
            }
            user.firstName = firstName;
            user.lastName = lastName;
            user.username = username;
            user.password = password;
            user.phoneNumber = phoneNumber;
            user.email = email;
            user.address = address;
            user.profileImage = req.file ? profileImage : user.profileImage;

            let updatedUser = await user.save();

            return res.status(200).json({
                message: "User updated successfully",
                user: updatedUser,
            });
        } else {
            return res.status(500).json({
                message: "Something went wrong",
            });
        }
    } catch (error) {
        res.status(500).json({message: error.message});
    }
};

exports.destroy = async function (req, res) {
    try {
        const id = req.params.id;
        const user_id = req.user._id;

        //Make sure the passed id is that of the logged in user
        if (user_id.toString() !== id.toString())
            return res.status(401).json({
                message:
                    "Sorry, you don't have the permission to delete this data.",
            });

        await User.findByIdAndDelete(id);
        res.status(200).json({message: "User has been deleted"});
    } catch (error) {
        res.status(500).json({message: error.message});
    }
};
