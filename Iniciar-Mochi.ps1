# =====================================================================
#  Iniciar-Mochi.ps1  -  Lanzador de Mochi para Windows
#
#  Hace todo con una ventanita gráfica (sin consola):
#    1. Si falta el motor de ventana (Electron), lo descarga de GitHub,
#       verifica su SHA-256 y lo guarda en %LOCALAPPDATA%\Mochi.
#       No hace falta Node.js, npm ni permisos de administrador.
#    2. Abre Mochi. Ella se encarga de instalar Ollama y el modelo.
#  Si todo ya está listo, abre Mochi directamente sin mostrar nada.
# =====================================================================
$ErrorActionPreference = "Stop"
$ProjectDir = $PSScriptRoot
Set-Location -LiteralPath $ProjectDir

$ElectronVersion = "33.4.11"
$RuntimeRoot = Join-Path $env:LOCALAPPDATA "Mochi"
$RuntimeDir  = Join-Path $RuntimeRoot "electron-$ElectronVersion"
$RuntimeExe  = Join-Path $RuntimeDir "electron.exe"
$DevExe      = Join-Path $ProjectDir "node_modules\electron\dist\electron.exe"   # si ya usaste "npm install"

$script:cancelled = $false
$script:marquee   = $false
$script:uiShown   = $false

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
[System.Windows.Forms.Application]::EnableVisualStyles()
try { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 } catch {}

# ---------------------------------------------------------------- Ventana
function New-Color([string]$hex) { return [System.Drawing.ColorTranslator]::FromHtml($hex) }
$cInk   = New-Color "#3b2a4a"
$cBg    = New-Color "#fff0f5"
$cPink  = New-Color "#ff8fab"
$cCream = New-Color "#ffe8d6"

function New-Label([int]$x, [int]$y, [int]$w, [int]$h, [string]$text) {
    $l = New-Object System.Windows.Forms.Label
    $l.Location  = New-Object System.Drawing.Point($x, $y)
    $l.Size      = New-Object System.Drawing.Size($w, $h)
    $l.Text      = $text
    $l.BackColor = [System.Drawing.Color]::Transparent
    return $l
}

$form = New-Object System.Windows.Forms.Form
$form.Text            = "Mochi"
$form.ClientSize      = New-Object System.Drawing.Size(460, 210)
$form.StartPosition   = "CenterScreen"
$form.FormBorderStyle = "FixedDialog"
$form.MaximizeBox     = $false
$form.BackColor       = $cBg
$form.ForeColor       = $cInk
$form.Font            = New-Object System.Drawing.Font("Consolas", 10, [System.Drawing.FontStyle]::Bold)

$lblTitle  = New-Label 16 12 428 24 ([string][char]0x2665 + " MOCHI  -  preparando todo")
$lblTitle.Font = New-Object System.Drawing.Font("Consolas", 12, [System.Drawing.FontStyle]::Bold)
$lblStatus = New-Label 16 46 428 62 ""
$lblDetail = New-Label 16 154 428 44 ""

$trackOuter = New-Object System.Windows.Forms.Panel
$trackOuter.Location  = New-Object System.Drawing.Point(16, 116)
$trackOuter.Size      = New-Object System.Drawing.Size(428, 30)
$trackOuter.BackColor = $cInk
$track = New-Object System.Windows.Forms.Panel
$track.Location  = New-Object System.Drawing.Point(3, 3)
$track.Size      = New-Object System.Drawing.Size(422, 24)
$track.BackColor = $cCream
$fill = New-Object System.Windows.Forms.Panel
$fill.Location  = New-Object System.Drawing.Point(0, 0)
$fill.Size      = New-Object System.Drawing.Size(0, 24)
$fill.BackColor = $cPink
$track.Controls.Add($fill)
$trackOuter.Controls.Add($track)

$form.Controls.Add($lblTitle)
$form.Controls.Add($lblStatus)
$form.Controls.Add($trackOuter)
$form.Controls.Add($lblDetail)

$form.Add_FormClosing({ $script:cancelled = $true })

# Barra "cargando" (vaivén) cuando no hay porcentaje
$timer = New-Object System.Windows.Forms.Timer
$timer.Interval = 70
$timer.Add_Tick({
    if ($script:marquee) {
        $fill.Left = $fill.Left + 14
        if ($fill.Left -gt $track.Width) { $fill.Left = -100 }
    }
})

function Show-UI {
    if (-not $script:uiShown) {
        $script:uiShown = $true
        $timer.Start()
        $form.Show()
        [System.Windows.Forms.Application]::DoEvents()
    }
}

# pct: 0..100, o -1 para barra sin porcentaje
function Set-Progress([double]$pct, [string]$text, [string]$detail = "") {
    Show-UI
    $lblStatus.Text = $text
    $lblDetail.Text = $detail
    if ($pct -lt 0) {
        $script:marquee = $true
        $fill.Width = 100
    } else {
        $script:marquee = $false
        $fill.Left  = 0
        $fill.Width = [int]([math]::Min(100, $pct) / 100 * $track.Width)
    }
    [System.Windows.Forms.Application]::DoEvents()
    if ($script:cancelled) { throw "Cancelado" }
}

function Wait-WithUI($proc) {
    $null = $proc.Handle   # asegura que ExitCode esté disponible
    while (-not $proc.HasExited) {
        [System.Windows.Forms.Application]::DoEvents()
        if ($script:cancelled) {
            try { $proc.Kill() } catch {}
            throw "Cancelado"
        }
        Start-Sleep -Milliseconds 80
    }
}

# --------------------------------------------------------------- Descarga
function Get-FileWithProgress([string]$url, [string]$dest, [string]$label) {
    $req = [System.Net.HttpWebRequest]::Create($url)
    $req.UserAgent = "mochi-launcher"
    $req.Timeout   = 30000
    $res   = $req.GetResponse()
    $total = $res.ContentLength
    $in    = $res.GetResponseStream()
    $out   = [System.IO.File]::Create($dest)
    try {
        $buf  = New-Object byte[] 81920
        $done = 0
        while (($n = $in.Read($buf, 0, $buf.Length)) -gt 0) {
            $out.Write($buf, 0, $n)
            $done += $n
            if ($total -gt 0) {
                Set-Progress (100.0 * $done / $total) $label ("{0:N1} / {1:N1} MB" -f ($done / 1MB), ($total / 1MB))
            } else {
                Set-Progress -1 $label ("{0:N1} MB" -f ($done / 1MB))
            }
        }
    } finally {
        $out.Close(); $in.Close(); $res.Close()
    }
}

# ------------------------------------------------------------- Electron
function Get-ElectronExe {
    if (Test-Path -LiteralPath $RuntimeExe) { return $RuntimeExe }
    if (Test-Path -LiteralPath $DevExe)     { return $DevExe }
    return $null
}

# Pista extra si Windows Defender ha registrado algo relacionado
function Get-DefenderHint {
    try {
        $found = @()
        $det = Get-MpThreatDetection -ErrorAction Stop | Sort-Object InitialDetectionTime -Descending | Select-Object -First 5
        foreach ($t in $det) {
            if ($t.Resources -match "electron|Mochi") { $found += ($t.Resources -join ", ") }
        }
        if ($found.Count -gt 0) { return "`n`nWindows Defender registra: " + ($found -join "; ") }
    } catch {}
    return ""
}

function Install-Electron {
    $isArm   = ($env:PROCESSOR_ARCHITECTURE -eq "ARM64") -or ($env:PROCESSOR_ARCHITEW6432 -eq "ARM64")
    $arch    = if ($isArm) { "arm64" } else { "x64" }
    $zipName = "electron-v$ElectronVersion-win32-$arch.zip"
    $base    = "https://github.com/electron/electron/releases/download/v$ElectronVersion"
    $tmp     = Join-Path $env:TEMP "mochi-electron"
    New-Item -ItemType Directory -Force -Path $tmp | Out-Null
    $zip = Join-Path $tmp $zipName

    Set-Progress 0 "Mochi necesita su motor de ventana (Electron). Lo descargo yo, solo la primera vez." "Conectando..."
    Get-FileWithProgress "$base/$zipName" $zip "Descargando el motor de Mochi..."

    # Verificación SHA-256 contra la lista oficial de la release
    Set-Progress -1 "Comprobando que la descarga es auténtica..." ""
    $sums = (Invoke-WebRequest -Uri "$base/SHASUMS256.txt" -UseBasicParsing).Content
    if ($sums -is [byte[]]) { $sums = [System.Text.Encoding]::UTF8.GetString($sums) }
    $line = ($sums -split "`n" | Where-Object { $_ -match [regex]::Escape($zipName) } | Select-Object -First 1)
    if (-not $line) { throw "No he podido verificar la descarga de Electron (no aparece en SHASUMS256.txt)." }
    $expected = ($line.Trim() -split "\s+")[0].ToLower()
    $actual   = (Get-FileHash -Algorithm SHA256 -LiteralPath $zip).Hash.ToLower()
    if ($expected -ne $actual) { throw "La descarga de Electron está corrupta (la suma de verificación no coincide)." }

    # Descomprimir en una carpeta temporal y moverla al final (así nunca queda a medias)
    Set-Progress -1 "Preparando el motor de Mochi..." "Descomprimiendo (puede tardar unos segundos)"
    New-Item -ItemType Directory -Force -Path $RuntimeRoot | Out-Null
    $partial = "$RuntimeDir.partial"
    if (Test-Path -LiteralPath $partial)    { Remove-Item -LiteralPath $partial    -Recurse -Force }
    if (Test-Path -LiteralPath $RuntimeDir) { Remove-Item -LiteralPath $RuntimeDir -Recurse -Force }
    $zq  = $zip.Replace("'", "''")
    $pq  = $partial.Replace("'", "''")
    $cmd = "Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::ExtractToDirectory('$zq','$pq')"
    $p = Start-Process -FilePath "powershell.exe" `
        -ArgumentList "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", $cmd `
        -WindowStyle Hidden -PassThru
    Wait-WithUI $p
    if ($p.ExitCode -ne 0) { throw "No pude descomprimir Electron." }
    Move-Item -LiteralPath $partial -Destination $RuntimeDir
    Remove-Item -LiteralPath $tmp -Recurse -Force -ErrorAction SilentlyContinue

    # Un antivirus puede borrar electron.exe nada más extraerlo: espero y compruebo
    Set-Progress -1 "Comprobando que todo está en su sitio..." ""
    for ($i = 0; $i -lt 25; $i++) {
        [System.Windows.Forms.Application]::DoEvents()
        Start-Sleep -Milliseconds 100
    }
    if (-not (Test-Path -LiteralPath $RuntimeExe)) {
        throw ("electron.exe desapareció justo después de descomprimirse. Casi seguro lo ha eliminado el antivirus.`n`n" +
               "Añade esta carpeta a las exclusiones de tu antivirus y vuelve a abrir Mochi:`n$RuntimeRoot" +
               (Get-DefenderHint))
    }
}

# ------------------------------------------------------------ Principal
try {
    $exe = Get-ElectronExe
    if (-not $exe) {
        Install-Electron
        $exe = Get-ElectronExe
        if (-not $exe) { throw "No encuentro Electron tras instalarlo en $RuntimeDir." }
    }

    if ($script:uiShown) {
        Set-Progress 100 "¡Listo! Abriendo a Mochi..." ""
    }
    Start-Process -FilePath $exe -ArgumentList "`"$ProjectDir`"" -WorkingDirectory $ProjectDir
    if ($script:uiShown) {
        Start-Sleep -Milliseconds 700
        $form.Close()
    }
}
catch {
    if ($_.Exception.Message -ne "Cancelado") {
        [System.Windows.Forms.MessageBox]::Show(
            "Ups, algo ha fallado:`n`n$($_.Exception.Message)",
            "Mochi",
            [System.Windows.Forms.MessageBoxButtons]::OK,
            [System.Windows.Forms.MessageBoxIcon]::Error) | Out-Null
    }
}
