const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

function activate(context) {
    const disposable = vscode.commands.registerCommand('azkabanSimulator.open', () => {
        const panel = vscode.window.createWebviewPanel(
            'azkabanSimulator',
            'Azkaban Simulator',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'web')]
            }
        );

        panel.webview.html = getIndexHtml(context.extensionUri, panel.webview);

        panel.webview.onDidReceiveMessage(
            async (message) => {
                if (!message || !message.type) {
                    return;
                }
                switch (message.type) {
                    case 'selectZip': {
                        const uris = await vscode.window.showOpenDialog({
                            canSelectMany: false,
                            openLabel: '选择 ZIP',
                            filters: { 'ZIP files': ['zip'] }
                        });
                        if (uris && uris.length > 0) {
                            try {
                                const data = await vscode.workspace.fs.readFile(uris[0]);
                                const base64 = Buffer.from(data).toString('base64');
                                panel.webview.postMessage({
                                    type: 'zipContent',
                                    base64: base64,
                                    filename: path.basename(uris[0].fsPath)
                                });
                            } catch (err) {
                                vscode.window.showErrorMessage(`读取 ZIP 失败: ${err.message}`);
                            }
                        }
                        break;
                    }
                    case 'openJob': {
                        openJobPanel(context, message.params);
                        break;
                    }
                }
            },
            undefined,
            context.subscriptions
        );
    });

    context.subscriptions.push(disposable);
}

function openJobPanel(context, params) {
    const panel = vscode.window.createWebviewPanel(
        'azkabanSimulatorJob',
        `Job: ${(params && params.node) || '详情'}`,
        vscode.ViewColumn.Two,
        {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'web')]
        }
    );

    const query = new URLSearchParams(params).toString();
    const jobFilePath = path.join(context.extensionPath, 'web', 'job.html');
    let html = fs.readFileSync(jobFilePath, 'utf8');

    // 注入 VS Code Webview 所需的参数，避免依赖 URL query string
    const injectScript = `<script>
        window.__vscodeJobParams = new URLSearchParams(${JSON.stringify(query)});
    </script>`;
    html = html.replace('</head>', injectScript + '</head>');

    html = replaceLocalResources(html, context.extensionUri, panel.webview, 'web');

    panel.webview.html = html;
}

function getIndexHtml(extensionUri, webview) {
    const indexPath = path.join(extensionUri.fsPath, 'web', 'index.html');
    let html = fs.readFileSync(indexPath, 'utf8');

    // 把本地 JS/CSS 资源路径替换成 VS Code Webview 可访问的 URI
    html = replaceLocalResources(html, extensionUri, webview, 'web');

    // 注入与 VS Code 扩展通信的桥接脚本
    const bridgeScript = `<script>
        (function() {
            const vscode = acquireVsCodeApi();

            // 将拖拽/点击选择文件的行为改为调用扩展的文件选择框
            const dropArea = document.getElementById('drop-area');
            if (dropArea) {
                const p = dropArea.querySelector('p');
                if (p) {
                    p.textContent = '点击此处选择 ZIP 文件（VS Code 内使用）';
                }
                dropArea.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    vscode.postMessage({ type: 'selectZip' });
                });
                ['dragenter', 'dragover', 'dragleave', 'drop'].forEach((eventName) => {
                    dropArea.addEventListener(eventName, (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                    }, false);
                });
            }

            // 接收扩展传回的文件内容并交给原有的 handleFiles 处理
            window.addEventListener('message', (event) => {
                const message = event.data;
                if (message && message.type === 'zipContent') {
                    const binary = atob(message.base64);
                    const bytes = new Uint8Array(binary.length);
                    for (let i = 0; i < binary.length; i++) {
                        bytes[i] = binary.charCodeAt(i);
                    }
                    const arrayBuffer = bytes.buffer;
                    const file = new File([arrayBuffer], message.filename || 'workflow.zip', { type: 'application/zip' });
                    if (typeof handleFiles === 'function') {
                        handleFiles([file]);
                    }
                }
            });

            // 拦截 job 详情链接，在 VS Code 中打开新的 Webview 面板
            document.addEventListener('click', (e) => {
                const a = e.target.closest('a');
                if (a && a.getAttribute('href')) {
                    const href = a.getAttribute('href');
                    if (href.indexOf('job.html') !== -1) {
                        e.preventDefault();
                        const qIndex = href.indexOf('?');
                        const params = {};
                        if (qIndex !== -1) {
                            new URLSearchParams(href.substring(qIndex + 1)).forEach((v, k) => {
                                params[k] = v;
                            });
                        }
                        vscode.postMessage({ type: 'openJob', params: params });
                    }
                }
            });
        })();
    </script>`;

    html = html.replace('</body>', bridgeScript + '</body>');
    return html;
}

function replaceLocalResources(html, extensionUri, webview, folder) {
    const webRoot = vscode.Uri.joinPath(extensionUri, folder);
    return html.replace(/(src|href)=(["'])([^"']+)\2/g, (match, attr, quote, p) => {
        if (/^(https?|data|blob|javascript):/i.test(p)) {
            return match;
        }
        if (p.startsWith('#')) {
            return match;
        }
        // job.html 的链接通过消息机制处理，保持原始 href 不变
        if (attr === 'href' && p.indexOf('job.html') !== -1) {
            return match;
        }
        const uri = webview.asWebviewUri(vscode.Uri.joinPath(webRoot, p));
        return `${attr}=${quote}${uri}${quote}`;
    });
}

function deactivate() {}

module.exports = { activate, deactivate };
