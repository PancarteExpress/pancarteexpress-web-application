param([ValidateSet('production', 'development')][string]$Target = 'production')

# Variables a ne pas envoyer : propres au local, ou variables systeme Vercel
$exclude = @('NEXTAUTH_URL', 'STRIPE_WEBHOOK_SECRET')

$vars = Get-Content .env.local |
  Where-Object { $_ -match '^\s*([A-Z0-9_]+)\s*=\s*(.*)$' } |
  ForEach-Object {
    [pscustomobject]@{ Name = $Matches[1]; Value = $Matches[2].Trim().Trim('"') }
  } |
  Where-Object { $exclude -notcontains $_.Name -and $_.Name -notlike 'VERCEL_*' }

foreach ($v in $vars) {
  Write-Host "-> $($v.Name) ($Target)"

  # NEXT_PUBLIC_ est expose au navigateur : la CLI exige le type config
  $type = if ($v.Name -like 'NEXT_PUBLIC_*') { 'config' } else { 'secret' }

  vercel env rm $v.Name $Target --yes *> $null
  $v.Value | vercel env add $v.Name $Target --type $type
}