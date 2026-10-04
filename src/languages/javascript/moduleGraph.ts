export type JavaScriptSymbolKind =
    | "APP"
    | "ROUTER";

export interface JavaScriptSymbol {
    name: string;
    kind: JavaScriptSymbolKind;
    filePath: string;
    exportedAs?: string;
}

export interface JavaScriptImport {
    localName: string;
    importedName?: string;
    source: string;
    filePath: string;
}

export interface JavaScriptExport {
    localName: string;
    exportedName: string;
    isDefault: boolean;
    filePath: string;
}

export interface JavaScriptModule {
    filePath: string;
    symbols: JavaScriptSymbol[];
    imports: JavaScriptImport[];
    exports: JavaScriptExport[];
}