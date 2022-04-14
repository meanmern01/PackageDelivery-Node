const mongoose = require("mongoose");

const tokenSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },

    token: {
        type: Number,
    },

    createdAt: {
        type: Date,
        default: Date.now,
    },
});

tokenSchema.index({createdAt: 1}, {expireAfterSeconds: 60});

module.exports = mongoose.model("Tokens", tokenSchema);
