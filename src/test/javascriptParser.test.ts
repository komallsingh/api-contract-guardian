import * as assert from "assert";
import { JavaScriptParser } from "../languages/javascript/javascriptParser";

suite("JavaScript Parser", () => {

    test("supports JavaScript and TypeScript files", () => {

        const parser = new JavaScriptParser();

        assert.strictEqual(
            parser.supports("server.js"),
            true
        );

        assert.strictEqual(
            parser.supports("server.ts"),
            true
        );

        assert.strictEqual(
            parser.supports("component.tsx"),
            true
        );

        assert.strictEqual(
            parser.supports("app.py"),
            false
        );
    });

    test("parses Express route into ApiContract", () => {

        const parser = new JavaScriptParser();

        const sourceCode = `
            const app = express(); app.get("/users/:id", (req, res) => {
                res.json({
                    id: 1,
                    name: "Komal",
                    active: true
                });
            });
        `;

        const result = parser.parse(
            sourceCode,
            "server.ts"
        );

        assert.deepStrictEqual(result, [
            {
                method: "GET",
                path: "/users/:id",
                file: "server.ts",
                line: 2,
                response: {
                    fields: [
                        { name: "id", type: "number" },
                        { name: "name", type: "string" },
                        { name: "active", type: "boolean" }
                    ]
                }
            }
        ]);
    });

    test("returns empty contracts when no routes exist", () => {

        const parser = new JavaScriptParser();

        const result = parser.parse(
            "const x = 10;",
            "server.ts"
        );

        assert.deepStrictEqual(result, []);
    });

});