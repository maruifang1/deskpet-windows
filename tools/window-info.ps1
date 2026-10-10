$ErrorActionPreference = "Stop"

Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
using System.Text;
public static class DeskPetWindowInfo {
    [DllImport("user32.dll")]
    public static extern IntPtr GetForegroundWindow();
    [DllImport("user32.dll", CharSet = CharSet.Unicode)]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int maxCount);
    [DllImport("user32.dll")]
    public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint processId);
    [DllImport("user32.dll")]
    public static extern bool GetWindowRect(IntPtr hWnd, out RECT rect);
    [StructLayout(LayoutKind.Sequential)]
    public struct RECT {
        public int Left;
        public int Top;
        public int Right;
        public int Bottom;
    }
}
"@

$hWnd = [DeskPetWindowInfo]::GetForegroundWindow()
$title = New-Object System.Text.StringBuilder 512
[DeskPetWindowInfo]::GetWindowText($hWnd, $title, 512) | Out-Null

$windowProcessId = [uint32]0
[DeskPetWindowInfo]::GetWindowThreadProcessId($hWnd, [ref]$windowProcessId) | Out-Null
$processName = ""
$process = Get-Process -Id $windowProcessId -ErrorAction SilentlyContinue
if ($null -ne $process) {
    $processName = $process.ProcessName
}

$rect = New-Object DeskPetWindowInfo+RECT
[DeskPetWindowInfo]::GetWindowRect($hWnd, [ref]$rect) | Out-Null

[PSCustomObject]@{
    process = $processName
    title = $title.ToString()
    left = $rect.Left
    top = $rect.Top
    right = $rect.Right
    bottom = $rect.Bottom
} | ConvertTo-Json -Compress
