import http.server
import socketserver
import mimetypes

# .wasm の MIME タイプを明示的に追加
mimetypes.add_type("application/wasm", ".wasm")


class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # CORS ヘッダーを追加
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        
        # WebAssemblyファイルに対して特別なヘッダーを設定
        if self.path.endswith('.wasm'):
            self.send_header('Content-Type', 'application/wasm')
            self.send_header('Cross-Origin-Embedder-Policy', 'require-corp')
            self.send_header('Cross-Origin-Opener-Policy', 'same-origin')
        
        super().end_headers()

    def guess_type(self, path):
        # WebAssemblyファイルのMIMEタイプを明示的に設定
        if str(path).endswith('.wasm'):
            return 'application/wasm'
        return super().guess_type(path)
    
    def send_header(self, keyword, value):
        # WebAssemblyファイルに対して特別なヘッダーを設定
        if self.path.endswith('.wasm'):
            if keyword.lower() == 'content-type':
                super().send_header('Content-Type', 'application/wasm')
                return
        super().send_header(keyword, value)


PORT = 8001

Handler = CustomHTTPRequestHandler

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"Serving at http://localhost:{PORT}")
    httpd.serve_forever()
