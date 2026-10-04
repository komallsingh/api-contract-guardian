export type SourceFileLanguage =
    | "javascript"
    | "typescript";

export interface SourceFile {
    path: string;
    language: SourceFileLanguage;
}