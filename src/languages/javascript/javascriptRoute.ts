import ts from "typescript";
import { ApiContract } from "../../core/apiContract";

export interface JavaScriptRoute {
    ownerName: string;
    contract: ApiContract;
    handler:
        | ts.ArrowFunction
        | ts.FunctionExpression;
}