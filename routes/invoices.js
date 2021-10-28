/** Routes for invoices of express-biztime */

const express = require("express");
const ExpressError = require("../expressError");
const router = express.Router();
const db = require("../db");

// Return list of invoices
router.get("/", async (req, res, next) => {
	try {
		const results = await db.query(`SELECT id, comp_code FROM invoices`);
		return res.json({ invoices: results.rows });
	} catch (e) {
		return next(e);
	}
});

// Return obj of invoice
router.get("/:id", async (req, res, next) => {
	try {
		const { id } = req.params;

		const results = await db.query(
			`
            SELECT i.id,
                   i.comp_code, 
                   i.amt,
                   i.paid,
                   i.add_date,
                   i.paid_date,
                   c.name,
                   c.description
            FROM invoices AS i
                INNER JOIN companies AS c ON (i.comp_code = c.code)
            WHERE id=$1`,
			[ id ]
		);

		if (results.rows.length === 0) {
			throw new ExpressError(`Can't find invoice with id ${id}`, 404);
		}

		const data = results.rows[0];

		const invoice = {
			id: data.id,
			company: {
				code: data.comp_code,
				name: data.name,
				description: data.description
			},
			amt: data.amt,
			paid: data.paid,
			add_date: data.add_date,
			paid_date: data.paid_date
		};

		return res.send({ invoice: invoice });
	} catch (e) {
		return next(e);
	}
});

// Adds an invoice
router.post("/", async (req, res, next) => {
	try {
		const { comp_code, amt } = req.body;
		const results = await db.query(
			"INSERT INTO invoices (comp_code, amt) values ($1, $2) RETURNING id, comp_code, amt, paid, add_date, paid_date",
			[ comp_code, amt ]
		);
		return res.status(201).json({ invoice: results.rows[0] });
	} catch (e) {
		return next(e);
	}
});

// Edit existing invoice
router.put("/:id", async (req, res, next) => {
	try {
		const { id } = req.params;
		const { amt, paid } = req.body;
		let paidDate = null;

		const currResult = await db.query(
			`SELECT paid, paid_date
				FROM invoices
				WHERE id = $1`,
			[ id ]
		);

		if (currResult.rows.length === 0) {
			throw new ExpressError(`Can't find invoice with id ${id}`, 404);
		}
		// console.log(currResult);
		const currPaidDate = currResult.rows[0].paid_date;
		// console.log("**************************");
		// console.log(currPaidDate);

		if (!currPaidDate && paid) {
			paidDate = new Date();
		} else if (!paid) {
			paidDate = null;
		} else {
			paidDate = currPaidDate;
		}

		const result = await db.query(
			`UPDATE invoices
				SET amt=$1, paid=$2, paid_date=$3
				WHERE id=$4
				RETURNING id, comp_code, amt, paid, add_date, paid_date`,
			[ amt, paid, paidDate, id ]
		);

		return res.json({ invoice: result.rows[0] });
	} catch (e) {
		return next(e);
	}
});

// Deletes invoice
router.delete("/:id", async (req, res, next) => {
	try {
		const resTest = await db.query("SELECT * FROM invoices WHERE id = $1", [ req.params.id ]);
		if (resTest.rows.length === 0) {
			throw new ExpressError(`Can't find invoice with id '${req.params.id}'`, 404);
		}
		const results = db.query("DELETE FROM invoices WHERE id = $1", [ req.params.id ]);
		return res.send({ msg: "deleted" });
	} catch (e) {
		return next(e);
	}
});

module.exports = router;
