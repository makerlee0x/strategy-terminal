import SwiftUI
import WebKit

struct ContentView: View {
    /// Prod by default. For local Next.js: set STRATEGY_LOCAL=1 in the scheme,
    /// or flip `useLocal` below while developing.
    private let useLocal = ProcessInfo.processInfo.environment["STRATEGY_LOCAL"] == "1"
    private var startURL: URL {
        if useLocal {
            return URL(string: "http://127.0.0.1:3000/")!
        }
        return URL(string: "https://www.strategycoin.io/")!
    }

    var body: some View {
        StrategyWebView(url: startURL)
            .ignoresSafeArea()
    }
}

struct StrategyWebView: UIViewRepresentable {
    let url: URL

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.allowsInlineMediaPlayback = true
        config.defaultWebpagePreferences.allowsContentJavaScript = true

        let webView = WKWebView(frame: .zero, configuration: config)
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.allowsBackForwardNavigationGestures = true
        webView.navigationDelegate = context.coordinator
        webView.load(URLRequest(url: url))
        return webView
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {}

    func makeCoordinator() -> Coordinator {
        Coordinator()
    }

    final class Coordinator: NSObject, WKNavigationDelegate {
        func webView(
            _ webView: WKWebView,
            decidePolicyFor navigationAction: WKNavigationAction,
            decisionHandler: @escaping (WKNavigationActionPolicy) -> Void
        ) {
            decisionHandler(.allow)
        }
    }
}

#Preview {
    ContentView()
}
