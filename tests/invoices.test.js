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
	testInvoice.add_date = "2021-10-26T04:00:00.000Z";
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
				add_date: "2021-10-26T04:00:00.000Z",
				paid_date: null,
				paid: false
			}
		});
	});
});

// describe("PUT /company/:code", () => {
// 	test("Updates an existing company", async () => {
// 		const resp = await request(app).put(`/companies/${testCompany.code}`).send({
// 			name: "Apple Computers",
// 			description: "Maker of OS X"
// 		});
// 		expect(resp.statusCode).toEqual(200);
// 		expect(resp.body).toEqual({
// 			company: {
// 				code: "fbk",
// 				name: "Apple Computers",
// 				description: "Maker of OS X"
// 			}
// 		});
// 	});

// 	test("Responds with 404 when given an invalid code", async () => {
// 		const resp = await request(app).put(`/companies/invalid`).send({
// 			name: "Apple Computers",
// 			description: "Maker of OS X"
// 		});
// 		expect(resp.statusCode).toEqual(404);
// 	});
// });

// describe("DELETE /companies/:code", () => {
// 	test("Deletes company obj with matching code", async () => {
// 		const resp = await request(app).delete(`/companies/${testCompany.code}`);
// 		expect(resp.statusCode).toEqual(200);
// 		expect(resp.body).toEqual({
// 			msg: "DELETED!"
// 		});
// 	});

// 	test("Returns error message if an incorrect code is requested", async () => {
// 		const resp = await request(app).delete(`/companies/test`);
// 		expect(resp.statusCode).toEqual(404);
// 		expect(resp.body).toEqual({
// 			error: {
// 				message: "Can't find company with code 'test'",
// 				status: 404
// 			}
// 		});
// 	});
// });
