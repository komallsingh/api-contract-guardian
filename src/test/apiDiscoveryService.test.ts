import * as assert from "assert";

import {
    ApiDiscoveryService
} from "../core/apiDiscoveryService";

import {
    JavaScriptParser
} from "../languages/javascript/javascriptParser";

suite(
    "API Discovery Service",
    () => {

        test(
            "discovers APIs from arbitrary source files",
            () => {

                const service =
                    new ApiDiscoveryService([
                        new JavaScriptParser()
                    ]);

                const result =
                    service.discover([
                        {
                            path:
                                "some/random/location/server.ts",
                            language:
                                "typescript",
                            content: `
                             const app = express();
                                app.get(
                                    "/customers/:id",
                                    (req, res) => {
                                        res.json({
                                            id: 1
                                        });
                                    }
                                );
                            `
                        }
                    ]);

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
                    "/customers/:id"
                );
            }
        );
    }
);