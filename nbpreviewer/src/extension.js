// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const fs = require("fs");
const nb = require("./notebookjs");
const Prism = require('node-prismjs');
const cheerio = require('cheerio');
const fileUrl = require("file-url");
var path = require("path");

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
                    var notebook_html = notebook.render().outerHTML;
                    //traverse through notebook and use prism to highlight
                    const $ = cheerio.load(notebook_html);
                    var elems = $('.nb-input pre code');
                    for (var i=0; i < elems.length; i++) {
                        var formatted_text = Prism.highlight($(elems[i]).text(), Prism.languages.python);
                        $(elems[i]).html(formatted_text);     // modify inner HTML
                    }
                    notebook_html = $.html();
                    
                    var notebook_style_path = fileUrl(
                        path.join(
                            __dirname,
                            "..",
                            "static",
                            "notebook.css"
                        ));
                    var prism_style_path = fileUrl(path.join(
                        __dirname,
                        "..",
                        "static",
                        "prism.css"
                    ));

                    var require_script_path = fileUrl(path.join(
                        __dirname,
                        "..",
                        "static",
                        "require.js"
                    ));

                    data = '<link  href="'+notebook_style_path+'"  rel="stylesheet" />';                    
                    data += '<link href="'+prism_style_path+'"  rel="stylesheet" />';
                    data += '<script src="'+require_script_path+'" ></script>';
                    data += "<body>"+notebook_html+"</body>";
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

        
        // vscode.workspace.onDidChangeTextDocument(function (e) {
        //     if (e.document === vscode.window.activeTextEditor.document) {
        //         provider.update(previewUri);
        //     }
        // });
        // vscode.window.onDidChangeTextEditorSelection(function (e) {
        //     if (e.textEditor === vscode.window.activeTextEditor) {
        //         provider.update(previewUri);
        //     }
        // });

   
    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand('extension.showPreview', function (obj) {
        
        console.log("showing preview for",previewUri);
        provider.update(previewUri);
        // The code you place here will be executed every time your command is executed
        return vscode.commands.executeCommand('vscode.previewHtml', previewUri, vscode.ViewColumn.Two, 'IPython Notebook Preview').then(function (success) {
            console.log("successfully showed notebook");
        }, function (reason) {
            vscode.window.showErrorMessage("An error occured while rendering the Notebook",reason);
        });
    });

    context.subscriptions.push(disposable, registration);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;