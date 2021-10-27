process.env.NODE_ENV = "test";

const request = require("supertest");
const app = require("../app");
const db = require("../db");

let testCompany;
let testInvoice;
beforeEach(async () => {
	const compResult = await db.query(`
                            INSERT INTO companies (code, name, description) 
                            VALUES ('fbk', 'Facebook', 'Zuckerberg')
                            RETURNING code, name, description`);
	testCompany = compResult.rows[0];

	const invResult = await db.query(`
                            INSERT INTO invoices (comp_code, amt) 
                            VALUES ('fbk', 100)
                            RETURNING id, amt, paid, paid_date`);
	testInvoice = invResult.rows[0];
	testInvoice.company = testCompany;
	// add_date is returning as a string from the db
	testInvoice.add_date = "2021-10-27T04:00:00.000Z";
});

afterEach(async () => {
	await db.query(`DELETE FROM companies`);
	await db.query(`DELETE FROM invoices`);
});

afterAll(async () => {
	await db.end();
});

describe("GET /invoices", () => {
	test("Gets a list of invoices", async () => {
		const resp = await request(app).get("/invoices");
		expect(resp.statusCode).toEqual(200);
		expect(resp.body).toEqual({
			invoices: [
				{
					id: testInvoice.id,
					comp_code: testInvoice.company.code
				}
			]
		});
	});
});

describe("GET /invoices/:id", () => {
	test("Gets invoice obj with matching id", async () => {
		const resp = await request(app).get(`/invoices/${testInvoice.id}`);
		expect(resp.statusCode).toEqual(200);
		expect(resp.body).toEqual({
			invoice: testInvoice
		});
	});

	test("Returns error message if an incorrect id is requested", async () => {
		const resp = await request(app).get(`/invoices/0`);
		expect(resp.statusCode).toEqual(404);
	});
});

describe("POST /invoices", () => {
	test("Posts a new invoice", async () => {
		const resp = await request(app).post("/invoices").send({
			comp_code: "fbk",
			amt: "999"
		});
		expect(resp.statusCode).toEqual(201);
		expect(resp.body).toEqual({
			invoice: {
				comp_code: "fbk",
				amt: 999,
				id: expect.any(Number),
				add_date: "2021-10-27T04:00:00.000Z",
				paid_date: null,
				paid: false
			}
		});
	});
});

describe("PUT /invoices/:id", () => {
	test("Updates an existing invoice", async () => {
		const resp = await request(app).put(`/invoices/${testInvoice.id}`).send({
			amt: 999
		});
		expect(resp.statusCode).toEqual(200);
		expect(resp.body).toEqual({
			invoice: {
				comp_code: "fbk",
				amt: 999,
				id: expect.any(Number),
				add_date: "2021-10-27T04:00:00.000Z",
				paid_date: null,
				paid: false
			}
		});
	});

	test("Responds with 404 when given an invalid id", async () => {
		const resp = await request(app).put(`/invoices/0`).send({
			amt: 999
		});
		expect(resp.statusCode).toEqual(404);
	});
});

describe("DELETE /invoice/:id", () => {
	test("Deletes invoice obj with matching id", async () => {
		const resp = await request(app).delete(`/invoices/${testInvoice.id}`);
		expect(resp.statusCode).toEqual(200);
		expect(resp.body).toEqual({
			msg: "deleted"
		});
	});

	test("Returns error message if an incorrect id is requested", async () => {
		const resp = await request(app).delete(`/invoices/0`);
		expect(resp.statusCode).toEqual(404);
		expect(resp.body).toEqual({
			error: {
				message: "Can't find invoice with id '0'",
				status: 404
			}
		});
	});
});
