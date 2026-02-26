
Add-Type -AssemblyName System.Drawing

$source = "g:\test_v2\app\public\reflect_logo_unified.png"
$target = "$env:USERPROFILE\Desktop\ReflectOS_Floating.ico"

try {
    $img = [System.Drawing.Bitmap]::FromFile($source)
    $w = $img.Width
    $h = $img.Height
    
    $out = New-Object System.Drawing.Bitmap($w, $h)
    
    # --- PIXEL LEVEL ALPHA MASKING ---
    for ($y = 0; $y -lt $h; $y++) {
        for ($x = 0; $x -lt $w; $x++) {
            $px = $img.GetPixel($x, $y)
            # Calculate brightness/luminance
            $brightness = ($px.R * 0.299 + $px.G * 0.587 + $px.B * 0.114)
            
            # Threshold for background removal
            if ($brightness -lt 15) {
                # Pure or dark background -> Make fully transparent
                $out.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
            }
            else {
                # Keep the shape
                # For smooth edges, we map luminance to alpha for the darkest edges (anti-aliasing)
                if ($brightness -lt 50) {
                    $alpha = [int](($brightness - 15) / 35 * 255)
                    if ($alpha -gt 255) { $alpha = 255 }
                    if ($alpha -lt 0) { $alpha = 0 }
                    $out.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($alpha, $px.R, $px.G, $px.B))
                }
                else {
                    $out.SetPixel($x, $y, $px)
                }
            }
        }
    }
    
    # Resize to 256x256 for ICO
    $canvas = New-Object System.Drawing.Bitmap(256, 256)
    $g = [System.Drawing.Graphics]::FromImage($canvas)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.DrawImage($out, 0, 0, 256, 256)
    
    $ms = New-Object System.IO.MemoryStream
    $canvas.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
    $pngData = $ms.ToArray()
    
    $fs = [System.IO.File]::Create($target)
    $bw = New-Object System.IO.BinaryWriter($fs)
    
    # ICO Header
    $bw.Write([uint16]0)
    $bw.Write([uint16]1) 
    $bw.Write([uint16]1) 
    
    # Directory Entry
    $bw.Write([byte]0)   # 256
    $bw.Write([byte]0)   # 256
    $bw.Write([byte]0)   
    $bw.Write([byte]0)   
    $bw.Write([uint16]1) 
    $bw.Write([uint16]32)
    $bw.Write([uint32]$pngData.Length)
    $bw.Write([uint32]22) 
    
    # Data Data
    $bw.Write($pngData)
    
    $bw.Close(); $fs.Close(); $ms.Dispose(); $g.Dispose(); $canvas.Dispose(); $out.Dispose(); $img.Dispose()
    
    Write-Output "SUCCESS_OUTLINE_ICON_DEPLOYED"
}
catch {
    Write-Output "ERROR: $($_.Exception.Message)"
}
