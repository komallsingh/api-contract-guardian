import { ApiContract } from "./apiContract";
import { LanguageParser } from "./parser";
import { SourceFileContent } from "./sourceFileLoader";

type RepositoryAwareParser =
    LanguageParser & {
        discoverRepository?: (
            sourceFiles: SourceFileContent[]
        ) => ApiContract[];
    };

export class ApiDiscoveryService {

    constructor(
        private readonly parsers: LanguageParser[]
    ) {}

    discover(
    sourceFiles: SourceFileContent[]
): ApiContract[] {

    const contracts: ApiContract[] = [];

    const filesByParser =
        new Map<
            LanguageParser,
            SourceFileContent[]
        >();

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

        const files =
            filesByParser.get(parser) ?? [];

        files.push(sourceFile);

        filesByParser.set(
            parser,
            files
        );
    }

    for (
        const [parser, files]
        of filesByParser
    ) {

        const repositoryParser =
            parser as RepositoryAwareParser;

        if (
            repositoryParser.discoverRepository
        ) {

            contracts.push(
                ...repositoryParser.discoverRepository(
                    files
                )
            );

            continue;
        }

        for (const sourceFile of files) {

            contracts.push(
                ...parser.parse(
                    sourceFile.content,
                    sourceFile.path
                )
            );
        }
    }

    return contracts;
}
}