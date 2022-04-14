const Datauri = require("datauri");
const path = require("path");
const nodemailer = require("nodemailer");

function sendMail(mailDetails) {
    try {
        let mailTransporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.FROM_EMAIL,
                pass: process.env.EMAIL_PASSWORD,
            },
        });

        console.log(mailDetails);

        return new Promise((resolve, reject) => {
            mailTransporter.sendMail(mailDetails, function (error, result) {
                if (error) {
                    console.log("object", error);
                    return reject(error);
                } else {
                    return resolve(result);
                }
            });
        });
    } catch (e) {
        console.log("Mail error : ", e.message);
    }
}

module.exports = {uploader, sendEmail, sendMail};
