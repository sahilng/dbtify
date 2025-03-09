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
	// Replace quoted fully qualified table references first.
	const quotedRegex = /"([^"]+)"\."([^"]+)"\."([^"]+)"/g;
	text = text.replace(quotedRegex, (_match, _db, _schema, table) => {
	  return `{{ ref('${table}') }}`;
	});
  
	// Then replace unquoted fully qualified table references.
	const unquotedRegex = /\b([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)\b/g;
	text = text.replace(unquotedRegex, (_match, _db, _schema, table) => {
	  return `{{ ref('${table}') }}`;
	});
  
	return text;
}  

// This method is called when your extension is deactivated
export function deactivate() {}
