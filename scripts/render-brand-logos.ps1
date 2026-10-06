# Yazılı logoları üretir: mercan kurdele + "Düğün Planım" (gerçek yazı tipiyle dizilir, Türkçe karakterler doğru).
# prepare-brand-assets.mjs tarafından çağrılır. Yalnız Windows (System.Drawing / GDI+) gerekir.
# Dosya yalnız ASCII içerir; Türkçe karakterler Unicode kodlarıyla yazılır.
param([Parameter(Mandatory = $true)][string]$Root)

Add-Type -AssemblyName System.Drawing

$u = [char]0x00FC   # ü
$g = [char]0x011F   # ğ
$i = [char]0x0131   # ı
$title = 'D' + $u + $g + $u + 'n Plan' + $i + 'm'
$tagline = 'Hayalinizdeki g' + $u + 'n' + $u + ' birlikte planlay' + $i + 'n.'

$ivory = [System.Drawing.ColorTranslator]::FromHtml('#FFF8F3')
$plum = [System.Drawing.ColorTranslator]::FromHtml('#59233D')
$soft = [System.Drawing.ColorTranslator]::FromHtml('#6F5560')
$symbolPath = Join-Path $Root 'assets\brand\ribbon-symbol-coral.png'
$brandDir = Join-Path $Root 'assets\brand'
$symbol = [System.Drawing.Image]::FromFile($symbolPath)

function New-Canvas([int]$w, [int]$h) {
  $bmp = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
  $gfx = [System.Drawing.Graphics]::FromImage($bmp)
  $gfx.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $gfx.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $gfx.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $gfx.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAlias
  $gfx.Clear($ivory)
  return @{ Bitmap = $bmp; Graphics = $gfx }
}

$typographic = [System.Drawing.StringFormat]::GenericTypographic
$typographic.FormatFlags = $typographic.FormatFlags -bor [System.Drawing.StringFormatFlags]::MeasureTrailingSpaces

# --- Yatay logo (1800x600): kurdele solda, yazı sağda, birlikte ortalı ---
$h = New-Canvas 1800 600
$ribbonH = 340.0
$ribbonW = $ribbonH * $symbol.Width / $symbol.Height
$titleFont = New-Object System.Drawing.Font('Georgia', 128, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$titleSize = $h.Graphics.MeasureString($title, $titleFont, 4000, $typographic)
$gap = 70.0
$lockup = $ribbonW + $gap + $titleSize.Width
$x0 = (1800 - $lockup) / 2
$h.Graphics.DrawImage($symbol, [single]$x0, [single]((600 - $ribbonH) / 2), [single]$ribbonW, [single]$ribbonH)
$brush = New-Object System.Drawing.SolidBrush($plum)
$h.Graphics.DrawString($title, $titleFont, $brush, [single]($x0 + $ribbonW + $gap), [single]((600 - $titleSize.Height) / 2), $typographic)
$h.Bitmap.Save((Join-Path $brandDir 'logo-horizontal.png'), [System.Drawing.Imaging.ImageFormat]::Png)
$h.Graphics.Dispose(); $h.Bitmap.Dispose()

# --- Dikey logo (1200x1200): kurdele üstte, ad ve slogan altta ---
$p = New-Canvas 1200 1200
$pRibbonH = 430.0
$pRibbonW = $pRibbonH * $symbol.Width / $symbol.Height
$p.Graphics.DrawImage($symbol, [single]((1200 - $pRibbonW) / 2), [single]190, [single]$pRibbonW, [single]$pRibbonH)
$pTitleFont = New-Object System.Drawing.Font('Georgia', 104, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$pTitleSize = $p.Graphics.MeasureString($title, $pTitleFont, 4000, $typographic)
$p.Graphics.DrawString($title, $pTitleFont, $brush, [single]((1200 - $pTitleSize.Width) / 2), [single]700, $typographic)
$tagFont = New-Object System.Drawing.Font('Segoe UI', 32, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$tagSize = $p.Graphics.MeasureString($tagline, $tagFont, 4000, $typographic)
$tagBrush = New-Object System.Drawing.SolidBrush($soft)
$p.Graphics.DrawString($tagline, $tagFont, $tagBrush, [single]((1200 - $tagSize.Width) / 2), [single]870, $typographic)
$p.Bitmap.Save((Join-Path $brandDir 'logo-primary.png'), [System.Drawing.Imaging.ImageFormat]::Png)
$p.Graphics.Dispose(); $p.Bitmap.Dispose()

$symbol.Dispose()
Write-Output ("Yazili logolar uretildi: logo-horizontal.png (kilit genisligi {0:N0}px), logo-primary.png" -f $lockup)
