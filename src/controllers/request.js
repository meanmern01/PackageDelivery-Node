const Request = require("../models/request");
const User = require("../models/user");
const {sendMail} = require("../utils/index");

exports.modifyRequest = async (req, res) => {
    try {
        const {requestType, requestId} = req.body;

        const existingReq = await Request.findOne({
            _id: requestId,
        }).populate("providerId", {firstName: 1, lastName: 1, phoneNumber: 1});

        if (!existingReq) {
            return res.status(400).json({
                message: `Invalid requestId`,
            });
        }

        if (existingReq.requestType == requestType) {
            return res.status(400).json({
                message: `Request already ${requestType}ed.`,
            });
        }

        existingReq.requestType = requestType;

        const updateRequest = await existingReq.save();

        if (updateRequest) {
            const user = await User.findOne({
                _id: updateRequest.customerId,
            });

            //SEND BILLING STRUCTURE IN MAIL

            //SEND REJECTED REQUEST TO ADMIN

            if (user.email && updateRequest.requestType == "accept") {
                const subject = "Request confirmation";

                const to = user.email;
                const from = process.env.FROM_EMAIL;
                const html = `<h4>Hello ${user.firstName},</h4>
                    <p>Your request to deliver ${updateRequest.packageItems} (packagecode : <b>${updateRequest.packageCode}</b>) has been accepted by ${updateRequest.providerId.firstName} ${updateRequest.providerId.lastName} (contact number : ${updateRequest.providerId.phoneNumber}). Please complete your payment to activate request.
                       
                </p><p>RequestID : <b>${updateRequest._id}</b></p>`;

                const result = await sendMail({to, from, subject, html});
                console.log("mail result", result);
            }
            res.status(200).json({
                message: `${updateRequest.requestType} Request`,
            });
        } else {
            res.status(500).json({message: "Something went wrong"});
        }
    } catch (error) {
        res.status(500).json({message: error.message});
    }
};

exports.activateRequest = async (req, res) => {
    try {
        const {activation, requestId} = req.body;

        const findRequest = await Request.findOne({
            _id: requestId,
        }).populate("providerId", {firstName: 1, lastName: 1, phoneNumber: 1});

        if (!findRequest) {
            return res.status(400).json({message: "Invalid request Id"});
        }

        if (findRequest.requestType === "reject")
            return res
                .status(400)
                .json({message: "Cannot activate rejected request."});

        if (findRequest.requestType === "pending")
            return res.status(400).json({message: "Request not accepted yet."});

        if (findRequest.isActive === activation)
            return res.status(400).json({
                message: activation
                    ? `Request already activated to deliver package.`
                    : `Request has already been deactivated.`,
            });

        findRequest.isActive = activation;
        findRequest.status = activation ? "On the Way" : "Delivered";

        const updateRequest = await findRequest.save();

        if (updateRequest) {
            if (!updateRequest.isActive) {
                const response = await User.findOne({
                    _id: updateRequest.providerId,
                });

                response.pastDelivery = response.pastDelivery + 1;

                await response.save();
            }

            const user = await User.findOne({_id: updateRequest.customerId});

            if (user.email) {
                const subject = "Package Delivery Status";
                const to = user.email;
                const from = process.env.FROM_EMAIL;

                const html = updateRequest.isActive
                    ? `<h4>Hello ${user.firstName},</h4>
                    <p>Your request to deliver ${updateRequest.packageItems} (packagecode : <b>${updateRequest.packageCode}</b>) has been activated. Your package will be delivered soon by ${updateRequest.providerId.firstName} ${updateRequest.providerId.lastName} (contact number : ${updateRequest.providerId.phoneNumber}).</p><p>RequestID : <b>${updateRequest._id}</b></p>
`
                    : `<h4>Hello ${user.firstName},</h4>
                    <p>Your package containing ${updateRequest.packageItems} (packagecode : <b>${updateRequest.packageCode}</b>) has been delivered to ${updateRequest.to} by ${updateRequest.providerId.firstName} ${updateRequest.providerId.lastName} (contact number : ${updateRequest.providerId.phoneNumber}). Please tell us about your browsing experience on Jikoo-connect by giving feedback.</p><p>RequestID : <b>${updateRequest._id}</b></p>`;

                const result = await sendMail({to, from, subject, html});
                console.log("Mail result:", result);
            }

            return res.status(200).json({
                message: activation
                    ? "Request activated to deliver package."
                    : "Package delivered successfully.",
            });
        }
    } catch (e) {
        return res.status(500).json({message: e.message});
    }
};

exports.getRequest = async function (req, res) {
    try {
        const id = req.user._id;
        const type = req.user.type;

        const {requestType} = req.params;
        let query = {};

        if (requestType == "active") {
            query = {
                requestType: "accept",
                isActive: true,
            };
        } else if (requestType == "delivered") {
            query = {
                requestType: "accept",
                isActive: false,
            };
        } else {
            query = {
                requestType: {$regex: new RegExp(requestType.trim(), "i")},
            };
        }

        if (type == "provider") query.providerId = id;
        else query.customerId = id;

        const requests = await Request.find(query, {
            __v: 0,
            isActive: 0,
        })
            .sort({updatedAt: -1})
            .populate("providerId", {
                _id: 1,
                firstName: 1,
                lastName: 1,
                companyName: 1,
                providerType: 1,
            });

        res.status(200).json({
            "number of requests": requests.length,
            requests,
        });
    } catch (error) {
        res.status(500).json({message: error.message});
    }
};

exports.getAllRequest = async (req, res) => {
    try {
        const id = req.user._id;
        const type = req.user.type;
        let query = {};

        if (type == "customer") query = {customerId: id};
        else query = {providerId: id};
        Request.find(query, {createdAt: 0, updatedAt: 0, __v: 0})
            .lean()
            .exec()
            .then((requests) =>
                res
                    .status(200)
                    .json({"Total requests": requests.length, requests})
            );
    } catch (e) {
        res.json(500).json({error: e.message});
    }
};
