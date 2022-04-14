const auth = require("./auth");
const user = require("./user");
const request = require("./request");
const provider = require("./provider");
const order = require("./orders");

module.exports = (app) => {
    app.get("/", (req, res) => {
        res.status(200).send({message: "Welcome to the Node-Js API."});
    });

    app.use("/api/auth", auth);
    app.use("/api/user", user);
    app.use("/api/orders", order);
    app.use("/api/requests", request);
    app.use("/api/providers", provider);
};
