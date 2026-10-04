import * as vscode from "vscode";

import { ContractComparisonService } from "./core/contractComparisonService";
import { JavaScriptParser } from "./languages/javascript/javascriptParser";
import { logger } from "./logger";
import { createDiagnostics } from "./vscode/diagnostics";
import { ConsumerAnalysisService } from "./core/consumerAnalysisService";
import { JavaScriptConsumerParser } from "./languages/javascript/consumerParser";
import { ApiDiscoveryService } from "./core/apiDiscoveryService";
import { GitSourceRepository } from "./core/git/gitSourceRepository";
import { ApiRevisionDiscovery } from "./core/git/apiRevisionDiscovery";

export function activate(context: vscode.ExtensionContext) {

    logger.info("API Contract Guardian activated");

    const diagnosticCollection =
        vscode.languages.createDiagnosticCollection(
            "api-contract-guardian"
        );

    const scanCommand = vscode.commands.registerCommand(
        "api-contract-guardian.scan",
        async () => {

            logger.info("API Contract Guardian scan started");

            const workspaceFolder =
                vscode.workspace.workspaceFolders?.[0];

            if (!workspaceFolder) {

                vscode.window.showErrorMessage(
                    "API Contract Guardian: Please open a project folder before running Scan."
                );

                return;
            }

            const repositoryPath =
                workspaceFolder.uri.fsPath;

            try {

                const apiRevisionDiscovery =
                    new ApiRevisionDiscovery(
                        new GitSourceRepository(
                             repositoryPath
                        ),
                        new ApiDiscoveryService([
                              new JavaScriptParser()
                            ])
                     );

            const service =
                         new ContractComparisonService(
                              repositoryPath,
                              apiRevisionDiscovery
                        );
                const consumerAnalysisService =
                    new ConsumerAnalysisService(
                         repositoryPath,
                     [
                         new JavaScriptConsumerParser()
                        ]
                );

                const baseRevision =
    await vscode.window.showInputBox({
        prompt: "Git revision to compare against",
        value: "HEAD~1",
        placeHolder: "HEAD~1, main, commit SHA, tag..."
    });

if (!baseRevision) {
    return;
}

const result = service.compare(
    baseRevision,
    "HEAD"
);
                const consumers =
    consumerAnalysisService.analyze(
        result.breakingChanges
    );

                const diagnostics =
                    createDiagnostics(
                        result.breakingChanges,
                        result.oldContracts,
                        consumers
                    );

                diagnosticCollection.clear();

                for (
                    const [file, fileDiagnostics]
                    of diagnostics
                ) {

                    const fileUri =
                        vscode.Uri.file(
                            vscode.Uri.joinPath(
                                workspaceFolder.uri,
                                file
                            ).fsPath
                        );

                    diagnosticCollection.set(
                        fileUri,
                        fileDiagnostics
                    );
                }

                logger.info(
                    {
                        breakingChanges:
                            result.breakingChanges.length,
                        consumers: consumers.length
                    },
                    "API Contract Guardian scan completed"
                );

                if (
                    result.breakingChanges.length === 0
                ) {

                    vscode.window.showInformationMessage(
                        "API Contract Guardian: No breaking API changes detected."
                    );

                } else {

                    vscode.window.showWarningMessage(
                        `API Contract Guardian: ${result.breakingChanges.length} breaking change(s) detected.`
                    );
                }

            } catch (error) {

                const message =
                    error instanceof Error
                        ? error.message
                        : String(error);

                logger.error(
                    {
                        error: message,
                        stack:
                            error instanceof Error
                                ? error.stack
                                : undefined
                    },
                    "API Contract Guardian scan failed"
                );

                vscode.window.showErrorMessage(
                    `API Contract Guardian: Scan failed — ${message}`
                );
            }
        }
    );

    context.subscriptions.push(
        scanCommand,
        diagnosticCollection
    );
}

export function deactivate() {
    logger.info(
        "API Contract Guardian deactivated"
    );
}
