const express = require("express");
const User = require("../controllers/user");
const authenticate = require("../middlewares/authenticate");
const uploadImage = require("../middlewares/uploadProfilePicture");
const router = express.Router();

//SHOW
router.get("/getSingleUser", authenticate, User.getSingleUser);
router.get("/getRegisteredCustomers", User.getRegisteredCustomers);
router.get("/getRegisteredProviders", User.getRegisteredProviders);

//EDIT PROFILE
router.post(
    "/editProfile",
    authenticate,
    uploadImage.single("profileImage"),
    User.update
);

//DELETE
router.delete("/:id", User.destroy);

module.exports = router;
