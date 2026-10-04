import {
    ApiContract
} from "../apiContract";

import {
    ApiDiscoveryService
} from "../apiDiscoveryService";

import {
    LanguageParser
} from "../parser";

import {
    GitSourceRepository
} from "./gitSourceRepository";

export class ApiRevisionDiscovery {

    constructor(
        private readonly repository:
            GitSourceRepository,
        private readonly apiDiscovery:
            ApiDiscoveryService
    ) {}

    discover(
        revision: string
    ): ApiContract[] {

        const sourceFiles =
            this.repository.loadSourceFiles(
                revision
            );

        return this.apiDiscovery.discover(
            sourceFiles
        );
    }
}