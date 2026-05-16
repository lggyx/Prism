# Prism Backend Curl Examples

PowerShell users should run `curl.exe` explicitly because `curl` may be an alias for `Invoke-WebRequest`.
For JSON requests, write the body to a temporary file and let curl read it with `--data-binary "@file"`. This avoids Windows PowerShell native-command quoting issues.

```powershell
$BASE = "http://localhost:3000/api/v1"

function Invoke-PrismJson {
  param(
    [Parameter(Mandatory = $true)][string]$Method,
    [Parameter(Mandatory = $true)][string]$Path,
    [Parameter(Mandatory = $true)][object]$Body
  )

  $json = $Body | ConvertTo-Json -Compress
  $tmp = New-TemporaryFile
  [System.IO.File]::WriteAllText($tmp.FullName, $json, [System.Text.UTF8Encoding]::new($false))
  try {
    curl.exe -X $Method "$BASE$Path" `
      -H "Content-Type: application/json" `
      --data-binary "@$($tmp.FullName)"
  } finally {
    Remove-Item $tmp.FullName -ErrorAction SilentlyContinue
  }
}
```

## Health

```powershell
curl.exe "$BASE/health"
```

## Auth

```powershell
Invoke-PrismJson POST "/auth/code" @{
  channel = "email"
  target = "alex@example.com"
  scene = "login"
}
```

```powershell
Invoke-PrismJson POST "/auth/login" @{
  channel = "email"
  target = "alex@example.com"
  code = "123456"
  deviceId = "dev_test"
}
```

## Me

```powershell
curl.exe "$BASE/me"
```

```powershell
Invoke-PrismJson PATCH "/me/settings" @{
  showCommunityLocation = $false
  locationPrecision = "OFF"
  challengeNotifications = $true
  defaultSlicePublic = $false
}
```

## Lenses

```powershell
curl.exe "$BASE/lenses?category=ALL&scope=all&includeUsage=true"
```

## Capture

```powershell
curl.exe -X POST "$BASE/captures" `
  -F "image=@.\docs\sample.jpg;type=image/jpeg" `
  -F "capturedAt=2026-05-17T01:35:00+08:00" `
  -F "latitude=31.2304" `
  -F "longitude=121.4737"
```

If you do not have an image ready, this backend currently also accepts JSON for local development:

```powershell
Invoke-PrismJson POST "/captures" @{
  capturedAt = "2026-05-17T01:35:00+08:00"
  latitude = 31.2304
  longitude = 121.4737
}
```

## Reading

```powershell
Invoke-PrismJson POST "/readings" @{
  captureId = "cap_01"
  lensId = "naturalist"
  language = "zh-CN"
}
```

Poll the returned reading id twice. The first poll returns `processing`, the second returns `succeeded`.

```powershell
curl.exe "$BASE/readings/read_01"
curl.exe "$BASE/readings/read_01"
```

Boundary states:

```powershell
Invoke-PrismJson POST "/readings" @{ captureId = "cap_01"; lensId = "mock-empty" }

Invoke-PrismJson POST "/readings" @{ captureId = "cap_01"; lensId = "mock-failed" }

Invoke-PrismJson POST "/readings" @{ captureId = "cap_01"; lensId = "mock-timeout" }
```

## Slices

Use a reading id that has already been created.

```powershell
Invoke-PrismJson POST "/slices" @{
  readingId = "read_01"
  isPublic = $false
}
```

```powershell
curl.exe "$BASE/slices?lensId=ALL&limit=20"
curl.exe "$BASE/slices/slice_01"
curl.exe "$BASE/slices?empty=1"
curl.exe "$BASE/slices?lensId=unknown"
```
