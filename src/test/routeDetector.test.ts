import * as assert from "assert";
import ts from "typescript";

import {
    detectRoutes
} from "../languages/javascript/routeDetector";

suite("Route Detector", () => {

    test("detects Express routes", () => {

        const sourceCode = `
            const app = express();
            const router = express.Router();

            app.get("/users", (req, res) => {
                res.json({ id: 1 });
            });

            app.post("/users", (req, res) => {
                res.json({ success: true });
            });

            app.put("/users/:id", (req, res) => {
                res.json({ id: 1 });
            });

            app.patch("/users/:id", (req, res) => {
                res.json({ id: 1 });
            });

            app.delete("/users/:id", (req, res) => {
                res.sendStatus(204);
            });

            router.get("/products", (req, res) => {
                res.json([]);
            });

            router.post("/products", (req, res) => {
                res.json({});
            });
        `;

        const result =
            detectRoutes(
                sourceCode,
                "server.ts"
            );

        assert.strictEqual(
            result.length,
            7
        );

        assert.strictEqual(
            result[0].contract.method,
            "GET"
        );

        assert.strictEqual(
            result[0].contract.path,
            "/users"
        );

        assert.strictEqual(
            result[1].contract.method,
            "POST"
        );

        assert.strictEqual(
            result[1].contract.path,
            "/users"
        );

        assert.strictEqual(
            result[2].contract.method,
            "PUT"
        );

        assert.strictEqual(
            result[2].contract.path,
            "/users/:id"
        );

        assert.strictEqual(
            result[3].contract.method,
            "PATCH"
        );

        assert.strictEqual(
            result[3].contract.path,
            "/users/:id"
        );

        assert.strictEqual(
            result[4].contract.method,
            "DELETE"
        );

        assert.strictEqual(
            result[4].contract.path,
            "/users/:id"
        );

        assert.strictEqual(
            result[5].contract.method,
            "GET"
        );

        assert.strictEqual(
            result[5].contract.path,
            "/products"
        );

        assert.strictEqual(
            result[6].contract.method,
            "POST"
        );

        assert.strictEqual(
            result[6].contract.path,
            "/products"
        );
    });

    test("ignores non Express objects", () => {

        const sourceCode = `
            const foo = {};

            foo.get("/not-an-api", (req, res) => {
                res.json({});
            });
        `;

        const result =
            detectRoutes(
                sourceCode,
                "server.ts"
            );

        assert.strictEqual(
            result.length,
            0
        );
    });

    test("ignores app.use()", () => {

        const sourceCode = `
            const app = express();
            const router = express.Router();

            app.use("/api", router);
        `;

        const result =
            detectRoutes(
                sourceCode,
                "server.ts"
            );

        assert.strictEqual(
            result.length,
            0
        );
    });

    test("ignores routes without string paths", () => {

        const sourceCode = `
            const app = express();

            const routePath = "/users";

            app.get(
                routePath,
                (req, res) => {
                    res.json({});
                }
            );
        `;

        const result =
            detectRoutes(
                sourceCode,
                "server.ts"
            );

        assert.strictEqual(
            result.length,
            0
        );
    });

    test("captures the route handler", () => {

        const sourceCode = `
            const app = express();

            app.get(
                "/users",
                (req, res) => {
                    res.json({
                        id: 1
                    });
                }
            );
        `;

        const result =
            detectRoutes(
                sourceCode,
                "server.ts"
            );

        assert.strictEqual(
            result.length,
            1
        );

        assert.ok(
            result[0].handler
        );

        assert.ok(
            ts.isArrowFunction(
                result[0].handler
            )
        );
    });

    test(
        "detects routes without relying on variable names",
        () => {

            const result =
                detectRoutes(
                    `
                    const api = express();

                    const customerRoutes =
                        express.Router();

                    api.get(
                        "/customers",
                        (req, res) => {
                            res.json({
                                id: 1
                            });
                        }
                    );

                    customerRoutes.post(
                        "/customers",
                        (req, res) => {
                            res.json({
                                id: 1
                            });
                        }
                    );
                    `,
                    "server.ts"
                );

            assert.strictEqual(
                result.length,
                2
            );

            assert.strictEqual(
                result[0].ownerName,
                "api"
            );

            assert.strictEqual(
                result[1].ownerName,
                "customerRoutes"
            );
        }
    );
});