export type SourceFileLanguage =
    | "javascript"
    | "typescript"
    | "python";

export interface SourceFile {
    path: string;
    language: SourceFileLanguage;
}