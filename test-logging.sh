#!/bin/bash

echo "====================================="
echo "Windows 通知監控程式 - 日誌系統測試"
echo "====================================="
echo ""

# 檢查是否存在 logs 目錄
if [ ! -d "logs" ]; then
    echo "✅ logs 目錄不存在，程式會自動建立"
else
    echo "✅ logs 目錄已存在"
    echo "   現有日誌檔案："
    ls -lh logs/*.log 2>/dev/null || echo "   （尚無日誌檔案）"
fi

echo ""
echo "日誌系統功能："
echo "1. 自動建立 logs/ 目錄"
echo "2. 使用日期命名日誌檔：app_YYYY-MM-DD.log"
echo "3. 同時輸出到 GUI 和檔案"
echo "4. 支援多種日誌級別：DEBUG, INFO, WARN, ERROR, SUCCESS"
echo "5. Debug 模式可控制是否記錄 DEBUG 級別日誌"
echo ""
echo "使用說明："
echo "1. 執行程式後，會在 logs/ 目錄自動建立今天的日誌檔"
echo "2. 在 GUI 中勾選 'Debug Mode' 可啟用詳細日誌"
echo "3. 點擊 'Test API' 可測試 API 連線並查看日誌"
echo "4. 所有操作都會同時顯示在 GUI 和寫入日誌檔"
echo ""
echo "排查問題："
echo "1. 如果程式無法正常運行，先勾選 Debug Mode"
echo "2. 查看 GUI 下方的歷史記錄"
echo "3. 開啟 logs/app_$(date +%Y-%m-%d).log 查看完整日誌"
echo ""
