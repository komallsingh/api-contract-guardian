import {
    readdirSync,
    statSync
} from "fs";

import {
    join,
    relative
} from "path";

import {
    SourceFile,
    SourceFileLanguage
} from "./sourceFile";

const IGNORED_DIRECTORIES = new Set([
    ".git",
    "node_modules",
    ".vscode",
    ".vscode-test",
    "dist",
    "out",
    "coverage",
    "build",
    ".next"
]);

function getLanguage(
    filePath: string
): SourceFileLanguage | undefined {

    const lowerPath =
        filePath.toLowerCase();

    if (
        lowerPath.endsWith(".js") ||
        lowerPath.endsWith(".jsx")
    ) {
        return "javascript";
    }

    if (
        lowerPath.endsWith(".ts") ||
        lowerPath.endsWith(".tsx")
    ) {
        return "typescript";
    }

    return undefined;
}

export function discoverSourceFiles(
    rootDirectory: string
): SourceFile[] {

    const files: SourceFile[] = [];

    function visit(
        directory: string
    ): void {

        for (
            const entry
            of readdirSync(directory)
        ) {

            if (
                IGNORED_DIRECTORIES.has(
                    entry
                )
            ) {
                continue;
            }

            const fullPath =
                join(
                    directory,
                    entry
                );

            const stat =
                statSync(fullPath);

            if (stat.isDirectory()) {

                visit(fullPath);

                continue;
            }

            const relativePath =
                relative(
                    rootDirectory,
                    fullPath
                ).replace(/\\/g, "/");

            const language =
                getLanguage(relativePath);

            if (!language) {
                continue;
            }

            files.push({
                path: relativePath,
                language
            });
        }
    }

    visit(rootDirectory);

    return files;
}