import { useState } from 'react'
import { ActivityIndicator, View } from 'react-native'
import WebView from 'react-native-webview'
import type { Attachment } from '@/api/attachment/use-attachments'
import { Text } from './ui/text'

interface AttachmentViewerPdfProps {
  attachment: Attachment
}

export function AttachmentViewerPdf({ attachment }: AttachmentViewerPdfProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Create HTML content with PDF.js from Mozilla CDN
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            background-color: #000;
            overflow: auto;
          }
          #container {
            width: 100%;
            min-height: 100vh;
          }
          canvas {
            display: block;
            margin: 0 auto;
            background: #fff;
          }
          .page {
            margin-bottom: 10px;
          }
          #loading {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: #fff;
            font-family: system-ui;
            font-size: 14px;
            padding: 20px;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div id="loading">Đang tải PDF...</div>
        <div id="container"></div>

        <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
        <script>
          function log(msg) {
            console.log('[PDF Viewer]', msg);
            window.ReactNativeWebView?.postMessage('log:' + msg);
          }

          function setLoadingText(text) {
            const loading = document.getElementById('loading');
            if (loading) loading.textContent = text;
          }

          log('PDF Viewer initialized');

          const pdfjsLib = window['pdfjs-dist/build/pdf'];

          if (!pdfjsLib) {
            log('ERROR: PDF.js library not loaded');
            setLoadingText('Lỗi: Không tải được thư viện PDF.js');
            window.ReactNativeWebView?.postMessage('error:PDF.js library not loaded');
          } else {
            log('PDF.js library loaded successfully');
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

            const pdfUrl = '${attachment.url}';
            log('PDF URL: ' + pdfUrl);

            const container = document.getElementById('container');

            async function renderPDF() {
              try {
                log('Starting PDF load...');
                setLoadingText('Đang tải PDF...');

                const loadingTask = pdfjsLib.getDocument(pdfUrl);
                log('PDF loading task created');

                const pdf = await loadingTask.promise;
                log('PDF loaded successfully. Pages: ' + pdf.numPages);

                setLoadingText('Đang hiển thị PDF...');
                document.getElementById('loading').style.display = 'none';

                // Render all pages
                for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                  log('Rendering page ' + pageNum + '/' + pdf.numPages);

                  const page = await pdf.getPage(pageNum);

                  // Calculate scale to fit screen width
                  const viewport = page.getViewport({ scale: 1 });
                  const scale = window.innerWidth / viewport.width;
                  const scaledViewport = page.getViewport({ scale });

                  // Create canvas for this page
                  const canvas = document.createElement('canvas');
                  canvas.className = 'page';
                  const context = canvas.getContext('2d');
                  canvas.height = scaledViewport.height;
                  canvas.width = scaledViewport.width;

                  container.appendChild(canvas);

                  // Render page
                  await page.render({
                    canvasContext: context,
                    viewport: scaledViewport
                  }).promise;

                  log('Page ' + pageNum + ' rendered');
                }

                log('All pages rendered successfully');
                window.ReactNativeWebView?.postMessage('loaded');
              } catch (err) {
                const errorMsg = err.message || err.toString();
                const errorStack = err.stack || 'No stack trace';
                log('ERROR: ' + errorMsg);
                log('Stack: ' + errorStack);

                setLoadingText('Lỗi khi tải PDF: ' + errorMsg);
                window.ReactNativeWebView?.postMessage('error:' + errorMsg + '|||' + errorStack);
              }
            }

            renderPDF();
          }
        </script>
      </body>
    </html>
  `

  return (
    <View className="h-full w-full bg-black">
      {loading && (
        <View className="absolute inset-0 z-10 items-center justify-center bg-black">
          <ActivityIndicator color="#ffffff" size="large" />
          <Text className="mt-4 text-white">Đang tải PDF...</Text>
        </View>
      )}

      {error && (
        <View className="absolute inset-0 z-10 items-center justify-center bg-black px-4">
          <Text className="text-center text-sm text-white">{error}</Text>
        </View>
      )}

      <WebView
        javaScriptEnabled
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent
          console.error('[PDF WebView Error]', nativeEvent)
          setLoading(false)
          setError(
            `WebView Error: ${nativeEvent.description || 'Unknown error'}`,
          )
        }}
        onMessage={(event) => {
          const message = event.nativeEvent.data
          console.log('[PDF WebView Message]', message)

          if (message === 'loaded') {
            console.log('[PDF] Loaded successfully')
            setLoading(false)
          } else if (message.startsWith('error:')) {
            const errorParts = message.substring(6).split('|||')
            const errorMsg = errorParts[0]
            const errorStack = errorParts[1]
            console.error('[PDF Error]', errorMsg)
            console.error('[PDF Stack]', errorStack)
            setLoading(false)
            setError(`Lỗi: ${errorMsg}`)
          } else if (message.startsWith('log:')) {
            console.log('[PDF Log]', message.substring(4))
          }
        }}
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        style={{ flex: 1, backgroundColor: '#000' }}
      />
    </View>
  )
}

// Loading component for PDF
export function PdfLoadingView() {
  return (
    <View className="h-full w-full items-center justify-center bg-black">
      <ActivityIndicator color="#ffffff" size="large" />
      <Text className="mt-4 text-white">Đang tải PDF...</Text>
    </View>
  )
}
