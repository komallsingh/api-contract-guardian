import * as assert from "assert";
import { detectRoutes } from "../languages/javascript/routeDetector";
import { extractResponseContract } from "../languages/javascript/responseExtractor";

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