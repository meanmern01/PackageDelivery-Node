const crypto = require("crypto");
const Request = require("../models/request");
const Provider = require("../models/provider");
const {sendMail} = require("../utils/index");
const User = require("../models/user");

exports.placeOrder = async (req, res) => {
    try {
        const customerId = req.user._id;

        const products = [];

        if (req.files) {
            req.files.forEach((file) => {
                products.push(
                    process.env.TYPE === "development"
                        ? `http://localhost:3000/product_images/` +
                              file.filename.replace(/\s/g, "")
                        : `${process.env.PRODUCTION_URL}/product_images/` +
                              file.filename.replace(/\s/g, "")
                );
            });
        }

        const packageCode = crypto.randomBytes(8).toString("hex").toUpperCase();

        const newRequest = new Request({
            ...req.body,
            packageCode,
            products,
            customerId,
        });

        const savedRequest = await newRequest.save();

        if (savedRequest) {
            if (req.user.email) {
                const subject = "Package delivery request.";
                const to = req.user.email;
                const from = process.env.FROM_EMAIL;
                const html = `<h4>Hello ${req.user.firstName},</h4>
                    <p>We have received your request to deliver ${savedRequest.packageItems} (packagecode : <b>${savedRequest.packageCode}</b>) with requestID 
                    <b>${savedRequest._id}</b>. You will receive a request confirmation email once we are able to accept it.</p>`;

                const result = await sendMail({to, from, subject, html});
                console.log("mail result", result);
            }

            res.status(200).json({
                message: "Request sent to deliver package.",
                savedRequest,
            });
        } else {
            res.status(500).json({message: "something went wrong"});
        }
    } catch (error) {
        res.status(500).json({message: error.message});
    }
};

exports.addRatingsAndFeedback = async (req, res) => {
    try {
        const {rating, feedback, requestId} = req.body;

        const findRequest = await Request.findOne({
            _id: requestId,
        });

        if (!findRequest) {
            return res.status(400).json({message: "Invalid request Id"});
        }

        if (findRequest.isActive) {
            return res.status(400).json({message: "Package not delivered yet"});
        }

        if (rating) {
            findRequest.rating = rating;
        }

        if (feedback) {
            findRequest.feedback = feedback;
        }

        await findRequest.save();

        console.log("findRequest", findRequest);
        const response = await User.findOne({
            _id: findRequest.providerId,
        });

        const array = [];

        Request.find(
            {providerId: response._id, isActive: false},
            async (err, result) => {
                result.forEach((request) => {
                    request.rating && array.push(request.rating);
                });

                let average =
                    array.reduce((partial_sum, a) => partial_sum + a, 0) /
                    array.length;

                response.avgRating = Math.round(average + "e+2") + "e-2";
                await response.save();
            }
        );

        return res.status(200).json({
            message: rating
                ? `You rated ${rating} stars`
                : "Thank you for your valuable feedback",
        });
    } catch (e) {
        res.status(500).json({message: e.message});
    }
};
