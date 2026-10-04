import {
    dirname,
    extname,
    join,
    normalize
} from "path";

import {
    JavaScriptImport,
    JavaScriptModule
} from "./moduleGraph";

const EXTENSIONS = [
    ".ts",
    ".tsx",
    ".js",
    ".jsx"
];

export class JavaScriptModuleResolver {

    constructor(
        private readonly modules:
            Map<string, JavaScriptModule>
    ) {}

    resolveImport(
        importerPath: string,
        imported: JavaScriptImport
    ): JavaScriptModule | undefined {

        if (
            !imported.source.startsWith(".")
        ) {
            return undefined;
        }

        const importerDirectory =
            dirname(importerPath);

        const basePath =
            normalize(
                join(
                    importerDirectory,
                    imported.source
                )
            ).replace(/\\/g, "/");

        const candidates = [
            basePath,
            ...EXTENSIONS.map(
                extension =>
                    `${basePath}${extension}`
            ),
            ...EXTENSIONS.map(
                extension =>
                    `${basePath}/index${extension}`
            )
        ];

        for (const candidate of candidates) {

            if (
                this.modules.has(candidate)
            ) {
                return this.modules.get(
                    candidate
                );
            }
        }

        return undefined;
    }
}