import * as assert from "assert";

import {
    mkdirSync,
    mkdtempSync,
    writeFileSync
} from "fs";

import { rm } from "fs/promises";

import {
    tmpdir
} from "os";

import {
    join
} from "path";

import {
    discoverSourceFiles
} from "../core/repositoryDiscovery";

suite(
    "Repository Discovery",
    () => {

        test(
            "discovers JavaScript and TypeScript files recursively",
            async function () {

                this.timeout(10000);

                const repositoryPath =
                    mkdtempSync(
                        join(
                            tmpdir(),
                            "guardian-discovery-"
                        )
                    );

                try {

                    mkdirSync(
                        join(
                            repositoryPath,
                            "apps",
                            "web"
                        ),
                        {
                            recursive: true
                        }
                    );

                    mkdirSync(
                        join(
                            repositoryPath,
                            "services",
                            "api"
                        ),
                        {
                            recursive: true
                        }
                    );

                    writeFileSync(
                        join(
                            repositoryPath,
                            "apps",
                            "web",
                            "Profile.tsx"
                        ),
                        ""
                    );

                    writeFileSync(
                        join(
                            repositoryPath,
                            "services",
                            "api",
                            "server.ts"
                        ),
                        ""
                    );

                    writeFileSync(
                        join(
                            repositoryPath,
                            "client.js"
                        ),
                        ""
                    );

                    writeFileSync(
                        join(
                            repositoryPath,
                            "config.json"
                        ),
                        ""
                    );

                    const result =
                        discoverSourceFiles(
                            repositoryPath
                        );

                    assert.deepStrictEqual(
                        result,
                        [
                            {
                                path: "apps/web/Profile.tsx",
                                language: "typescript"
                            },
                            {
                                path: "client.js",
                                language: "javascript"
                            },
                            {
                                path: "services/api/server.ts",
                                language: "typescript"
                            }
                        ]
                    );

                } finally {

                    await rm(
                        repositoryPath,
                        {
                            recursive: true,
                            force: true
                        }
                    );
                }
            }
        );

        test(
            "ignores generated and dependency directories",
            async function () {

                this.timeout(10000);

                const repositoryPath =
                    mkdtempSync(
                        join(
                            tmpdir(),
                            "guardian-discovery-"
                        )
                    );

                try {

                    const directories = [
                        ".git",
                        "node_modules",
                        "dist",
                        "out",
                        "coverage",
                        "build",
                        ".next",
                        ".vscode",
                        ".vscode-test"
                    ];

                    for (
                        const directory
                        of directories
                    ) {

                        mkdirSync(
                            join(
                                repositoryPath,
                                directory
                            ),
                            {
                                recursive: true
                            }
                        );

                        writeFileSync(
                            join(
                                repositoryPath,
                                directory,
                                "ignored.ts"
                            ),
                            ""
                        );
                    }

                    mkdirSync(
                        join(
                            repositoryPath,
                            "src"
                        )
                    );

                    writeFileSync(
                        join(
                            repositoryPath,
                            "src",
                            "server.ts"
                        ),
                        ""
                    );

                    const result =
                        discoverSourceFiles(
                            repositoryPath
                        );

                    assert.deepStrictEqual(
                        result,
                        [
                            {
                                path: "src/server.ts",
                                language: "typescript"
                            }
                        ]
                    );

                } finally {

                    await rm(
                        repositoryPath,
                        {
                            recursive: true,
                            force: true
                        }
                    );
                }
            }
        );

        test(
            "handles uppercase extensions",
            async function () {

                this.timeout(10000);

                const repositoryPath =
                    mkdtempSync(
                        join(
                            tmpdir(),
                            "guardian-discovery-"
                        )
                    );

                try {

                    writeFileSync(
                        join(
                            repositoryPath,
                            "CLIENT.JS"
                        ),
                        ""
                    );

                    writeFileSync(
                        join(
                            repositoryPath,
                            "COMPONENT.TSX"
                        ),
                        ""
                    );

                    const result =
                        discoverSourceFiles(
                            repositoryPath
                        );

                    assert.deepStrictEqual(
                        result,
                        [
                            {
                                path: "CLIENT.JS",
                                language: "javascript"
                            },
                            {
                                path: "COMPONENT.TSX",
                                language: "typescript"
                            }
                        ]
                    );

                } finally {

                    await rm(
                        repositoryPath,
                        {
                            recursive: true,
                            force: true
                        }
                    );
                }
            }
        );
    }
);