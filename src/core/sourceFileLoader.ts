import { readFileSync } from "fs";
import { join } from "path";

import {
    SourceFile,
    SourceFileLanguage
} from "./sourceFile";

export interface SourceFileContent {
    path: string;
    language: SourceFileLanguage;
    content: string;
}

export function loadSourceFiles(
    rootDirectory: string,
    sourceFiles: SourceFile[]
): SourceFileContent[] {

    return sourceFiles.map(
        sourceFile => ({
            ...sourceFile,
            content: readFileSync(
                join(
                    rootDirectory,
                    sourceFile.path
                ),
                "utf-8"
            )
        })
    );
}