import { execFileSync } from "child_process";

import {
    SourceFile,
    SourceFileLanguage
} from "../sourceFile";

import {
    SourceFileContent
} from "../sourceFileLoader";

export class GitSourceRepository {

    constructor(
        private readonly repositoryPath: string
    ) {}

    loadSourceFiles(
        revision: string
    ): SourceFileContent[] {

        const sourceFiles =
            this.listSourceFiles(
                revision
            );

        return sourceFiles.map(
            sourceFile => ({
                ...sourceFile,
                content: this.readFile(
                    revision,
                    sourceFile.path
                )
            })
        );
    }

    private listSourceFiles(
        revision: string
    ): SourceFile[] {

        const output =
            execFileSync(
                "git",
                [
                    "ls-tree",
                    "-r",
                    "--name-only",
                    revision
                ],
                {
                    cwd: this.repositoryPath,
                    encoding: "utf-8"
                }
            );

        return output
            .split(/\r?\n/)
            .filter(Boolean)
            .map(path => {

                const lowerPath =
                    path.toLowerCase();

                if (
                    lowerPath.endsWith(".js") ||
                    lowerPath.endsWith(".jsx")
                ) {
                    return {
                        path,
                        language: "javascript"
                    } as SourceFile;
                }

                if (
                    lowerPath.endsWith(".ts") ||
                    lowerPath.endsWith(".tsx")
                ) {
                    return {
                        path,
                        language: "typescript"
                    } as SourceFile;
                }

                return undefined;
            })
            .filter(
                (
                    sourceFile
                ): sourceFile is SourceFile =>
                    sourceFile !== undefined
            );
    }

    private readFile(
        revision: string,
        filePath: string
    ): string {

        return execFileSync(
            "git",
            [
                "show",
                `${revision}:${filePath}`
            ],
            {
                cwd: this.repositoryPath,
                encoding: "utf-8"
            }
        );
    }
}