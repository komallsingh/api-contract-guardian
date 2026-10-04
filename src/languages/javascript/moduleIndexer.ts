import ts from "typescript";

import {
    JavaScriptExport,
    JavaScriptImport,
    JavaScriptModule,
    JavaScriptSymbol
} from "./moduleGraph";

export function indexModule(
    sourceCode: string,
    filePath: string
): JavaScriptModule {

    const sourceFile =
        ts.createSourceFile(
            filePath,
            sourceCode,
            ts.ScriptTarget.Latest,
            true
        );

    const symbols: JavaScriptSymbol[] = [];
    const imports: JavaScriptImport[] = [];
    const exports: JavaScriptExport[] = [];

    /*
     * Express factory names.
     *
     * "express" is included so small source snippets
     * such as `const app = express()` can be analyzed
     * even when the import is omitted from the snippet.
     */
    const expressFactoryNames =
        new Set<string>(["express"]);

    function isExpressFactory(
        node: ts.Expression
    ): boolean {

        return (
            ts.isIdentifier(node) &&
            expressFactoryNames.has(node.text)
        );
    }

    function visit(node: ts.Node): void {

        /*
         * Imports
         *
         * We record imports from ANY module.
         *
         * Example:
         * import customerRouter
         *     from "./customerRoutes";
         */
        if (ts.isImportDeclaration(node)) {

            if (
                !ts.isStringLiteral(
                    node.moduleSpecifier
                )
            ) {
                return;
            }

            const source =
                node.moduleSpecifier.text;

            const clause =
                node.importClause;

            if (!clause) {
                return;
            }

            /*
             * import express from "express";
             *
             * import customerRouter
             *     from "./customerRoutes";
             */
            if (clause.name) {

                imports.push({
                    localName:
                        clause.name.text,
                    source,
                    filePath
                });

                if (source === "express") {

                    expressFactoryNames.add(
                        clause.name.text
                    );
                }
            }

            /*
             * import * as express from "express";
             *
             * import * as routes from "./routes";
             */
            if (
                clause.namedBindings &&
                ts.isNamespaceImport(
                    clause.namedBindings
                )
            ) {

                const localName =
                    clause.namedBindings.name.text;

                imports.push({
                    localName,
                    source,
                    filePath
                });

                if (source === "express") {

                    expressFactoryNames.add(
                        localName
                    );
                }
            }

            /*
             * import {
             *     customerRouter
             * } from "./routes";
             */
            if (
                clause.namedBindings &&
                ts.isNamedImports(
                    clause.namedBindings
                )
            ) {

                for (
                    const element
                    of clause.namedBindings.elements
                ) {

                    imports.push({
                        localName:
                            element.name.text,
                        importedName:
                            element.propertyName?.text ??
                            element.name.text,
                        source,
                        filePath
                    });
                }
            }

            return;
        }

        /*
         * CommonJS:
         *
         * const express = require("express");
         */
        if (
            ts.isVariableDeclaration(node) &&
            ts.isIdentifier(node.name) &&
            node.initializer &&
            ts.isCallExpression(
                node.initializer
            ) &&
            ts.isIdentifier(
                node.initializer.expression
            ) &&
            node.initializer.expression.text ===
                "require"
        ) {

            const argument =
                node.initializer.arguments[0];

            if (
                argument &&
                ts.isStringLiteral(argument) &&
                argument.text === "express"
            ) {

                expressFactoryNames.add(
                    node.name.text
                );
            }
        }

        /*
         * Variables created by Express.
         *
         * const api = express();
         *
         * const customerRouter =
         *     express.Router();
         */
        if (
            ts.isVariableDeclaration(node) &&
            ts.isIdentifier(node.name) &&
            node.initializer &&
            ts.isCallExpression(
                node.initializer
            )
        ) {

            const initializer =
                node.initializer;

            /*
             * const api = express();
             */
            if (
                isExpressFactory(
                    initializer.expression
                )
            ) {

                symbols.push({
                    name:
                        node.name.text,
                    kind:
                        "APP",
                    filePath
                });
            }

            /*
             * const customerRouter =
             *     express.Router();
             */
            if (
                ts.isPropertyAccessExpression(
                    initializer.expression
                )
            ) {

                const object =
                    initializer
                        .expression
                        .expression;

                const method =
                    initializer
                        .expression
                        .name
                        .text;

                if (
                    isExpressFactory(object) &&
                    method === "Router"
                ) {

                    symbols.push({
                        name:
                            node.name.text,
                        kind:
                            "ROUTER",
                        filePath
                    });
                }
            }
        }

        /*
         * export default customerRoutes;
         */
        if (
            ts.isExportAssignment(node) &&
            !node.isExportEquals &&
            ts.isIdentifier(
                node.expression
            )
        ) {

            exports.push({
                localName:
                    node.expression.text,
                exportedName:
                    "default",
                isDefault:
                    true,
                filePath
            });

            return;
        }

        /*
         * export {
         *     customerRoutes
         * };
         */
        if (ts.isExportDeclaration(node)) {

            if (
                !node.exportClause ||
                !ts.isNamedExports(
                    node.exportClause
                )
            ) {
                return;
            }

            for (
                const element
                of node.exportClause.elements
            ) {

                exports.push({
                    localName:
                        element.propertyName?.text ??
                        element.name.text,
                    exportedName:
                        element.name.text,
                    isDefault:
                        false,
                    filePath
                });
            }

            return;
        }

        ts.forEachChild(
            node,
            visit
        );
    }

    visit(sourceFile);

    return {
        filePath,
        symbols,
        imports,
        exports
    };
}