// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const fs = require("fs");
const nb = require("notebookjs");
const Prism = require('node-prismjs');
const cheerio = require('cheerio');


const nb_style = "body{background-color:#fff;color:#000}.nb-output table,.nb-output td,.nb-output th{border:1px solid #000;border-collapse:collapse}.nb-notebook th,.nb-output th{font-weight:700}.nb-notebook{padding:1% 5% 1% 10%;background-color:#fff;line-height:1.5}.nb-stderr,.nb-stdout{white-space:pre-wrap;margin:1em 0;padding:.1em .5em}.nb-stderr{background-color:#FAA}.nb-cell+.nb-cell{margin-top:.5em}.nb-output td,.nb-output th{padding:.25em;text-align:left;vertical-align:middle}.nb-cell{position:relative}.nb-raw-cell{white-space:pre-wrap;background-color:#f5f2f0;font-family:Consolas,Monaco,'Andale Mono',monospace;padding:1em;margin:.5em 0}.nb-output{min-height:1em;width:100%;overflow-x:auto;border-right:1px dotted #CCC}.nb-output img{max-width:100%}.nb-input:before,.nb-output:before{position:absolute;font-family:monospace;color:#999;left:-7.5em;width:7em;text-align:right}.nb-input:before{content:'In [' attr(data-prompt-number) ']:'}.nb-output:before{content:'Out [' attr(data-prompt-number) ']:'}div[style='max-height:1000px;max-width:1500px;overflow:auto;']{max-height:none!important}.nb-notebook .nb-input{border:1px solid #cfcfcf;border-radius:2px;background:#f7f7f7;line-height:1.21429em;font-family:monospace;min-height:30px;overflow-x: auto;}.nb-notebook pre{margin:10px;padding:0}.nb-notebook code{font-size:14px}.nb-notebook p code{padding:1px 5px}.nb-notebook code,.nb-notebook pre{color:#000}.nb-notebook blockquote{margin:1em 2em}.nb-notebook *+img,.nb-notebook *+p,.nb-notebook *+table{margin-top:1em}.nb-notebook table{margin-left:auto;margin-right:auto;border:none;border-collapse:collapse;border-spacing:0;color:#000;font-size:12px;table-layout:fixed;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif}.nb-notebook thead{border-bottom:1px solid #000;vertical-align:bottom}.nb-notebook td,.nb-notebook th,.nb-notebook tr{text-align:right;vertical-align:middle;padding:.5em;line-height:normal;white-space:normal;max-width:none;border:none}.nb-notebook tbody tr:nth-child(odd){background:#f5f5f5}.nb-notebook tbody tr:hover{background:rgba(66,165,245,.2)}.nb-notebook p{text-align:left}.nb-notebook img{display:block;margin-left:auto;margin-right:auto}.nb-notebook img,.nb-notebook svg{max-width:100%;height:auto}"+"code[class*=language-],pre[class*=language-]{color:#000;background:0 0;text-shadow:0 1px #fff;font-family:Consolas,Monaco,'Andale Mono','Ubuntu Mono',monospace;text-align:left;white-space:pre;word-spacing:normal;word-break:normal;word-wrap:normal;line-height:1.5;-moz-tab-size:4;-o-tab-size:4;tab-size:4;-webkit-hyphens:none;-moz-hyphens:none;-ms-hyphens:none;hyphens:none}code[class*=language-] ::-moz-selection,code[class*=language-]::-moz-selection,pre[class*=language-] ::-moz-selection,pre[class*=language-]::-moz-selection{text-shadow:none;background:#b3d4fc}code[class*=language-] ::selection,code[class*=language-]::selection,pre[class*=language-] ::selection,pre[class*=language-]::selection{text-shadow:none;background:#b3d4fc}@media print{code[class*=language-],pre[class*=language-]{text-shadow:none}}pre[class*=language-]{padding:1em;margin:.5em 0;overflow:auto}:not(pre)>code[class*=language-],pre[class*=language-]{background:#f5f2f0}:not(pre)>code[class*=language-]{padding:.1em;border-radius:.3em;white-space:normal}.token.cdata,.token.comment,.token.doctype,.token.prolog{color:#708090}.token.punctuation{color:#999}.namespace{opacity:.7}.token.boolean,.token.constant,.token.deleted,.token.number,.token.property,.token.symbol,.token.tag{color:#905}.token.attr-name,.token.builtin,.token.char,.token.inserted,.token.selector,.token.string{color:#690}.language-css .token.string,.style .token.string,.token.entity,.token.operator,.token.url{color:#a67f59;background:hsla(0,0%,100%,.5)}.token.atrule,.token.attr-value,.token.keyword{color:#07a}.token.function{color:#DD4A68}.token.important,.token.regex,.token.variable{color:#e90}.token.bold,.token.important{font-weight:700}.token.italic{font-style:italic}.token.entity{cursor:help}";
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

                    data = "<style>"+nb_style+ "</style><body>"+notebook_html+"</body>";
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