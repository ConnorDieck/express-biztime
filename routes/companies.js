/** Routes for companies of express-biztime */

const express = require("express");
const ExpressError = require("../expressError");
const router = express.Router();
const db = require("../db");
const slugify = require("slugify");

// Return list of companies
router.get("/", async (req, res, next) => {
	try {
		const results = await db.query(`SELECT * FROM companies`);
		return res.json({ companies: results.rows });
	} catch (e) {
		return next(e);
	}
});

// Return obj of company with array of its invoices
router.get("/:code", async (req, res, next) => {
	try {
		const { code } = req.params;

		const compResult = await db.query(
			`SELECT c.code, c.name, c.description, i.industry
				FROM companies AS c
					LEFT JOIN companies_industries AS ci ON (c.code = ci.comp_code)
					LEFT JOIN industries AS i ON (ci.ind_code = i.code)
				WHERE c.code=$1`,
			[ code ]
		);

		const invResult = await db.query(
			`SELECT id
			FROM invoices
			WHERE comp_code = $1`,
			[ code ]
		);

		if (compResult.rows.length === 0) {
			throw new ExpressError(`Can't find company with code ${code}`, 404);
		}

		const company = compResult.rows[0];
		const invoices = invResult.rows;

		company.invoices = invoices.map((invoice) => invoice.id);

		return res.send({ company: company });
	} catch (e) {
		return next(e);
	}
});

// Adds a company
router.post("/", async (req, res, next) => {
	try {
		const { name, description } = req.body;
		let code = slugify(name);
		code = code.toLowerCase();
		const results = await db.query(
			"INSERT INTO companies (code, name, description) values ($1, $2, $3) RETURNING code, name, description",
			[ code, name, description ]
		);
		return res.status(201).json({ company: results.rows[0] });
	} catch (e) {
		return next(e);
	}
});

// Edit existing company
router.put("/:code", async (req, res, next) => {
	try {
		const { code } = req.params;
		const { name, description } = req.body;
		const results = await db.query(
			"UPDATE companies SET name=$1, description=$2 WHERE code=$3 RETURNING code, name, description",
			[ name, description, code ]
		);
		if (results.rows.length === 0) {
			throw new ExpressError(`Can't find company with code '${code}'`, 404);
		}
		return res.send({ company: results.rows[0] });
	} catch (e) {
		return next(e);
	}
});

// Deletes company
router.delete("/:code", async (req, res, next) => {
	try {
		const resTest = await db.query("SELECT * FROM companies WHERE code = $1", [ req.params.code ]);
		if (resTest.rows.length === 0) {
			throw new ExpressError(`Can't find company with code '${req.params.code}'`, 404);
		}
		const results = await db.query("DELETE FROM companies WHERE code = $1", [ req.params.code ]);
		return res.send({ msg: "DELETED!" });
	} catch (e) {
		return next(e);
	}
});

module.exports = router;
