# 更新日志 / Change Log

## [1.0.0]

- 将网页应用封装为 VS Code 扩展。
- 网页静态资源统一放入 `web/` 目录，保留浏览器直接打开能力。
- 扩展在 VS Code 内部通过 Webview 加载 `web/index.html`。
- 通过 VS Code 文件选择框读取本地 ZIP 文件并传入 Webview 解析。
- 点击 job 节点链接时在 VS Code 中打开新的 Webview 详情页。

---

- Packaged the web app as a VS Code extension.
- Moved static web resources into the `web/` directory, keeping the ability to open directly in a browser.
- The extension loads `web/index.html` inside a VS Code Webview.
- Reads local ZIP files via the VS Code file dialog and passes them into the Webview for parsing.
- Opens a new Webview details panel when clicking a job node link.
