# Local HTTP Server for The Jaipur Atelier Website (with MP4 Streaming & Range Request Support)
$port = 8080
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Prefixes.Add("http://127.0.0.1:$port/")
$listener.Start()
Write-Host "Local web server running at http://localhost:$port/ and http://127.0.0.1:$port/"
$folder = $PSScriptRoot

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        $fileStream = $null
        
        try {
            $rawPath = [System.Uri]::UnescapeDataString($request.Url.LocalPath)
            if ($rawPath -eq "/") { $rawPath = "/index.html" }
            
            $filePath = Join-Path $folder $rawPath
            
            if (Test-Path $filePath -PathType Leaf) {
                $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
                
                switch ($ext) {
                    ".html" { $response.ContentType = "text/html; charset=utf-8" }
                    ".css"  { $response.ContentType = "text/css; charset=utf-8" }
                    ".js"   { $response.ContentType = "application/javascript; charset=utf-8" }
                    ".png"  { $response.ContentType = "image/png" }
                    ".jpg"  { $response.ContentType = "image/jpeg" }
                    ".svg"  { $response.ContentType = "image/svg+xml" }
                    ".mp4"  { $response.ContentType = "video/mp4" }
                    ".webm" { $response.ContentType = "video/webm" }
                    default { $response.ContentType = "application/octet-stream" }
                }

                $response.Headers.Add("Accept-Ranges", "bytes")
                $fileStream = [System.IO.File]::OpenRead($filePath)
                $fileLength = $fileStream.Length

                if ($request.Headers["Range"]) {
                    $rangeHeader = $request.Headers["Range"]
                    if ($rangeHeader -match "bytes=(\d+)-(\d+)?") {
                        $start = [long]$matches[1]
                        $end = if ($matches[2]) { [long]$matches[2] } else { $fileLength - 1 }
                        if ($end -ge $fileLength) { $end = $fileLength - 1 }
                        $count = $end - $start + 1

                        $response.StatusCode = 206
                        $response.Headers.Add("Content-Range", "bytes $start-$end/$fileLength")
                        $response.ContentLength64 = $count

                        $fileStream.Seek($start, [System.IO.SeekOrigin]::Begin) | Out-Null
                        $buffer = New-Object byte[] 65536
                        $bytesRemaining = $count
                        while ($bytesRemaining -gt 0) {
                            $read = [int][Math]::Min($buffer.Length, $bytesRemaining)
                            $bytesRead = $fileStream.Read($buffer, 0, $read)
                            if ($bytesRead -le 0) { break }
                            $response.OutputStream.Write($buffer, 0, $bytesRead)
                            $bytesRemaining -= $bytesRead
                        }
                    } else {
                        $response.ContentLength64 = $fileLength
                        $fileStream.CopyTo($response.OutputStream)
                    }
                } else {
                    $response.ContentLength64 = $fileLength
                    $fileStream.CopyTo($response.OutputStream)
                }
            } else {
                $response.StatusCode = 404
                $buffer = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
                $response.ContentLength64 = $buffer.Length
                $response.OutputStream.Write($buffer, 0, $buffer.Length)
            }
        } catch {
            # Quietly swallow client disconnects during video streaming / seek aborts
        } finally {
            if ($null -ne $fileStream) {
                try { $fileStream.Close(); $fileStream.Dispose() } catch {}
            }
            try { $response.Close() } catch {}
        }
    }
} finally {
    try { $listener.Stop() } catch {}
}
