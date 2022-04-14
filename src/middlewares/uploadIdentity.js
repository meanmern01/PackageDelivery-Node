const multer = require("multer");
const fs = require("fs");
const path = require("path");

const imageStorage = multer.diskStorage({
    destination: async function (req, file, cb) {
        if (file.fieldname == "certificate") {
            const imageDir = path.join(
                __dirname,
                "..",
                "public",
                "LSP-certificates"
            );
            if (fs.existsSync(imageDir)) {
                cb(null, imageDir);
            } else {
                fs.mkdirSync(imageDir, {recursive: true});
                cb(null, imageDir);
            }
        } else {
            const imageDir = path.join(
                __dirname,
                "..",
                "public",
                "ILSP-identity"
            );
            if (fs.existsSync(imageDir)) {
                cb(null, imageDir);
            } else {
                fs.mkdirSync(imageDir, {recursive: true});
                cb(null, imageDir);
            }
        }
    },

    filename: async function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});

const uploadIdentity = multer({
    storage: imageStorage,
    fileFilter: (req, file, cb) => {
        const fileType = /jpeg|jpg|png/;
        const extension = file.originalname.substring(
            file.originalname.lastIndexOf(".") + 1
        );
        const mimetype = fileType.test(file.mimetype);

        if (mimetype && extension) {
            return cb(null, true);
        } else {
            cb("You can upload only Image file");
        }
    },
});

module.exports = uploadIdentity;
