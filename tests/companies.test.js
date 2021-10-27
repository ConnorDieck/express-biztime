process.env.NODE_ENV = "test";

const request = require("supertest");
const app = require("../app");
const db = require("../db");

let testCompany;
beforeEach(async () => {
	const result = await db.query(`
                            INSERT INTO companies (code, name, description) 
                            VALUES ('fbk', 'Facebook', 'Zuckerberg')
                            RETURNING code, name, description`);
	testCompany = result.rows[0];
});

afterEach(async () => {
	await db.query(`DELETE FROM companies`);
});

afterAll(async () => {
	await db.end();
});

describe("GET /companies", () => {
	test("Gets a list of companies", async () => {
		const resp = await request(app).get("/companies");
		expect(resp.statusCode).toEqual(200);
		expect(resp.body).toEqual({
			companies: [ testCompany ]
		});
	});
});

describe("GET /companies/:code", () => {
	test("Gets company obj with matching code", async () => {
		const resp = await request(app).get(`/companies/${testCompany.code}`);
		// Invoices will be empty arr
		testCompany.invoices = [];
		expect(resp.statusCode).toEqual(200);
		expect(resp.body).toEqual({
			company: testCompany
		});
	});

	test("Returns error message if an incorrect code is requested", async () => {
		const resp = await request(app).get(`/companies/test`);
		expect(resp.statusCode).toEqual(404);
	});
});

describe("POST /company", () => {
	test("Posts a new company", async () => {
		const resp = await request(app).post("/companies").send({
			code: "apple",
			name: "Apple Computers",
			description: "Maker of OS X"
		});
		expect(resp.statusCode).toEqual(201);
		expect(resp.body).toEqual({
			company: {
				code: "apple",
				name: "Apple Computers",
				description: "Maker of OS X"
			}
		});
	});
});

describe("PUT /company/:code", () => {
	test("Updates an existing company", async () => {
		const resp = await request(app).put(`/companies/${testCompany.code}`).send({
			name: "Apple Computers",
			description: "Maker of OS X"
		});
		expect(resp.statusCode).toEqual(200);
		expect(resp.body).toEqual({
			company: {
				code: "fbk",
				name: "Apple Computers",
				description: "Maker of OS X"
			}
		});
	});

	test("Responds with 404 when given an invalid code", async () => {
		const resp = await request(app).put(`/companies/invalid`).send({
			name: "Apple Computers",
			description: "Maker of OS X"
		});
		expect(resp.statusCode).toEqual(404);
	});
});

describe("DELETE /companies/:code", () => {
	test("Deletes company obj with matching code", async () => {
		const resp = await request(app).delete(`/companies/${testCompany.code}`);
		expect(resp.statusCode).toEqual(200);
		expect(resp.body).toEqual({
			msg: "DELETED!"
		});
	});

	test("Returns error message if an incorrect code is requested", async () => {
		const resp = await request(app).delete(`/companies/test`);
		expect(resp.statusCode).toEqual(404);
		expect(resp.body).toEqual({
			error: {
				message: "Can't find company with code 'test'",
				status: 404
			}
		});
	});
});
