const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema(
    {
        packageItems: {
            type: String,
            trim: true,
        },

        packageCode: {
            type: String,
            unique: true,
        },
        providerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Users",
        },
        products: {
            type: Array,
        },
        weight: {
            type: String,
            trim: true,
        },
        shippingVehicle: {
            type: String,
            trim: true,
        },
        from: {
            type: String,
            trim: true,
        },
        to: {type: String, trim: true},
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Users",
        },
        price: {
            type: Number,
        },
        status: {
            type: String,
            trim: true,
        },
        // packageId: {
        //     type: mongoose.Schema.Types.ObjectId,
        //     ref: "Packages",
        // },
        // providerId: {
        //     type: mongoose.Schema.Types.ObjectId,
        //     ref: "Providers",
        // },
        requestType: {
            type: String,
            default: "pending",
        },
        isActive: {
            type: Boolean,
        },
        rating: {
            type: Number,
        },
        feedback: {
            type: String,
        },
    },
    {timestamps: true}
);

module.exports = mongoose.model("Requests", requestSchema);
