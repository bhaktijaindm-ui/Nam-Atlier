# Local HTTP Server for NAM Atelier Website
$port = 8080
$folder = $PSScriptRoot

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Prefixes.Add("http://127.0.0.1:$port/")
$listener.Start()
Write-Host "Local web server running at http://localhost:$port/ and http://127.0.0.1:$port/"

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        $fs = $null

        try {
            $response.SendChunked = $false
            $response.Headers.Add("Accept-Ranges", "bytes")

            $urlPath = $request.Url.LocalPath
            if ($urlPath -eq "/") { $urlPath = "/index.html" }
            $urlPath = [System.Uri]::UnescapeDataString($urlPath)

            $filePath = Join-Path $folder $urlPath.TrimStart('/')
            if (Test-Path $filePath -PathType Container) {
                $dirIndex = Join-Path $filePath "index.html"
                if (Test-Path $dirIndex -PathType Leaf) {
                    $filePath = $dirIndex
                }
            }
            if (-not (Test-Path $filePath -PathType Leaf) -and (Test-Path ($filePath + ".html") -PathType Leaf)) {
                $filePath = $filePath + ".html"
            }

            if (Test-Path $filePath -PathType Leaf) {
                $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
                $mime = switch ($ext) {
                    ".html" { "text/html; charset=utf-8" }
                    ".css"  { "text/css; charset=utf-8" }
                    ".js"   { "application/javascript; charset=utf-8" }
                    ".json" { "application/json; charset=utf-8" }
                    ".png"  { "image/png" }
                    ".jpg"  { "image/jpeg" }
                    ".jpeg" { "image/jpeg" }
                    ".mp4"  { "video/mp4" }
                    ".svg"  { "image/svg+xml" }
                    ".woff2"{ "font/woff2" }
                    ".woff" { "font/woff" }
                    default { "application/octet-stream" }
                }
                $response.ContentType = $mime

                $fileInfo = New-Object System.IO.FileInfo($filePath)
                $totalLength = $fileInfo.Length

                $rangeHeader = $request.Headers["Range"]
                if ($rangeHeader -and $rangeHeader.StartsWith("bytes=")) {
                    $range = $rangeHeader.Substring(6).Split("-")
                    [long]$start = 0
                    [long]$end = $totalLength - 1
                    if ($range[0].Length -gt 0) {
                        $start = [long]::Parse($range[0])
                    }
                    if ($range.Length -gt 1 -and $range[1].Length -gt 0) {
                        $end = [long]::Parse($range[1])
                    }
                    if ($end -ge $totalLength) { $end = $totalLength - 1 }
                    [long]$length = $end - $start + 1

                    $response.StatusCode = 206
                    $response.Headers.Add("Content-Range", "bytes $start-$end/$totalLength")
                    $response.ContentLength64 = $length

                    $fs = [System.IO.File]::OpenRead($filePath)
                    $fs.Seek($start, [System.IO.SeekOrigin]::Begin) | Out-Null
                    $buffer = New-Object byte[] 65536
                    $bytesRemaining = $length
                    while ($bytesRemaining -gt 0) {
                        $toRead = [int][System.Math]::Min([long]$buffer.Length, $bytesRemaining)
                        $bytesRead = $fs.Read($buffer, 0, $toRead)
                        if ($bytesRead -le 0) { break }
                        $response.OutputStream.Write($buffer, 0, $bytesRead)
                        $bytesRemaining -= $bytesRead
                    }
                    $fs.Close()
                    $fs = $null
                } else {
                    $response.StatusCode = 200
                    $response.ContentLength64 = $totalLength
                    $fs = [System.IO.File]::OpenRead($filePath)
                    $buffer = New-Object byte[] 65536
                    while ($true) {
                        $bytesRead = $fs.Read($buffer, 0, $buffer.Length)
                        if ($bytesRead -le 0) { break }
                        $response.OutputStream.Write($buffer, 0, $bytesRead)
                    }
                    $fs.Close()
                    $fs = $null
                }
            } else {
                $response.StatusCode = 404
                $buffer = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
                $response.ContentLength64 = $buffer.Length
                $response.OutputStream.Write($buffer, 0, $buffer.Length)
            }
        } catch {
            # Catch client disconnects/aborts gracefully
        } finally {
            try { if ($fs) { $fs.Dispose() } } catch {}
            try { $response.Close() } catch {}
        }
    }
} finally {
    $listener.Stop()
}
