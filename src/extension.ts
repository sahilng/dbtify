// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Command for transforming the entire file
  const transformEntireFile = vscode.commands.registerCommand('dbtify.transformEntireFile', () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showInformationMessage('No active editor found.');
      return;
    }
    const document = editor.document;
    const fullText = document.getText();
    const transformed = transformText(fullText);
    // Define the full range of the document
    const fullRange = new vscode.Range(
      document.positionAt(0),
      document.positionAt(fullText.length)
    );
    editor.edit(editBuilder => {
      editBuilder.replace(fullRange, transformed);
    });
  });

  // Command for transforming just the current selection
  const transformSelection = vscode.commands.registerCommand('dbtify.transformSelection', () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showInformationMessage('No active editor found.');
      return;
    }
    const selection = editor.selection;
    const selectedText = editor.document.getText(selection);
    const transformed = transformText(selectedText);
    editor.edit(editBuilder => {
      editBuilder.replace(selection, transformed);
    });
  });

  context.subscriptions.push(transformEntireFile, transformSelection);
}

function transformText(text: string): string {
  // This prefix matches:
  // - FROM
  // - Any join type that ends with JOIN (e.g. LEFT JOIN, RIGHT JOIN, etc.)
  // - A comma (for additional tables in a list)
  const prefixPattern = '((?:\\b(?:FROM|(?:\\w+\\s+)?JOIN)\\b|\\s*,)\\s+)';
  
  // This pattern matches a qualified table reference with at least two parts,
  // where each part can be either quoted ("identifier") or unquoted (identifier)
  const qualifiedRegex = new RegExp(
    prefixPattern + '((?:"[^"]+"|[a-zA-Z0-9_]+)(?:\\.(?:"[^"]+"|[a-zA-Z0-9_]+))+)',
    'gi'
  );

  return text.replace(qualifiedRegex, (_match, prefix, qualifiedName) => {
    // Split the qualified name into parts (e.g. [db, schema, table] or [schema, table])
    const parts = qualifiedName.split('.');
    // Use the last part as the table name and remove any quotes from it
    let tableName = parts[parts.length - 1].replace(/^"|"$/g, '');
    return `${prefix}{{ ref('${tableName}') }}`;
  });
}

// This method is called when your extension is deactivated
export function deactivate() {}
