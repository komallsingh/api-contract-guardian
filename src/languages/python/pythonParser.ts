import {
    ApiContract,
    ResponseContract,
    ResponseField
} from "../../core/apiContract";
import { LanguageParser } from "../../core/parser";

export class PythonParser implements LanguageParser {
    supports(filePath: string): boolean {
        return filePath.toLowerCase().endsWith(".py");
    }

    parse(
        sourceCode: string,
        filePath: string
    ): ApiContract[] {
        const contracts: ApiContract[] = [];
        const lines = sourceCode.split(/\r?\n/);

        const routePattern =
    /^\s*@(?:\w+\.)?(get|post|put|patch|delete|route)\(\s*["']([^"']+)["'](.*?)\)\s*$/i;

for (let index = 0; index < lines.length; index++) {
    const match = lines[index].match(routePattern);

    if (!match) {
        continue;
    }

    const decorator = match[1].toLowerCase();
    const path = match[2];
    const options = match[3];

    let methods: string[];

    if (decorator === "route") {
        const methodsMatch = options.match(
            /methods\s*=\s*\[([^\]]*)\]/i
        );

        methods = methodsMatch
            ? [...methodsMatch[1].matchAll(/["'](GET|POST|PUT|PATCH|DELETE)["']/gi)]
                .map(method => method[1].toUpperCase())
            : ["GET"];
    } else {
        methods = [decorator.toUpperCase()];
    }

    const response = this.extractResponse(lines, index);

    for (const method of methods) {
        contracts.push({
            method: method as ApiContract["method"],
            path,
            file: filePath,
            line: index + 1,
            response
        });
    }
}

        return contracts;
    }

    private extractResponse(
        lines: string[],
        decoratorLine: number
    ): ResponseContract | undefined {
        let functionLine = decoratorLine + 1;

        while (
            functionLine < lines.length &&
            !/^\s*(?:async\s+)?def\s+\w+\s*\(/.test(
                lines[functionLine]
            )
        ) {
            functionLine++;
        }

        if (functionLine >= lines.length) {
            return undefined;
        }

        const functionIndent =
            lines[functionLine].match(/^\s*/)?.[0].length ?? 0;

        for (
            let index = functionLine + 1;
            index < lines.length;
            index++
        ) {
            const line = lines[index];

            if (!line.trim()) {
                continue;
            }

            const indentation =
                line.match(/^\s*/)?.[0].length ?? 0;

            if (indentation <= functionIndent) {
                break;
            }

            if (!/^\s*return\s+\{/.test(line)) {
                continue;
            }

            const fields: ResponseField[] = [];

            for (
                let fieldIndex = index;
                fieldIndex < lines.length;
                fieldIndex++
            ) {
                const fieldLine = lines[fieldIndex];

                const fieldIndent =
                    fieldLine.match(/^\s*/)?.[0].length ?? 0;

                if (
                    fieldIndex > index &&
                    fieldLine.trim() &&
                    fieldIndent <= functionIndent
                ) {
                    break;
                }

                const fieldMatch = fieldLine.match(
                    /^\s*["']?([A-Za-z_]\w*)["']?\s*:\s*(.+?)\s*,?\s*$/
                );

                if (!fieldMatch) {
                    continue;
                }

                const type = this.inferPythonType(
                    fieldMatch[2]
                );

                if (!type) {
                    continue;
                }

                fields.push({
                    name: fieldMatch[1],
                    type
                });
            }

            return { fields };
        }

        return undefined;
    }

    private inferPythonType(value: string): string | undefined {
        const normalized = value.trim().replace(/,\s*$/, "");

        if (
            /^["']/.test(normalized) &&
            /["']$/.test(normalized)
        ) {
            return "string";
        }

        if (/^-?\d+(?:\.\d+)?$/.test(normalized)) {
            return "number";
        }

        if (/^(True|False)$/.test(normalized)) {
            return "boolean";
        }

        if (/^None$/.test(normalized)) {
            return "null";
        }

        return undefined;
    }
}