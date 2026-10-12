import ts from "typescript";
import {
    ResponseContract,
    ResponseField
} from "../../core/apiContract";
import { JavaScriptRoute } from "./javascriptRoute";

export function extractResponseContract(
    route: JavaScriptRoute
): ResponseContract | undefined {

    let responseContract: ResponseContract | undefined;

    function visit(node: ts.Node) {

        if (responseContract) {
            return;
        }

        if (ts.isCallExpression(node)) {

            const expression = node.expression;

            if (
                ts.isPropertyAccessExpression(expression) &&
                expression.name.text === "json"
            ) {

                const object = expression.expression;

                if (isResponseObject(object)) {

                    const responseArgument = node.arguments[0];

                    if (
                        responseArgument &&
                        ts.isObjectLiteralExpression(responseArgument)
                    ) {

                        const fields: ResponseField[] = [];

                        for (
                            const property of responseArgument.properties
                        ) {

                            if (
                                !ts.isPropertyAssignment(property)
                            ) {
                                continue;
                            }

                            const name = getPropertyName(property);

                            if (!name) {
                                continue;
                            }

                            const type = getValueType(property.initializer);

                            if (!type) {
                                continue;
                            }

                            fields.push({
                                name,
                                type
                            });
                        }

                        responseContract = {
                            fields
                        };

                        return;
                    }
                }
            }
        }

        ts.forEachChild(node, visit);
    }

    function isResponseObject(
        expression: ts.Expression
    ): boolean {

        if (
            ts.isIdentifier(expression) &&
            expression.text === "res"
        ) {
            return true;
        }

        if (ts.isCallExpression(expression)) {

            if (
                ts.isPropertyAccessExpression(expression.expression) &&
                expression.expression.name.text === "status"
            ) {

                if (
                    ts.isIdentifier(expression.expression.expression) &&
                    expression.expression.expression.text === "res"
                ) {
                    return true;
                }
            }
        }

        return false;
    }

    function getPropertyName(
        property: ts.PropertyAssignment
    ): string | undefined {

        const name = property.name;

        if (ts.isIdentifier(name)) {
            return name.text;
        }

        if (ts.isStringLiteral(name)) {
            return name.text;
        }

        return undefined;
    }

    function getValueType(
        value: ts.Expression
    ): string | undefined {

        if (ts.isNumericLiteral(value)) {
            return "number";
        }

        if (ts.isStringLiteral(value)) {
            return "string";
        }

        if (
            value.kind === ts.SyntaxKind.TrueKeyword ||
            value.kind === ts.SyntaxKind.FalseKeyword
        ) {
            return "boolean";
        }

        if (value.kind === ts.SyntaxKind.NullKeyword) {
            return "null";
        }

        return undefined;
    }

    visit(route.handler);

    return responseContract;
}