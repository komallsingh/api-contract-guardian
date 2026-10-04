import * as assert from "assert";

import {
    indexModule
} from "../languages/javascript/moduleIndexer";

suite(
    "JavaScript Module Indexer",
    () => {

        test(
            "discovers a router without relying on its variable name",
            () => {

                const result =
                    indexModule(
                        `
                        const customerRoutes =
                            express.Router();

                        const orderRouter =
                            express.Router();
                        `,
                        "routes.ts"
                    );

                assert.deepStrictEqual(
                    result.symbols,
                    [
                        {
                            name: "customerRoutes",
                            kind: "ROUTER",
                            filePath: "routes.ts"
                        },
                        {
                            name: "orderRouter",
                            kind: "ROUTER",
                            filePath: "routes.ts"
                        }
                    ]
                );
            }
        );

        test(
            "discovers default imports",
            () => {

                const result =
                    indexModule(
                        `
                        import customerRouter
                            from "./customerRoutes";
                        `,
                        "app.ts"
                    );

                assert.deepStrictEqual(
                    result.imports,
                    [
                        {
                            localName:
                                "customerRouter",
                            source:
                                "./customerRoutes",
                            filePath:
                                "app.ts"
                        }
                    ]
                );
            }
        );

        test(
            "discovers named imports",
            () => {

                const result =
                    indexModule(
                        `
                        import {
                            customerRouter
                        } from "./routes";
                        `,
                        "app.ts"
                    );

                assert.deepStrictEqual(
                    result.imports,
                    [
                        {
                            localName:
                                "customerRouter",
                            importedName:
                                "customerRouter",
                            source:
                                "./routes",
                            filePath:
                                "app.ts"
                        }
                    ]
                );
            }
        );

        test(
            "does not treat arbitrary objects as routers",
            () => {

                const result =
                    indexModule(
                        `
                        const customerRoutes =
                            createSomething();
                        `,
                        "routes.ts"
                    );

                assert.deepStrictEqual(
                    result.symbols,
                    []
                );
            }
        );
        test(
    "discovers default exports",
    () => {

        const result =
            indexModule(
                `
                const customerRoutes =
                    express.Router();

                export default customerRoutes;
                `,
                "routes/customerRoutes.ts"
            );

        assert.deepStrictEqual(
            result.exports,
            [
                {
                    localName:
                        "customerRoutes",
                    exportedName:
                        "default",
                    isDefault:
                        true,
                    filePath:
                        "routes/customerRoutes.ts"
                }
            ]
        );
    }
);
test(
    "discovers named exports",
    () => {

        const result =
            indexModule(
                `
                const customerRoutes =
                    express.Router();

                export {
                    customerRoutes
                };
                `,
                "routes/customerRoutes.ts"
            );

        assert.deepStrictEqual(
            result.exports,
            [
                {
                    localName:
                        "customerRoutes",
                    exportedName:
                        "customerRoutes",
                    isDefault:
                        false,
                    filePath:
                        "routes/customerRoutes.ts"
                }
            ]
        );
    }
);
test(
    "indexes imports and exports together",
    () => {

        const result =
            indexModule(
                `
                import customerRouter
                    from "./customerRoutes";

                export default customerRouter;
                `,
                "app.ts"
            );

        assert.deepStrictEqual(
            result.imports,
            [
                {
                    localName:
                        "customerRouter",
                    source:
                        "./customerRoutes",
                    filePath:
                        "app.ts"
                }
            ]
        );

        assert.deepStrictEqual(
            result.exports,
            [
                {
                    localName:
                        "customerRouter",
                    exportedName:
                        "default",
                    isDefault:
                        true,
                    filePath:
                        "app.ts"
                }
            ]
        );
    }
);
    }
);