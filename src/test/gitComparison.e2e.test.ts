import * as assert from "assert";

import { execFileSync } from "child_process";

import {
    mkdtempSync,
    writeFileSync
} from "fs";

import { rm } from "fs/promises";

import { tmpdir } from "os";

import { join } from "path";

import { compareApiContracts } from "../core/apiComparator";

import { ContractLoader } from "../core/contract/contractLoader";

import { GitService } from "../core/git/gitService";

import { getChangedFiles } from "../core/git/changedFiles";

import { JavaScriptParser } from "../languages/javascript/javascriptParser";

import { ContractComparisonService } from "../core/contractComparisonService";

import { ApiDiscoveryService } from "../core/apiDiscoveryService";

import { ApiRevisionDiscovery } from "../core/git/apiRevisionDiscovery";

import { GitSourceRepository } from "../core/git/gitSourceRepository";

suite("Git Comparison E2E", () => {

    test(
        "detects a removed endpoint between Git revisions",
        async function () {

            this.timeout(10000);

            const repositoryPath = mkdtempSync(
                join(
                    tmpdir(),
                    "api-contract-guardian-"
                )
            );

            try {

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

                const oldSource = `
                    const app = express(); app.get("/users/:id", (req, res) => {
                        res.json({
                            id: 1,
                            name: "Komal"
                        });
                    });

                    app.get("/users", (req, res) => {
                        res.json({
                            users: []
                        });
                    });
                `;

                writeFileSync(
                    join(
                        repositoryPath,
                        "server.ts"
                    ),
                    oldSource
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

                const newSource = `
                    const app = express(); app.get("/users", (req, res) => {
                        res.json({
                            users: []
                        });
                    });
                `;

                writeFileSync(
                    join(
                        repositoryPath,
                        "server.ts"
                    ),
                    newSource
                );

                runGit(["add", "server.ts"]);

                runGit([
                    "commit",
                    "-m",
                    "remove user endpoint"
                ]);

                const newRevision = runGit([
                    "rev-parse",
                    "HEAD"
                ]);

                const changedFiles = getChangedFiles(
                    oldRevision,
                    newRevision,
                    repositoryPath
                );

                assert.deepStrictEqual(
                    changedFiles,
                    [
                        {
                            path: "server.ts",
                            type: "MODIFIED"
                        }
                    ]
                );

                const loader = new ContractLoader(
                    new GitService(repositoryPath),
                    [
                        new JavaScriptParser()
                    ]
                );

                const oldContracts =
                    loader.loadFromRevision(
                        changedFiles.map(
                            change => change.path
                        ),
                        oldRevision
                    );

                const newContracts =
                    loader.loadFromFiles(
                        changedFiles.map(
                            change => change.path
                        ),
                        repositoryPath
                    );

                const breakingChanges =
                    compareApiContracts(
                        oldContracts,
                        newContracts
                    );

                assert.deepStrictEqual(
                    breakingChanges,
                    [
                        {
                            type: "REMOVED_ENDPOINT",
                            method: "GET",
                            path: "/users/:id"
                        }
                    ]
                );

                assert.notStrictEqual(
                    oldRevision,
                    newRevision
                );

            } finally {

                await rm(
                    repositoryPath,
                    {
                        recursive: true,
                        force: true,
                        maxRetries: 3,
                        retryDelay: 100
                    }
                );

            }

        }
    );

    test(
        "handles an added API file",
        async function () {

            this.timeout(10000);

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
                    join(
                        repositoryPath,
                        "server.ts"
                    ),
                    `
                        const app = express(); app.get("/users", (req, res) => {
                            res.json({
                                users: []
                            });
                        });
                    `
                );

                runGit(["add", "."]);

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
                    join(
                        repositoryPath,
                        "adminRoutes.ts"
                    ),
                    `
                        const app = express(); app.get("/admin/users", (req, res) => {
                            res.json({
                                users: []
                            });
                        });
                    `
                );

                runGit(["add", "."]);

                runGit([
                    "commit",
                    "-m",
                    "add admin API"
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

                const result =
                    service.compare(
                        oldRevision,
                        newRevision
                    );

                assert.deepStrictEqual(
                    result.changes,
                    [
                        {
                            path: "adminRoutes.ts",
                            type: "ADDED"
                        }
                    ]
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

    test(
        "detects an endpoint from a deleted API file",
        async function () {

            this.timeout(10000);

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
                    join(
                        repositoryPath,
                        "server.ts"
                    ),
                    `
                        const app = express(); app.get("/users", (req, res) => {
                            res.json({
                                users: []
                            });
                        });
                    `
                );

                writeFileSync(
                    join(
                        repositoryPath,
                        "legacyRoutes.ts"
                    ),
                    `
                        const app = express(); app.get("/legacy/users", (req, res) => {
                            res.json({
                                users: []
                            });
                        });
                    `
                );

                runGit(["add", "."]);

                runGit([
                    "commit",
                    "-m",
                    "initial API"
                ]);

                const oldRevision = runGit([
                    "rev-parse",
                    "HEAD"
                ]);

                execFileSync(
                    "git",
                    ["rm", "legacyRoutes.ts"],
                    {
                        cwd: repositoryPath,
                        encoding: "utf-8"
                    }
                );

                runGit([
                    "commit",
                    "-m",
                    "remove legacy API"
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

                const result =
                    service.compare(
                        oldRevision,
                        newRevision
                    );

                assert.deepStrictEqual(
                    result.changes,
                    [
                        {
                            path: "legacyRoutes.ts",
                            type: "DELETED"
                        }
                    ]
                );

                assert.deepStrictEqual(
                    result.breakingChanges,
                    [
                        {
                            type: "REMOVED_ENDPOINT",
                            method: "GET",
                            path: "/legacy/users"
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

        }
    );

});