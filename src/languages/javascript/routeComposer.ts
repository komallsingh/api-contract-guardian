import { ApiContract } from "../../core/apiContract";
import { SourceFileContent } from "../../core/sourceFileLoader";

import {
    JavaScriptModule,
    JavaScriptSymbol
} from "./moduleGraph";

import {
    indexModule
} from "./moduleIndexer";

import {
    JavaScriptModuleResolver
} from "./moduleResolver";

import {
    detectMounts,
    JavaScriptMount
} from "./mountDetector";

import {
    detectRoutes,
} from "./routeDetector";
import { JavaScriptRoute
} from "./javascriptRoute";
import {
    extractResponseContract
} from "./responseExtractor";

interface ModuleContext {

    source: SourceFileContent;

    module: JavaScriptModule;

    routes: JavaScriptRoute[];

    mounts: JavaScriptMount[];
}

interface SymbolReference {

    modulePath: string;

    symbolName: string;

    kind: JavaScriptSymbol["kind"];
}

interface MountRelation {

    child: SymbolReference;

    parent: SymbolReference;

    prefix: string;
}

function normalizePath(
    filePath: string
): string {

    return filePath.replace(
        /\\/g,
        "/"
    );
}

function symbolKey(
    reference: SymbolReference
): string {

    return (
        `${reference.modulePath}::` +
        reference.symbolName
    );
}

function combinePaths(
    prefix: string,
    routePath: string
): string {

    const left =
        prefix.replace(
            /^\/+|\/+$/g,
            ""
        );

    const right =
        routePath.replace(
            /^\/+/g,
            ""
        );

    if (!left && !right) {
        return "/";
    }

    if (!left) {
        return `/${right}`;
    }

    if (!right) {
        return `/${left}`;
    }

    return `/${left}/${right}`;
}

function findLocalSymbol(
    module: JavaScriptModule,
    name: string
): JavaScriptSymbol | undefined {

    return module.symbols.find(
        symbol =>
            symbol.name === name
    );
}

function resolveSymbolReference(
    module: JavaScriptModule,
    localName: string,
    modules: Map<
        string,
        JavaScriptModule
    >,
    resolver: JavaScriptModuleResolver
): SymbolReference | undefined {

    const localSymbol =
        findLocalSymbol(
            module,
            localName
        );

    if (localSymbol) {

        return {
            modulePath:
                normalizePath(
                    module.filePath
                ),
            symbolName:
                localSymbol.name,
            kind:
                localSymbol.kind
        };
    }

    const imported =
        module.imports.find(
            candidate =>
                candidate.localName ===
                localName
        );

    if (!imported) {
        return undefined;
    }

    const targetModule =
        resolver.resolveImport(
            normalizePath(
                module.filePath
            ),
            imported
        );

    if (!targetModule) {
        return undefined;
    }

    const exportedName =
        imported.importedName ??
        "default";

    const exported =
        targetModule.exports.find(
            candidate =>
                candidate.exportedName ===
                exportedName
        );

    if (!exported) {
        return undefined;
    }

    const targetSymbol =
        findLocalSymbol(
            targetModule,
            exported.localName
        );

    if (!targetSymbol) {
        return undefined;
    }

    return {
        modulePath:
            normalizePath(
                targetModule.filePath
            ),
        symbolName:
            targetSymbol.name,
        kind:
            targetSymbol.kind
    };
}

function collectPrefixes(
    reference: SymbolReference,
    mountsByChild: Map<
        string,
        MountRelation[]
    >,
    visiting: Set<string>
): string[] {

    const key =
        symbolKey(reference);

    if (visiting.has(key)) {
        return [];
    }

    const relations =
        mountsByChild.get(key) ?? [];

    if (relations.length === 0) {
        return [""];
    }

    const nextVisiting =
        new Set(visiting);

    nextVisiting.add(key);

    const prefixes: string[] = [];

    for (const relation of relations) {

        const parentPrefixes =
            collectPrefixes(
                relation.parent,
                mountsByChild,
                nextVisiting
            );

        for (
            const parentPrefix
            of parentPrefixes
        ) {

            prefixes.push(
                combinePaths(
                    parentPrefix,
                    relation.prefix
                )
            );
        }
    }

    return prefixes;
}

export function discoverJavaScriptContracts(
    sourceFiles: SourceFileContent[]
): ApiContract[] {

    const modules =
        new Map<
            string,
            JavaScriptModule
        >();

    const contexts: ModuleContext[] = [];

    for (const source of sourceFiles) {

        const filePath =
            normalizePath(
                source.path
            );

        const module =
            indexModule(
                source.content,
                filePath
            );

        modules.set(
            filePath,
            module
        );

        contexts.push({
            source,
            module,
            routes:
                detectRoutes(
                    source.content,
                    filePath
                ),
            mounts:
                detectMounts(
                    source.content,
                    filePath
                )
        });
    }

    const resolver =
        new JavaScriptModuleResolver(
            modules
        );

    const mountsByChild =
        new Map<
            string,
            MountRelation[]
        >();

    for (const context of contexts) {

        for (
            const mount
            of context.mounts
        ) {

            const parent =
                resolveSymbolReference(
                    context.module,
                    mount.ownerName,
                    modules,
                    resolver
                );

            const child =
                resolveSymbolReference(
                    context.module,
                    mount.targetName,
                    modules,
                    resolver
                );

            if (
                !parent ||
                !child
            ) {
                continue;
            }

            if (
                (
                    parent.kind !== "APP" &&
                    parent.kind !== "ROUTER"
                ) ||
                (
                    child.kind !== "APP" &&
                    child.kind !== "ROUTER"
                )
            ) {
                continue;
            }

            const relation: MountRelation = {
                child,
                parent,
                prefix: mount.prefix
            };

            const key =
                symbolKey(child);

            const relations =
                mountsByChild.get(key) ?? [];

            relations.push(
                relation
            );

            mountsByChild.set(
                key,
                relations
            );
        }
    }

    const contracts: ApiContract[] = [];

    for (const context of contexts) {

        for (const route of context.routes) {

            const baseContract = {
                ...route.contract,
                response:
                    extractResponseContract(
                        route
                    )
            };

            const routeReference =
                resolveSymbolReference(
                    context.module,
                    route.ownerName,
                    modules,
                    resolver
                );

            if (!routeReference) {

                contracts.push(
                    baseContract
                );

                continue;
            }

            const routeKey =
                symbolKey(
                    routeReference
                );

            if (
                !mountsByChild.has(
                    routeKey
                )
            ) {

                contracts.push(
                    baseContract
                );

                continue;
            }

            const prefixes =
                collectPrefixes(
                    routeReference,
                    mountsByChild,
                    new Set()
                );

            if (prefixes.length === 0) {

                contracts.push(
                    baseContract
                );

                continue;
            }

            const seenPaths =
                new Set<string>();

            for (
                const prefix
                of prefixes
            ) {

                const composedPath =
                    combinePaths(
                        prefix,
                        route.contract.path
                    );

                if (
                    seenPaths.has(
                        composedPath
                    )
                ) {
                    continue;
                }

                seenPaths.add(
                    composedPath
                );

                contracts.push({
                    ...baseContract,
                    path:
                        composedPath
                });
            }
        }
    }

    return contracts;
}