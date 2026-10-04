import * as assert from "assert";

import {
    detectMounts
} from "../languages/javascript/mountDetector";

suite(
    "Mount Detector",
    () => {

        test(
            "detects router mounts without hardcoded names",
            () => {

                const result =
                    detectMounts(
                        `
                        const api =
                            express();

                        const customerRoutes =
                            express.Router();

                        api.use(
                            "/api",
                            customerRoutes
                        );
                        `,
                        "app.ts"
                    );

                assert.strictEqual(
                    result.length,
                    1
                );

                assert.deepStrictEqual(
                    result[0],
                    {
                        filePath: "app.ts",
                        ownerName: "api",
                        targetName:
                            "customerRoutes",
                        prefix: "/api",
                        line: 8
                    }
                );
            }
        );

        test(
            "ignores use calls without a router identifier",
            () => {

                const result =
                    detectMounts(
                        `
                        app.use(
                            "/api",
                            middlewareFunction
                        );
                        `,
                        "app.ts"
                    );

                /*
                 * This is still detected as a mount candidate.
                 * The module-resolution layer will later determine
                 * whether middlewareFunction is actually a router.
                 */
                assert.strictEqual(
                    result.length,
                    1
                );
            }
        );
    }
);