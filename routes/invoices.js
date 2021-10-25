/** Routes for invoices of express-biztime */

const express = require("express");
const ExpressError = require("../expressError");
const router = express.Router();
const db = require("../db");

// Return list of invoices
router.get("/", async (req, res, next) => {
	try {
		const results = await db.query(`SELECT * FROM invoices`);
		return res.json({ companies: results.rows });
	} catch (e) {
		return next(e);
	}
});

module.exports = router;
