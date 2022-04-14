const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const Token = require("../models/token");
const Provider = require("../models/provider");

const UserSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            trim: true,
        },
        providerType: {
            type: String,
        },

        email: {
            type: String,
            trim: true,
        },

        phoneNumber: {
            type: String,
            trim: true,
        },

        firstName: {
            type: String,
            trim: true,
        },

        lastName: {
            type: String,
            trim: true,
        },

        username: {
            type: String,
            trim: true,
        },

        password: {
            type: String,
            max: 100,
            trim: true,
        },
        address: {
            type: String,
            trim: true,
        },
        profileImage: {
            type: String, //Image path
        },

        legalId: {
            type: String, //Image path
        },
        aboutUs: {
            type: String,
            trim: true,
        },
        companyName: {
            type: String,
            trim: true,
        },

        avgPrice: {
            type: Number,
            trim: true,
        },
        extraCharge: {
            type: Number,
            trim: true,
        },
        vehicle: {
            type: Array,
        },
        pastDelivery: {
            type: Number,
            default: 0,
        },
        avgRating: {
            type: Number,
        },

        privacyPolicy: {
            type: String,
        },

        loginToken: {
            type: String,
        },
        verificationCode: {
            type: Number,
        },
    },
    {timestamps: true}
);

UserSchema.pre("save", function (next) {
    const user = this;

    if (!user.isModified("password")) return next();

    bcrypt.genSalt(10, function (err, salt) {
        if (err) return next(err);

        bcrypt.hash(user.password, salt, function (err, hash) {
            if (err) return next(err);

            user.password = hash;
            next();
        });
    });
});

UserSchema.methods.comparePassword = function (password) {
    return bcrypt.compareSync(password, this.password);
};

UserSchema.methods.generateJWT = function () {
    const today = new Date();
    const expirationDate = new Date(today);
    expirationDate.setDate(today.getDate() + 60);

    let payload = {
        id: this._id,
    };

    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: parseInt(expirationDate.getTime() / 1000, 10),
    });
};

UserSchema.methods.generatePasswordResetCode = function () {
    let payload = {
        userId: this._id,
        token: Math.floor(1000 + Math.random() * 9000), //4-digit verification code
    };

    return new Token(payload);
};

UserSchema.methods.generateVerificationToken = function () {
    let payload = {
        userId: this._id,
        token: crypto.randomBytes(20).toString("hex"),
    };

    return new Token(payload);
};

module.exports = mongoose.model("Users", UserSchema);
