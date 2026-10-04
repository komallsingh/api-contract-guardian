import ts from "typescript";
import { HttpMethod } from "../../core/apiContract";
import { JavaScriptRoute } from "./javascriptRoute";

const HTTP_METHODS: HttpMethod[] = [
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE"
];

export function detectRoutes(
    sourceCode: string,
    filePath: string
): JavaScriptRoute[] {

    const sourceFile =
        ts.createSourceFile(
            filePath,
            sourceCode,
            ts.ScriptTarget.Latest,
            true
        );

    const routes: JavaScriptRoute[] = [];

    /*
     * Keep track of identifiers that refer to
     * the Express factory function.
     *
     * Example:
     * import express from "express";
     *
     * express is registered as an Express factory.
     */
    const expressFactoryNames =
        new Set<string>(["express"]);

    /*
     * Keep track of variables created by Express.
     *
     * Example:
     * const api = express();
     * const customerRouter = express.Router();
     */
    const expressObjects =
        new Set<string>();

    function collectExpressDefinitions(
    node: ts.Node
): void {

    /*
     * import express from "express"
     */
    if (
        ts.isImportDeclaration(node) &&
        ts.isStringLiteral(
            node.moduleSpecifier
        ) &&
        node.moduleSpecifier.text === "express"
    ) {

        const clause =
            node.importClause;

        if (clause) {

            if (clause.name) {

                expressFactoryNames.add(
                    clause.name.text
                );
            }

            if (
                clause.namedBindings &&
                ts.isNamespaceImport(
                    clause.namedBindings
                )
            ) {

                expressFactoryNames.add(
                    clause
                        .namedBindings
                        .name
                        .text
                );
            }
        }
    }

    /*
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
         * express()
         */
        if (
            ts.isIdentifier(
                initializer.expression
            ) &&
            expressFactoryNames.has(
                initializer.expression.text
            )
        ) {

            expressObjects.add(
                node.name.text
            );
        }

        /*
         * express.Router()
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
                ts.isIdentifier(object) &&
                expressFactoryNames.has(
                    object.text
                ) &&
                method === "Router"
            ) {

                expressObjects.add(
                    node.name.text
                );
            }
        }
    }

    ts.forEachChild(
        node,
        collectExpressDefinitions
    );
}

    /*
     * First collect Express objects.
     *
     * This has to happen before we inspect routes,
     * because the route detector needs to know whether
     * the object is actually an Express app/router.
     */
    collectExpressDefinitions(
        sourceFile
    );

    function visit(node: ts.Node): void {

        if (
            ts.isCallExpression(node) &&
            ts.isPropertyAccessExpression(
                node.expression
            ) &&
            ts.isIdentifier(
                node.expression.expression
            )
        ) {

            const ownerName =
                node.expression
                    .expression
                    .text;

            /*
             * Do not rely on variable names such as
             * "app" or "router".
             *
             * Only accept objects that we identified
             * as being created by Express.
             */
            if (
                !expressObjects.has(
                    ownerName
                )
            ) {
                ts.forEachChild(
                    node,
                    visit
                );
                return;
            }

            const method =
                node.expression
                    .name
                    .text
                    .toUpperCase();

            if (
                !HTTP_METHODS.includes(
                    method as HttpMethod
                )
            ) {
                ts.forEachChild(
                    node,
                    visit
                );
                return;
            }

            const pathArgument =
                node.arguments[0];

            const handlerArgument =
                node.arguments[1];

            if (
                pathArgument &&
                ts.isStringLiteral(
                    pathArgument
                ) &&
                handlerArgument &&
                (
                    ts.isArrowFunction(
                        handlerArgument
                    ) ||
                    ts.isFunctionExpression(
                        handlerArgument
                    )
                )
            ) {

                const { line } =
                    sourceFile
                        .getLineAndCharacterOfPosition(
                            node.getStart(
                                sourceFile
                            )
                        );

                routes.push({
                    ownerName,
                    contract: {
                        method:
                            method as HttpMethod,
                        path:
                            pathArgument.text,
                        file:
                            filePath,
                        line:
                            line + 1
                    },
                    handler:
                        handlerArgument
                });
            }
        }

        ts.forEachChild(
            node,
            visit
        );
    }

    visit(sourceFile);

    return routes;
}