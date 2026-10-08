Add-Type -AssemblyName System.Drawing

$srcPath = "c:\Users\Bhakti Jain\Documents\Nam atlier\nam_official_logo.png"
$outWhitePath = "c:\Users\Bhakti Jain\Documents\Nam atlier\nam_logo_white.png"

if (Test-Path $srcPath) {
    $bmp = New-Object System.Drawing.Bitmap($srcPath)
    $whiteBmp = New-Object System.Drawing.Bitmap($bmp.Width, $bmp.Height)

    for ($x = 0; $x -lt $bmp.Width; $x++) {
        for ($y = 0; $y -lt $bmp.Height; $y++) {
            $p = $bmp.GetPixel($x, $y)
            # If pixel is dark (part of logo mark/text)
            if ($p.R -lt 160 -and $p.G -lt 160 -and $p.B -lt 160) {
                # Turn to solid pure white
                $whiteBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, 255, 255, 255))
            } else {
                # Turn white background to transparent
                $whiteBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
            }
        }
    }

    $whiteBmp.Save($outWhitePath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    $whiteBmp.Dispose()
    Write-Output "SUCCESS: nam_logo_white.png created successfully!"
} else {
    Write-Output "ERROR: Source file not found."
}
