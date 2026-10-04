import ts from "typescript";

export interface JavaScriptMount {
    filePath: string;
    ownerName: string;
    targetName: string;
    prefix: string;
    line: number;
}

export function detectMounts(
    sourceCode: string,
    filePath: string
): JavaScriptMount[] {

    const sourceFile =
        ts.createSourceFile(
            filePath,
            sourceCode,
            ts.ScriptTarget.Latest,
            true
        );

    const mounts: JavaScriptMount[] = [];

    function visit(node: ts.Node): void {

        if (ts.isCallExpression(node)) {

            const expression =
                node.expression;

            if (
                ts.isPropertyAccessExpression(
                    expression
                ) &&
                expression.name.text === "use" &&
                ts.isIdentifier(
                    expression.expression
                )
            ) {

                const prefix =
                    node.arguments[0];

                const target =
                    node.arguments[1];

                if (
                    prefix &&
                    ts.isStringLiteral(prefix) &&
                    target &&
                    ts.isIdentifier(target)
                ) {

                    const line =
                        sourceFile
                            .getLineAndCharacterOfPosition(
                                node.getStart(
                                    sourceFile
                                )
                            )
                            .line + 1;

                    mounts.push({
                        filePath,
                        ownerName:
                            expression.expression.text,
                        targetName:
                            target.text,
                        prefix:
                            prefix.text,
                        line
                    });
                }
            }
        }

        ts.forEachChild(
            node,
            visit
        );
    }

    visit(sourceFile);

    return mounts;
}