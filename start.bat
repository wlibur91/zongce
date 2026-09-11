@echo off
chcp 65001 >nul
title 智慧曲园·第二课堂综测计算器
echo.
echo  正在打开：智慧曲园·第二课堂综测计算器
echo  地址：https://0a11d23e-9667-4e6c-a255-9fb0ba7832f4.dev.coze.site
echo.
start "" "https://0a11d23e-9667-4e6c-a255-9fb0ba7832f4.dev.coze.site"
if %errorlevel% neq 0 (
  echo.
  echo  [出错] 自动打开浏览器失败，请手动复制下面这行链接到浏览器地址栏：
  echo.
  echo      https://0a11d23e-9667-4e6c-a255-9fb0ba7832f4.dev.coze.site
  echo.
  pause
)
exit /b 0
