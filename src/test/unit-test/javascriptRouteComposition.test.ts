import * as assert from "assert";

import {
    ApiDiscoveryService
} from "../../core/apiDiscoveryService";

import {
    SourceFileContent
} from "../../core/sourceFileLoader";

import {
    JavaScriptParser
} from "../../languages/javascript/javascriptParser";

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

                const routes =
                    result
                        .map(
                            contract => ({
                                method: contract.method,
                                path: contract.path
                            })
                        )
                        .sort(
                            (left, right) =>
                                left.path.localeCompare(
                                    right.path
                                )
                        );

                assert.deepStrictEqual(
                    routes,
                    [
                        {
                            method: "GET",
                            path: "/admin/customers"
                        },
                        {
                            method: "GET",
                            path: "/api/customers"
                        }
                    ]
                );

            }
        );


        test(
            "composes nested prefixes across files with aliased named imports and preserves methods",
            () => {

                const sourceFiles:
                    SourceFileContent[] = [

                    {
                        path: "server.ts",
                        language: "javascript",
                        content: `
                            import apiRouter from "./routes/apiRoutes";

                            const app = express();

                            app.use("/api", apiRouter);
                        `
                    },

                    {
                        path: "routes/apiRoutes.ts",
                        language: "javascript",
                        content: `
                            import {
                                customerRouter as customers
                            } from "./customerRoutes";

                            const apiRouter = express.Router();

                            apiRouter.use("/v1", customers);

                            export default apiRouter;
                        `
                    },

                    {
                        path: "routes/customerRoutes.ts",
                        language: "javascript",
                        content: `
                            const customerRouter = express.Router();

                            customerRouter.get(
                                "/customers",
                                (req, res) => res.json([])
                            );

                            customerRouter.post(
                                "/customers",
                                (req, res) => res.status(201).json({})
                            );

                            customerRouter.delete(
                                "/customers/:id",
                                (req, res) => res.status(204).end()
                            );

                            export { customerRouter };
                        `
                    }

                ];

                const service =
                    new ApiDiscoveryService([
                        new JavaScriptParser()
                    ]);

                const result =
                    service.discover(sourceFiles);

                const routes =
                    result
                        .map(
                            contract => ({
                                method: contract.method,
                                path: contract.path
                            })
                        )
                        .sort(
                            (left, right) =>
                                `${left.method} ${left.path}`.localeCompare(
                                    `${right.method} ${right.path}`
                                )
                        );

                assert.deepStrictEqual(
                    routes,
                    [
                        {
                            method: "DELETE",
                            path: "/api/v1/customers/:id"
                        },
                        {
                            method: "GET",
                            path: "/api/v1/customers"
                        },
                        {
                            method: "POST",
                            path: "/api/v1/customers"
                        }
                    ]
                );

            }
        );

        test(
            "keeps routes discoverable when a mounted import cannot be resolved",
            () => {

                const sourceFiles:
                    SourceFileContent[] = [

                    {
                        path: "server.ts",
                        language: "javascript",
                        content: `
                            import { missingRouter } from "./routes/customerRoutes";

                            const app = express();

                            app.use("/api", missingRouter);
                        `
                    },

                    {
                        path: "routes/customerRoutes.ts",
                        language: "javascript",
                        content: `
                            const customerRouter = express.Router();

                            customerRouter.get(
                                "/customers",
                                (req, res) => res.json([])
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
                    service.discover(sourceFiles);

                assert.deepStrictEqual(
                    result.map(
                        contract => ({
                            method: contract.method,
                            path: contract.path
                        })
                    ),
                    [
                        {
                            method: "GET",
                            path: "/customers"
                        }
                    ]
                );

            }
        );

        test(
            "does not invent a prefix for a dynamic mount path",
            () => {

                const sourceFiles:
                    SourceFileContent[] = [

                    {
                        path: "server.ts",
                        language: "javascript",
                        content: `
                            import { customerRouter } from "./routes/customerRoutes";

                            const app = express();
                            const prefix = process.env.API_PREFIX;

                            app.use(prefix, customerRouter);
                        `
                    },

                    {
                        path: "routes/customerRoutes.ts",
                        language: "javascript",
                        content: `
                            const customerRouter = express.Router();

                            customerRouter.get(
                                "/customers",
                                (req, res) => res.json([])
                            );

                            export { customerRouter };
                        `
                    }

                ];

                const service =
                    new ApiDiscoveryService([
                        new JavaScriptParser()
                    ]);

                const result =
                    service.discover(sourceFiles);

                assert.deepStrictEqual(
                    result.map(
                        contract => ({
                            method: contract.method,
                            path: contract.path
                        })
                    ),
                    [
                        {
                            method: "GET",
                            path: "/customers"
                        }
                    ]
                );

            }
        );

    }
);