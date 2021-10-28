/** Routes for companies of express-biztime */

const express = require("express");
const ExpressError = require("../expressError");
const router = express.Router();
const db = require("../db");

// Return list of industries
router.get("/", async (req, res, next) => {
	try {
		const results = await db.query(
			`SELECT code, industry 
             FROM industries`
		);

		const indComps = {}; // Create new object to build with industries and companies

		for (let row of results.rows) {
			indComps[row["code"]] = []; // Create an empty array for each industry code to push company codes to
		}

		const compIndResults = await db.query(
			`SELECT comp_code, ind_code
             FROM companies_industries`
		);

		for (let row of compIndResults.rows) {
			indComps[row.ind_code].push(row.comp_code); // Push company codes to corresponding industry codes in industry company object
		}

		return res.json({ industries: indComps });
	} catch (e) {
		return next(e);
	}
});

// Adds an industry
router.post("/", async (req, res, next) => {
	try {
		const { code, industry } = req.body;

		const results = await db.query(
			"INSERT INTO industries (code, industry) values ($1, $2) RETURNING code, industry",
			[ code, industry ]
		);
		return res.status(201).json({ company: results.rows[0] });
	} catch (e) {
		return next(e);
	}
});

// Add company to existing industry
router.post("/addind", async (req, res, next) => {
	try {
		const { ind_code, comp_code } = req.body;
		const results = await db.query(
			"INSERT INTO companies_industries (ind_code, comp_code) values ($1, $2) RETURNING comp_code, ind_code",
			[ ind_code, comp_code ]
		);
		return res.status(201).json({ association: results.rows[0] });
	} catch (e) {
		return next(e);
	}
});

module.exports = router;
