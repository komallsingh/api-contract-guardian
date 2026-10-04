import * as assert from "assert";

import {
    ApiDiscoveryService
} from "../core/apiDiscoveryService";

import {
    SourceFileContent
} from "../core/sourceFileLoader";

import {
    JavaScriptParser
} from "../languages/javascript/javascriptParser";

suite(
    "JavaScript Route Composition",
    () => {

        test(
            "composes imported default router with mount prefix",
            () => {

                const sourceFiles:
                    SourceFileContent[] = [

                    {
                        path: "server.ts",
                        language: "javascript",
                        content: `
                            import customerRouter from "./routes/customerRoutes";

                            const app = express();

                            app.use(
                                "/api",
                                customerRouter
                            );
                        `
                    },

                    {
                        path:
                            "routes/customerRoutes.ts",
                        language: "javascript",
                        content: `
                            const customerRouter =
                                express.Router();

                            customerRouter.get(
                                "/customers",
                                (req, res) => {
                                    res.json({
                                        id: 1
                                    });
                                }
                            );

                            export default customerRouter;
                        `
                    }

                ];

                const service =
                    new ApiDiscoveryService([
                        new JavaScriptParser()
                    ]);

                const result =
                    service.discover(
                        sourceFiles
                    );

                assert.strictEqual(
                    result.length,
                    1
                );

                assert.strictEqual(
                    result[0].method,
                    "GET"
                );

                assert.strictEqual(
                    result[0].path,
                    "/api/customers"
                );

            }
        );

        test(
            "supports named router exports",
            () => {

                const sourceFiles:
                    SourceFileContent[] = [

                    {
                        path: "server.ts",
                        language: "javascript",
                        content: `
                            import {
                                customerRouter
                            } from "./routes/customerRoutes";

                            const app = express();

                            app.use(
                                "/api",
                                customerRouter
                            );
                        `
                    },

                    {
                        path:
                            "routes/customerRoutes.ts",
                        language: "javascript",
                        content: `
                            const customerRouter =
                                express.Router();

                            customerRouter.get(
                                "/customers",
                                (req, res) => {
                                    res.json({
                                        id: 1
                                    });
                                }
                            );

                            export {
                                customerRouter
                            };
                        `
                    }

                ];

                const service =
                    new ApiDiscoveryService([
                        new JavaScriptParser()
                    ]);

                const result =
                    service.discover(
                        sourceFiles
                    );

                assert.strictEqual(
                    result.length,
                    1
                );

                assert.strictEqual(
                    result[0].method,
                    "GET"
                );

                assert.strictEqual(
                    result[0].path,
                    "/api/customers"
                );

            }
        );

        test(
            "supports the same router mounted twice",
            () => {

                const sourceFiles:
                    SourceFileContent[] = [

                    {
                        path: "server.ts",
                        language: "javascript",
                        content: `
                            import customerRouter from "./customerRoutes";

                            const app = express();

                            app.use(
                                "/api",
                                customerRouter
                            );

                            app.use(
                                "/admin",
                                customerRouter
                            );
                        `
                    },

                    {
                        path:
                            "customerRoutes.ts",
                        language: "javascript",
                        content: `
                            const customerRouter =
                                express.Router();

                            customerRouter.get(
                                "/customers",
                                (req, res) => {
                                    res.json({
                                        id: 1
                                    });
                                }
                            );

                            export default customerRouter;
                        `
                    }

                ];

                const service =
                    new ApiDiscoveryService([
                        new JavaScriptParser()
                    ]);

                const result =
                    service.discover(
                        sourceFiles
                    );

                assert.strictEqual(
                    result.length,
                    2
                );

                const paths =
                    result
                        .map(
                            contract =>
                                contract.path
                        )
                        .sort();

                assert.deepStrictEqual(
                    paths,
                    [
                        "/admin/customers",
                        "/api/customers"
                    ]
                );

            }
        );

    }
);