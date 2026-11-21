package com.lksj.app

import android.annotation.SuppressLint
import android.net.Uri
import android.os.Bundle
import android.webkit.JavascriptInterface
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.webkit.WebViewAssetLoader

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private var filePathCallback: ValueCallback<Array<Uri>>? = null
    private var pendingCsvContent: String? = null

    /**
     * 系统 PhotoPicker：用户单次主动选图，无需任何相册或存储权限
     */
    private val pickMultipleImagesLauncher = registerForActivityResult(
        ActivityResultContracts.PickMultipleVisualMedia(3)
    ) { uris ->
        val callback = filePathCallback
        filePathCallback = null
        if (uris.isNullOrEmpty()) {
            callback?.onReceiveValue(null)
        } else {
            callback?.onReceiveValue(uris.toTypedArray())
        }
    }

    /**
     * 系统 SAF 文件选择器：读取用户手动选中的 CSV 文件，无需存储权限
     */
    private val openCsvDocumentLauncher = registerForActivityResult(
        ActivityResultContracts.OpenDocument()
    ) { uri ->
        val callback = filePathCallback
        filePathCallback = null
        if (uri == null) {
            callback?.onReceiveValue(null)
        } else {
            callback?.onReceiveValue(arrayOf(uri))
        }
    }

    /**
     * 系统 SAF 文件保存器：由用户手动选择 CSV 导出路径，无需存储权限
     */
    private val createCsvDocumentLauncher = registerForActivityResult(
        ActivityResultContracts.CreateDocument("text/csv")
    ) { uri ->
        val content = pendingCsvContent
        pendingCsvContent = null
        if (uri != null && content != null) {
            try {
                contentResolver.openOutputStream(uri)?.use { out ->
                    out.write(content.toByteArray(Charsets.UTF_8))
                }
                Toast.makeText(this, "CSV 导出成功", Toast.LENGTH_SHORT).show()
            } catch (e: Exception) {
                Toast.makeText(this, "CSV 写入失败：${e.localizedMessage}", Toast.LENGTH_SHORT).show()
            }
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        webView = WebView(this)
        setContentView(webView)

        val assetLoader = WebViewAssetLoader.Builder()
            .addPathHandler("/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()

        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            allowFileAccess = false
            allowContentAccess = true
            cacheMode = WebSettings.LOAD_NO_CACHE
            setSupportZoom(false)
        }

        webView.addJavascriptInterface(AndroidSafBridge(), "AndroidSafBridge")

        webView.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(
                view: WebView,
                request: WebResourceRequest
            ): WebResourceResponse? {
                val url = request.url
                // 仅允许加载本地打包静态资源，拦截所有外部网络请求以保证纯离线运行
                return if (url.host == "appassets.androidplatform.net") {
                    assetLoader.shouldInterceptRequest(url)
                } else {
                    WebResourceResponse("text/plain", "utf-8", null)
                }
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onShowFileChooser(
                webView: WebView?,
                filePathCallback: ValueCallback<Array<Uri>>?,
                fileChooserParams: FileChooserParams?
            ): Boolean {
                this@MainActivity.filePathCallback?.onReceiveValue(null)
                this@MainActivity.filePathCallback = filePathCallback

                val acceptTypes = fileChooserParams?.acceptTypes?.joinToString(",") ?: ""
                return try {
                    if (acceptTypes.contains("image")) {
                        pickMultipleImagesLauncher.launch(
                            PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly)
                        )
                    } else {
                        openCsvDocumentLauncher.launch(
                            arrayOf("text/csv", "text/comma-separated-values", "application/csv", "text/plain", "*/*")
                        )
                    }
                    true
                } catch (e: Exception) {
                    this@MainActivity.filePathCallback?.onReceiveValue(null)
                    this@MainActivity.filePathCallback = null
                    false
                }
            }
        }

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack()
                } else {
                    finish()
                }
            }
        })

        webView.loadUrl("https://appassets.androidplatform.net/index.html")
    }

    override fun onDestroy() {
        filePathCallback?.onReceiveValue(null)
        filePathCallback = null
        webView.destroy()
        super.onDestroy()
    }

    inner class AndroidSafBridge {
        @JavascriptInterface
        fun exportCsv(suggestedName: String, csvContent: String) {
            runOnUiThread {
                pendingCsvContent = csvContent
                createCsvDocumentLauncher.launch(suggestedName)
            }
        }
    }
}
