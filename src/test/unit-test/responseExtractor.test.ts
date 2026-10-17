import * as assert from "assert";
import { detectRoutes } from "../../languages/javascript/routeDetector";
import { extractResponseContract } from "../../languages/javascript/responseExtractor";

suite("Response Extractor", () => {

    test("extracts response fields from res.json()", () => {

        const sourceCode = `
            const app = express(); app.get("/users/:id", (req, res) => {
                res.json({
                    id: 1,
                    name: "Komal",
                    email: "komal@example.com",
                    active: true
                });
            });
        `;

        const routes = detectRoutes(sourceCode, "server.ts");

        const result = extractResponseContract(routes[0]);

        assert.deepStrictEqual(result, {
            fields: [
                { name: "id", type: "number" },
                { name: "name", type: "string" },
                { name: "email", type: "string" },
                { name: "active", type: "boolean" }
            ]
        });
    });

    test("extracts response fields from res.status(200).json()", () => {

        const sourceCode = `
            const app = express(); app.get("/users/:id", (req, res) => {
                res.status(200).json({
                    id: 1,
                    name: "Komal"
                });
            });
        `;

        const routes = detectRoutes(sourceCode, "server.ts");

        const result = extractResponseContract(routes[0]);

        assert.deepStrictEqual(result, {
            fields: [
                { name: "id", type: "number" },
                { name: "name", type: "string" }
            ]
        });
    });

    test("extracts response fields from res.status(201).json()", () => {

        const sourceCode = `
            const app = express(); app.get("/users/:id", (req, res) => {
                res.status(201).json({
                    created: true
                });
            });
        `;

        const routes = detectRoutes(sourceCode, "server.ts");

        const result = extractResponseContract(routes[0]);

        assert.deepStrictEqual(result, {
            fields: [
                { name: "created", type: "boolean" }
            ]
        });
    });

    test("extracts response field from res.status(404).json()", () => {

        const sourceCode = `
            const app = express(); app.get("/users/:id", (req, res) => {
                res.status(404).json({
                    error: "Not Found"
                });
            });
        `;

        const routes = detectRoutes(sourceCode, "server.ts");

        const result = extractResponseContract(routes[0]);

        assert.deepStrictEqual(result, {
            fields: [
                { name: "error", type: "string" }
            ]
        });
    });

    test("extracts response field from res.status(500).json()", () => {

        const sourceCode = `
            const app = express(); app.get("/users/:id", (req, res) => {
                res.status(500).json({
                    error: "Internal Server Error"
                });
            });
        `;

        const routes = detectRoutes(sourceCode, "server.ts");

        const result = extractResponseContract(routes[0]);

        assert.deepStrictEqual(result, {
            fields: [
                { name: "error", type: "string" }
            ]
        });
    });

    test("ignores dynamic response values in res.status().json()", () => {

        const sourceCode = `
            const app = express(); app.get("/users/:id", (req, res) => {
                res.status(200).json({
                    id: user.id,
                    name: user.name
                });
            });
        `;

        const routes = detectRoutes(sourceCode, "server.ts");

        const result = extractResponseContract(routes[0]);

        assert.deepStrictEqual(result, {
            fields: []
        });
    });

    test("ignores dynamic response values", () => {

        const sourceCode = `
            const app = express(); app.get("/users", (req, res) => {
                res.json(user);
            });
        `;

        const routes = detectRoutes(sourceCode, "server.ts");

        const result = extractResponseContract(routes[0]);

        assert.strictEqual(result, undefined);
    });


    test("ignores non response json calls", () => {

        const sourceCode = `
            const app = express(); app.get("/users", (req, res) => {
                foo.json({
                    id: 1
                });
            });
        `;

        const routes = detectRoutes(sourceCode, "server.ts");

        const result = extractResponseContract(routes[0]);

        assert.strictEqual(result, undefined);
    });


    test("extracts string property names", () => {

        const sourceCode = `
            const app = express(); app.get("/users", (req, res) => {
                res.json({
                    "user-name": "Komal"
                });
            });
        `;

        const routes = detectRoutes(sourceCode, "server.ts");

        const result = extractResponseContract(routes[0]);

        assert.deepStrictEqual(result, {
            fields: [
                { name: "user-name", type: "string" }
            ]
        });
    });

});