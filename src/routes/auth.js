const express = require("express");
const {check} = require("express-validator");
const Auth = require("../controllers/auth");
const Password = require("../controllers/password");
const validate = require("../middlewares/validate");
const authenticate = require("../middlewares/authenticate");
const uploadIdentity = require("../middlewares/uploadIdentity");
const router = express.Router();

router.get("/", (req, res) => {
    res.status(200).json({
        message:
            "You are in the Auth Endpoint. Register or Login to test Authentication.",
    });
});

//REGISTERATION

router.post(
    "/register",
    uploadIdentity.fields([
        {name: "certificate"},
        {maxCount: 1},
        {name: "identity"},
        {maxCount: 1},
    ]),
    Auth.register
);

router.get("/verify/:token", Auth.verify);

//LOGIN

router.post(
    "/login",
    [
        check("input")
            .not()
            .isEmpty()
            .withMessage("Enter email or phone number to login."),
        check("password").not().isEmpty().withMessage("Enter password."),
    ],
    validate,
    Auth.login
);

//RESET PASSWORD

router.post("/forget", validate, Password.forget);

router.post("/verifyCode", Password.verifyCode);

router.post(
    "/reset/:userId",
    [
        check("password").not().isEmpty().withMessage("Password is required"),
        check("confirmPassword")
            .not()
            .isEmpty()
            .withMessage("Re-enter password to confirm"),
    ],
    validate,
    Password.resetPassword
);

router.post("/resendCode", validate, Password.resendCode);

//CHANGE PASSWORD

router.post(
    "/changePassword",
    [
        check("currentPassword")
            .not()
            .isEmpty()
            .withMessage("Please enter current password."),
        check("newPassword")
            .not()
            .isEmpty()
            .withMessage("Please enter new password."),
        check("confirmPassword")
            .not()
            .isEmpty()
            .withMessage("Please re-enter password to confirm."),
    ],
    authenticate,
    validate,
    Password.changePassword
);

//LOGOUT

router.post("/logout", authenticate, Auth.logout);

module.exports = router;
