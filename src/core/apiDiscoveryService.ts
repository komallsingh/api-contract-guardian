import { ApiContract } from "./apiContract";
import { LanguageParser } from "./parser";
import { SourceFileContent } from "./sourceFileLoader";

export class ApiDiscoveryService {

    constructor(
        private readonly parsers: LanguageParser[]
    ) {}

    discover(
        sourceFiles: SourceFileContent[]
    ): ApiContract[] {

        const contracts: ApiContract[] = [];

        for (const sourceFile of sourceFiles) {

            const parser =
                this.parsers.find(
                    candidate =>
                        candidate.supports(
                            sourceFile.path
                        )
                );

            if (!parser) {
                continue;
            }

            contracts.push(
                ...parser.parse(
                    sourceFile.content,
                    sourceFile.path
                )
            );
        }

        return contracts;
    }
}