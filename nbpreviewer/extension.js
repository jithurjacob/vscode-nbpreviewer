// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const fs = require("fs");
const nb = require("notebookjs");
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    // create the document content provider
    var previewUri = vscode.Uri.parse('nb-preview://authority/nb-preview');
    var TextDocumentContentProvider = /** @class */ (function () {
            function TextDocumentContentProvider() {
                this._onDidChange = new vscode.EventEmitter();
            }
            TextDocumentContentProvider.prototype.provideTextDocumentContent = function (uri) {
                return this.createIPythonDocument();
            };
            Object.defineProperty(TextDocumentContentProvider.prototype, "onDidChange", {
                get: function () {
                    return this._onDidChange.event;
                },
                enumerable: true,
                configurable: true
            });
            TextDocumentContentProvider.prototype.update = function (uri) {
                this._onDidChange.fire(uri);
            };
            TextDocumentContentProvider.prototype.createIPythonDocument = function () {
                var editor = vscode.window.activeTextEditor;
                if (!(editor.document.languageId === 'ipython')) {
                    return this.errorSnippet("Active editor doesn't show a IPython notebook - cannot preview.");
                }
                return this.extractIPythonBody();
            };
            TextDocumentContentProvider.prototype.extractIPythonBody = function () {
                var editor = vscode.window.activeTextEditor;        
                return this.convertToHTML(editor.document);
                
            };
            TextDocumentContentProvider.prototype.errorSnippet = function (error) {
                return "<body>" + error + "</body>";
            };
            TextDocumentContentProvider.prototype.snippet = function (document) {
                var data = "";
                try{
                    var text = document.getText();
                    var ipynb = JSON.parse(text);
                    var notebook = nb.parse(ipynb);
                    data = "<body>"+notebook.render().outerHTML+"</body>";
                }catch(error){
                    data = this.errorSnippet(error);
                    console.error("An error occured while converting Notebook to HTML",error);
                }
                return data;
            };
            return TextDocumentContentProvider;
        }());
        var provider = new TextDocumentContentProvider();
        var registration = vscode.workspace.registerTextDocumentContentProvider('nb-preview', provider);
        vscode.workspace.onDidChangeTextDocument(function (e) {
            if (e.document === vscode.window.activeTextEditor.document) {
                provider.update(previewUri);
            }
        });
        vscode.window.onDidChangeTextEditorSelection(function (e) {
            if (e.textEditor === vscode.window.activeTextEditor) {
                provider.update(previewUri);
            }
        });



    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "nbpreviewer" is now active!');

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand('extension.showPreview', function (obj) {
        // The code you place here will be executed every time your command is executed
        var filePath = obj['fsPath'];
        var previewPath = filePath+".preview"
        // Display a message box to the user
        vscode.window.showInformationMessage('gonna show' + filePath);
        console.log("starting to read file");
        try {


            var ipynb = JSON.parse(fs.readFileSync(filePath));
            var notebook = nb.parse(ipynb);
            var data = '<html><head lang="en">\
            <base href="">\
            <title>My Prototype</title>\
            <meta name="viewport" content="width=device-width, initial-scale=1">\
        </head><body>' + notebook.render().outerHTML + "</body></html>";
            try {
                fs.writeFileSync(previewPath, data);                
            } catch (e) {
                console.error("Cannot write file ", e);
            }
            
            let success = vscode.commands.executeCommand('vscode.previewHtml', previewPath, vscode.ViewColumn.Two);
                // console.log(data);  
                console.log("done");

        } catch (error) {
            console.error(error);
        }
        console.log("done2");
    });

    context.subscriptions.push(disposable);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;