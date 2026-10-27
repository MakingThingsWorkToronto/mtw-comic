param(
  [Parameter(Mandatory=$true)][string]$Profiles,
  [Parameter(Mandatory=$true)][string]$OutputDir,
  [string]$Character = ''
)
# Use Windows PowerShell 5.1: System.Speech is a Windows/.NET Framework API.
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech
$comicProfiles = Get-Content -LiteralPath $Profiles -Raw -Encoding UTF8 | ConvertFrom-Json
$comicOutputRoot = [IO.Path]::GetFullPath($OutputDir)
[IO.Directory]::CreateDirectory($comicOutputRoot) | Out-Null
$comicSynth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$comicRows = @()
try {
  $comicInstalled = @($comicSynth.GetInstalledVoices() | ForEach-Object { $_.VoiceInfo.Name })
  foreach ($comicProfile in $comicProfiles.profiles) {
    if ($Character -and $comicProfile.characterId -ne $Character) { continue }
    $comicSettings = $comicProfile.windowsAudition
    if (-not $comicSettings) { continue }
    if ($comicInstalled -notcontains $comicSettings.voiceId) { throw "Required installed voice missing: $($comicSettings.voiceId)" }
    if ($comicProfile.characterId -notmatch '^[a-z][a-z0-9-]*$') { throw 'Unsafe character ID' }
    $comicSynth.SelectVoice($comicSettings.voiceId)
    $comicSynth.Rate = [int]$comicSettings.rate
    $comicSynth.Volume = [int]$comicSettings.volume
    foreach ($comicScript in $comicProfile.auditionScripts) {
      if ($comicScript.id -notmatch '^[a-z][a-z0-9-]*$') { throw 'Unsafe script ID' }
      $comicRelative = "assets/voices/$($comicProfile.characterId)/$($comicSettings.version)-$($comicScript.id).wav"
      $comicPath = [IO.Path]::GetFullPath((Join-Path $comicOutputRoot $comicRelative))
      if (-not $comicPath.StartsWith($comicOutputRoot + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) { throw 'Output outside library root' }
      if (Test-Path -LiteralPath $comicPath) { throw "Retain existing sample; choose a new version: $comicRelative" }
      [IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($comicPath)) | Out-Null
      $comicText = [Security.SecurityElement]::Escape(($comicScript.text -replace '\s+', ' ').Trim())
      $comicPitch = [Security.SecurityElement]::Escape([string]$comicSettings.pitch)
      $comicCulture = $comicSynth.Voice.Culture.Name
      $comicSsml = '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="' + $comicCulture + '"><prosody pitch="' + $comicPitch + '">' + $comicText + '</prosody></speak>'
      $comicFormat = New-Object System.Speech.AudioFormat.SpeechAudioFormatInfo(24000, [System.Speech.AudioFormat.AudioBitsPerSample]::Sixteen, [System.Speech.AudioFormat.AudioChannel]::Mono)
      $comicSynth.SetOutputToWaveFile($comicPath, $comicFormat)
      try { $comicSynth.SpeakSsml($comicSsml) } finally { $comicSynth.SetOutputToNull() }
      [IO.File]::WriteAllText(($comicPath + '.ssml'), $comicSsml, (New-Object Text.UTF8Encoding($false)))
      $comicRows += [ordered]@{ characterId=$comicProfile.characterId; scriptId=$comicScript.id; path=$comicRelative; sha256=(Get-FileHash -LiteralPath $comicPath -Algorithm SHA256).Hash.ToLower(); bytes=(Get-Item -LiteralPath $comicPath).Length; settings=$comicSettings; text=($comicScript.text -replace '\s+', ' ').Trim(); source=$comicScript.source; voice=$comicSynth.Voice.Name; culture=$comicCulture; status='candidate'; ssmlPath=($comicRelative + '.ssml') }
    }
  }
} finally { $comicSynth.Dispose() }
$comicReceipt = [ordered]@{ generatedUtc=[DateTime]::UtcNow.ToString('o'); provider='windows-sapi-system-speech'; machine=$env:COMPUTERNAME; os=[Environment]::OSVersion.VersionString; powershell=$PSVersionTable.PSVersion.ToString(); profilesSha256=(Get-FileHash -LiteralPath $Profiles -Algorithm SHA256).Hash.ToLower(); sampleRate=24000; bits=16; channels=1; productionSelected=$false; clips=$comicRows }
[IO.Directory]::CreateDirectory((Join-Path $comicOutputRoot 'records')) | Out-Null
$comicReceiptPath = Join-Path $comicOutputRoot ('records/voice-auditions-' + [DateTime]::UtcNow.ToString('yyyyMMddTHHmmssfffZ') + '.json')
[IO.File]::WriteAllText($comicReceiptPath, ($comicReceipt | ConvertTo-Json -Depth 12), (New-Object Text.UTF8Encoding($false)))
Write-Output "Rendered $($comicRows.Count) candidate samples. Receipt: $comicReceiptPath"
