const vscode = require("vscode");
const path = require("path");
const fs = require("fs");
const mkdirp = require("mkdirp");
const util = require("util");

const extensionHandlers = {
  ".slim": "== render '%s'",
  ".haml": "= render '%s'",
  ".erb": "<%= render '%s' %>"
};

const activate = context => {
  const command = vscode.commands.registerCommand(
    "rails-partial.createPartial",
    () => {
      const currentFile = vscode.window.activeTextEditor.document.fileName;
      if (!isRailsView(currentFile)) {
        vscode.window.showErrorMessage("Looks like it's not a Rails view file");
        return;
      }

      if (!isSupportedExtension(currentFile)) {
        vscode.window.showErrorMessage("File extension is not supported.");
        return;
      }

      const selection = vscode.window.activeTextEditor.selection;
      if (selection.isEmpty) {
        vscode.window.showErrorMessage("Please select something first.");
        return;
      }

      vscode.window
        .showInputBox({ prompt: "Give your partial a name:" })
        .then(value => {
          // Create a dir if needed
          const targetDir = resolveTargetDir(currentFile, value);
          if (!fs.existsSync(targetDir)) {
            mkdirp.sync(targetDir);
          }

          // Create partial with selected content
          fs.writeFileSync(
            path.resolve(
              targetDir,
              "_" +
                path.basename(value) +
                path.basename(currentFile).match(/\..+/)[0]
            ),
            vscode.window.activeTextEditor.document.getText(selection)
          );

          // Replace current file content with corresponding `render` method
          const edit = new vscode.WorkspaceEdit();
          edit.replace(
            vscode.window.activeTextEditor.document.uri,
            selection,
            util.format(extensionHandlers[path.extname(currentFile)], value)
          );
          vscode.workspace.applyEdit(edit);
        });
    }
  );

  context.subscriptions.push(command);
};

const deactivate = () => {
  // ...
};

const isRailsView = fileName => {
  return path.dirname(fileName).includes("app/views");
};

const isSupportedExtension = fileName => {
  return extensionHandlers[path.extname(fileName)] !== undefined;
};

const resolveTargetDir = (currentFile, partialName) => {
  let dir = path.dirname(currentFile);
  const partialDir = path.dirname(partialName);
  if (partialDir !== ".") {
    dir = dir.match(/^(.+\/app\/views)\//)[1];
  }

  return path.resolve(dir, partialDir);
};

module.exports = {
  activate,
  deactivate
};
