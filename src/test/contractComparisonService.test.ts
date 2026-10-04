import * as assert from "assert";

import { execFileSync } from "child_process";

import {
    mkdtempSync,
    writeFileSync
} from "fs";

import { rm } from "fs/promises";

import { tmpdir } from "os";

import { join } from "path";

import { ContractComparisonService } from "../core/contractComparisonService";

import { JavaScriptParser } from "../languages/javascript/javascriptParser";

import { ApiDiscoveryService } from "../core/apiDiscoveryService";

import { GitSourceRepository } from "../core/git/gitSourceRepository";

import { ApiRevisionDiscovery } from "../core/git/apiRevisionDiscovery";

suite("Contract Comparison Service", () => {

    test("detects removed endpoint between revisions", async () => {

        const repositoryPath = mkdtempSync(
            join(
                tmpdir(),
                "api-contract-guardian-"
            )
        );

        const runGit = (args: string[]) => {
            return execFileSync(
                "git",
                args,
                {
                    cwd: repositoryPath,
                    encoding: "utf-8"
                }
            ).trim();
        };

        try {

            runGit(["init"]);

            runGit([
                "config",
                "user.email",
                "test@example.com"
            ]);

            runGit([
                "config",
                "user.name",
                "API Contract Guardian Test"
            ]);

            writeFileSync(
                join(repositoryPath, "server.ts"),
                `
                    const app = express(); app.get("/users/:id", (req, res) => {
                        res.json({
                            id: 1
                        });
                    });

                    app.get("/users", (req, res) => {
                        res.json({
                            users: []
                        });
                    });
                `
            );

            runGit(["add", "server.ts"]);

            runGit([
                "commit",
                "-m",
                "initial API"
            ]);

            const oldRevision = runGit([
                "rev-parse",
                "HEAD"
            ]);

            writeFileSync(
                join(repositoryPath, "server.ts"),
                `
                    const app = express(); app.get("/users", (req, res) => {
                        res.json({
                            users: []
                        });
                    });
                `
            );

            runGit(["add", "server.ts"]);

            runGit([
                "commit",
                "-m",
                "remove endpoint"
            ]);

            const newRevision = runGit([
                "rev-parse",
                "HEAD"
            ]);

            const apiRevisionDiscovery =
                new ApiRevisionDiscovery(
                    new GitSourceRepository(
                        repositoryPath
                    ),
                    new ApiDiscoveryService([
                        new JavaScriptParser()
                    ])
                );

            const service =
                new ContractComparisonService(
                    repositoryPath,
                    apiRevisionDiscovery
                );

            const result = service.compare(
                oldRevision,
                newRevision
            );

            assert.deepStrictEqual(
                result.breakingChanges,
                [
                    {
                        type: "REMOVED_ENDPOINT",
                        method: "GET",
                        path: "/users/:id"
                    }
                ]
            );

        } finally {

            await rm(
                repositoryPath,
                {
                    recursive: true,
                    force: true,
                    maxRetries: 10,
                    retryDelay: 200
                }
            );

        }

    });

    test(
        "discovers APIs from unchanged source files",
        async function () {

            this.timeout(10000);

            const repositoryPath =
                mkdtempSync(
                    join(
                        tmpdir(),
                        "guardian-comparison-"
                    )
                );

            const runGit = (
                args: string[]
            ): string =>
                execFileSync(
                    "git",
                    args,
                    {
                        cwd: repositoryPath,
                        encoding: "utf-8"
                    }
                ).trim();

            try {

                runGit(["init"]);

                runGit([
                    "config",
                    "user.email",
                    "test@example.com"
                ]);

                runGit([
                    "config",
                    "user.name",
                    "Guardian Test"
                ]);

                /*
                 * routes.ts contains the API.
                 * server.ts does not contain the route.
                 */

                writeFileSync(
                    join(
                        repositoryPath,
                        "routes.ts"
                    ),
                    `
                        const router = express.Router(); router.get(
                            "/customers",
                            (req, res) => {
                                res.json({
                                    id: 1
                                });
                            }
                        );
                    `
                );

                writeFileSync(
                    join(
                        repositoryPath,
                        "server.ts"
                    ),
                    `
                        const app = express();
                    `
                );

                runGit(["add", "."]);

                runGit([
                    "commit",
                    "-m",
                    "add API"
                ]);

                const oldRevision =
                    runGit([
                        "rev-parse",
                        "HEAD"
                    ]);

                /*
                 * Only server.ts changes.
                 * routes.ts remains untouched.
                 */

                writeFileSync(
                    join(
                        repositoryPath,
                        "server.ts"
                    ),
                    `
                        const app = express();
                        console.log("server started");
                    `
                );

                runGit(["add", "."]);

                runGit([
                    "commit",
                    "-m",
                    "modify server"
                ]);

                const newRevision =
                    runGit([
                        "rev-parse",
                        "HEAD"
                    ]);

                const apiRevisionDiscovery =
                    new ApiRevisionDiscovery(
                        new GitSourceRepository(
                            repositoryPath
                        ),
                        new ApiDiscoveryService([
                            new JavaScriptParser()
                        ])
                    );

                const service =
                    new ContractComparisonService(
                        repositoryPath,
                        apiRevisionDiscovery
                    );

                const result =
                    service.compare(
                        oldRevision,
                        newRevision
                    );

                assert.ok(
                    result.oldContracts.some(
                        contract =>
                            contract.method === "GET" &&
                            contract.path === "/customers"
                    )
                );

                assert.ok(
                    result.newContracts.some(
                        contract =>
                            contract.method === "GET" &&
                            contract.path === "/customers"
                    )
                );

                assert.deepStrictEqual(
                    result.breakingChanges,
                    []
                );

            } finally {

                await rm(
                    repositoryPath,
                    {
                        recursive: true,
                        force: true,
                        maxRetries: 10,
                        retryDelay: 200
                    }
                );

            }

        }
    );

});