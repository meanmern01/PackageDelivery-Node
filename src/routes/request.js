const express = require("express");
const authenticate = require("../middlewares/authenticate");
const Request = require("../controllers/request");
const router = express.Router();

//MODIFY
router.post("/modifyRequest", Request.modifyRequest);

//ACTIVATE
router.post("/activateRequest", Request.activateRequest);

//GET
router.get("/getRequest/:requestType", authenticate, Request.getRequest);

router.get("/getAllRequest", authenticate, Request.getAllRequest);

module.exports = router;
