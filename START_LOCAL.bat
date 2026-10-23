@echo off
cd /d "%~dp0"
where py >nul 2>nul
if not errorlevel 1 (
  py -m http.server 8000
) else (
  python -m http.server 8000
)
pause
