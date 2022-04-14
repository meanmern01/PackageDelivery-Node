const express = require("express");
const Provider = require("../controllers/provider");
const authenticate = require("../middlewares/authenticate");
const router = express.Router();

//ADD
router.post(
    "/editProvider",
    authenticate,

    Provider.editProvider
);

//SHOW
router.get("/getProviderByType/:type", Provider.getProviderByType);

router.get("/getProviderById/:_id", Provider.getProviderById);

//SEARCH

router.get(
    "/searchLogisticCompany/:searchWord",
    Provider.searchLogisticCompany
);
module.exports = router;
