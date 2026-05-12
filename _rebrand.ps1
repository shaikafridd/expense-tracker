$files = Get-ChildItem "c:\Users\sa674\Downloads\expensetraker\src\components\*.tsx" -Recurse
foreach ($f in $files) {
    $c = Get-Content $f.FullName -Raw
    $c = $c -replace "'Space Grotesk',sans-serif","'DM Mono',monospace"
    $c = $c -replace '#8b5cf6','#2D6A4F'
    $c = $c -replace 'rgba\(139,92,246,','rgba(45,106,79,'
    Set-Content $f.FullName -Value $c -NoNewline
}
