import { ApiContract } from "../../core/apiContract";
import { LanguageParser } from "../../core/parser";
import { detectRoutes } from "./routeDetector";
import { extractResponseContract } from "./responseExtractor";

export class JavaScriptParser implements LanguageParser {

    supports(filePath: string): boolean {

        return (
            filePath.toLowerCase().endsWith(".js") ||
            filePath.endsWith(".jsx") ||
            filePath.endsWith(".ts") ||
            filePath.endsWith(".tsx")
        );
    }

    parse(
        sourceCode: string,
        filePath: string
    ): ApiContract[] {

        const routes = detectRoutes(
            sourceCode,
            filePath
        );

        return routes.map(route => {

            const response = extractResponseContract(route);

            return {
                ...route.contract,
                response
            };
        });
    }
}