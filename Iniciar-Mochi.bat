@echo off
rem Doble clic para abrir Mochi. Lanza el script de PowerShell sin consola visible.
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "%~dp0Iniciar-Mochi.ps1"
