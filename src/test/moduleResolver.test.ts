import * as assert from "assert";

import {
    JavaScriptModuleResolver
} from "../languages/javascript/moduleResolver";

import {
    JavaScriptModule
} from "../languages/javascript/moduleGraph";

suite(
    "JavaScript Module Resolver",
    () => {

        test(
            "resolves relative TypeScript imports",
            () => {

                const routes: JavaScriptModule = {
                    filePath:
                        "routes/customerRoutes.ts",
                    symbols: [],
                    imports: [],
                    exports: [
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
                };

                const app: JavaScriptModule = {
                    filePath:
                        "app.ts",
                    symbols: [],
                    imports: [
                        {
                            localName:
                                "customerRoutes",
                            source:
                                "./routes/customerRoutes",
                            filePath:
                                "app.ts"
                        }
                    ],
                    exports: []
                };

                const modules =
                    new Map<string, JavaScriptModule>([
                        [
                            routes.filePath,
                            routes
                        ],
                        [
                            app.filePath,
                            app
                        ]
                    ]);

                const resolver =
                    new JavaScriptModuleResolver(
                        modules
                    );

                const result =
                    resolver.resolveImport(
                        "app.ts",
                        app.imports[0]
                    );

                assert.strictEqual(
                    result?.filePath,
                    "routes/customerRoutes.ts"
                );
            }
        );

        test(
            "returns undefined for unresolved imports",
            () => {

                const app: JavaScriptModule = {
                    filePath: "app.ts",
                    symbols: [],
                    imports: [
                        {
                            localName:
                                "missingRouter",
                            source:
                                "./routes/missing",
                            filePath:
                                "app.ts"
                        }
                    ],
                    exports: []
                };

                const resolver =
                    new JavaScriptModuleResolver(
                        new Map([
                            [
                                app.filePath,
                                app
                            ]
                        ])
                    );

                const result =
                    resolver.resolveImport(
                        "app.ts",
                        app.imports[0]
                    );

                assert.strictEqual(
                    result,
                    undefined
                );
            }
        );

        test(
            "resolves index files",
            () => {

                const routes: JavaScriptModule = {
                    filePath:
                        "routes/index.ts",
                    symbols: [],
                    imports: [],
                    exports: []
                };

                const app: JavaScriptModule = {
                    filePath:
                        "app.ts",
                    symbols: [],
                    imports: [
                        {
                            localName:
                                "routes",
                            source:
                                "./routes",
                            filePath:
                                "app.ts"
                        }
                    ],
                    exports: []
                };

                const resolver =
                    new JavaScriptModuleResolver(
                        new Map([
                            [
                                routes.filePath,
                                routes
                            ],
                            [
                                app.filePath,
                                app
                            ]
                        ])
                    );

                const result =
                    resolver.resolveImport(
                        "app.ts",
                        app.imports[0]
                    );

                assert.strictEqual(
                    result?.filePath,
                    "routes/index.ts"
                );
            }
        );
    }
);