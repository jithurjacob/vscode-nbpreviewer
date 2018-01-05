// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const fs = require("fs");
const nb = require("notebookjs");
const Prism = require('node-prismjs');
const nb_style = 'body{background-color:#fff}.nb-html-output{background-color:#333}.nb-stderr {   background-color: #FAA;}.nb-raw-cell{background-color: #f5f2f0;}.nb-output table,.nb-output td,.nb-output th{border:1px solid #000;border-collapse:collapse}.nb-notebook{line-height:1.5}.nb-stderr,.nb-stdout{white-space:pre-wrap;margin:1em 0;padding:.1em .5em}.nb-stderr{background-color:#FAA}.nb-cell+.nb-cell{margin-top:.5em}.nb-output th{font-weight:700}.nb-output td,.nb-output th{padding:.25em;text-align:left;vertical-align:middle}.nb-cell{position:relative}.nb-raw-cell{white-space:pre-wrap;background-color:#f5f2f0;font-family:Consolas,Monaco,"Andale Mono",monospace;padding:1em;margin:.5em 0}.nb-output{min-height:1em;width:100%;overflow-x:scroll;border-right:1px dotted #CCC}.nb-output img{max-width:100%}.nb-input:before,.nb-output:before{position:absolute;font-family:monospace;color:#999;left:-7.5em;width:7em;text-align:right}.nb-input:before{content:"In [" attr(data-prompt-number) "]:"}.nb-output:before{content:"Out [" attr(data-prompt-number) "]:"}// Fix pandas dataframe formatting div[style="max-height:1000px;max-width:1500px;overflow:auto;"]{max-height:none!important}';
//require('prismjs/components/python')
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
     // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "nbpreviewer" is now active!');


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
                    return this.errorMessage("Active editor doesn't show a IPython notebook - cannot preview.");
                }
                return this.extractIPythonBody();
            };
            TextDocumentContentProvider.prototype.extractIPythonBody = function () {
                var editor = vscode.window.activeTextEditor;        
                return this.convertToHTML(editor.document);
                
            };
            TextDocumentContentProvider.prototype.errorMessage = function (error) {
                return "<body>" + error + "</body>";
            };
            TextDocumentContentProvider.prototype.convertToHTML = function (document) {
                var data = "";
                try{
                    var text = document.getText();
                    var ipynb = JSON.parse(text);
                    var notebook = nb.parse(ipynb);
                    data = "<style>"+nb_style+ "</style><body>"+notebook.render().outerHTML+"</body>";
                }catch(error){
                    data = this.errorMessage(error);
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

   
    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand('extension.showPreview', function (obj) {
        // The code you place here will be executed every time your command is executed
        return vscode.commands.executeCommand('vscode.previewHtml', previewUri, vscode.ViewColumn.Two, 'IPython Notebook Preview').then(function (success) {
        }, function (reason) {
            vscode.window.showErrorMessage(reason);
        });
    });

    context.subscriptions.push(disposable, registration);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;