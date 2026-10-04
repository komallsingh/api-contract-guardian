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

    function visit(node: ts.Node): void {

        /*
         * const customerRoutes = express.Router();
         */
        if (
            ts.isVariableDeclaration(node) &&
            ts.isIdentifier(node.name) &&
            node.initializer
        ) {

            const initializer =
                node.initializer;

            if (
                ts.isCallExpression(initializer) &&
                ts.isPropertyAccessExpression(
                    initializer.expression
                )
            ) {

                const object =
                    initializer.expression.expression;

                const method =
                    initializer.expression.name.text;

                if (
                    ts.isIdentifier(object) &&
                    object.text === "express" &&
                    method === "Router"
                ) {

                    symbols.push({
                        name: node.name.text,
                        kind: "ROUTER",
                        filePath
                    });
                }
            }
        }

        /*
         * import customerRouter from "./routes/customerRoutes";
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
             * Default import
             */
            if (clause.name) {

                imports.push({
                    localName:
                        clause.name.text,
                    source,
                    filePath
                });
            }

            /*
             * Named imports
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
        }

        /*
         * export default customerRoutes;
         */
        if (
            ts.isExportAssignment(node) &&
            !node.isExportEquals &&
            ts.isIdentifier(node.expression)
        ) {

            exports.push({
                localName:
                    node.expression.text,
                exportedName: "default",
                isDefault: true,
                filePath
            });
        }

        /*
         * export { customerRoutes };
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

                const localName =
                    element.propertyName?.text ??
                    element.name.text;

                const exportedName =
                    element.name.text;

                exports.push({
                    localName,
                    exportedName,
                    isDefault: false,
                    filePath
                });
            }
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