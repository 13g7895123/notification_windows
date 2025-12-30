#!/bin/bash

# API Key 診斷腳本
# 用於檢查 API Key 設定和測試連線

set -e

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 取得腳本所在目錄
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo ""
echo "========================================="
echo "  API Key 診斷工具"
echo "========================================="
echo ""

# 1. 檢查設定檔
echo -e "${BLUE}[1/4]${NC} 檢查設定檔..."

if [ ! -f "config.json" ]; then
    echo -e "${RED}✗ 找不到 config.json${NC}"
    echo "請先複製 config.json.example 並填入設定"
    exit 1
fi

echo -e "${GREEN}✓ config.json 存在${NC}"

# 2. 讀取 API Key
echo -e "${BLUE}[2/4]${NC} 檢查 API Key..."

API_KEY=$(node -pe "JSON.parse(require('fs').readFileSync('config.json', 'utf8')).apiKey || ''")
DOMAIN=$(node -pe "JSON.parse(require('fs').readFileSync('config.json', 'utf8')).domain || ''")

if [ -z "$API_KEY" ]; then
    echo -e "${RED}✗ API Key 未設定！${NC}"
    echo ""
    echo "請在 config.json 中設定 apiKey："
    echo ""
    echo '{'
    echo '  "domain": "https://notify.try-8verything.com",'
    echo '  "apiKey": "YOUR_API_KEY_HERE",'
    echo '  "project": "your_project",'
    echo '  "interval": 5'
    echo '}'
    echo ""
    echo "或在應用程式的 UI 中設定 API Key"
    exit 1
fi

API_KEY_LENGTH=${#API_KEY}
API_KEY_PREFIX="${API_KEY:0:8}"

echo -e "${GREEN}✓ API Key 已設定${NC}"
echo "  長度: $API_KEY_LENGTH 字元"
echo "  前綴: $API_KEY_PREFIX..."
echo ""

# 3. 檢查 Domain
echo -e "${BLUE}[3/4]${NC} 檢查 API Domain..."

if [ -z "$DOMAIN" ]; then
    echo -e "${RED}✗ Domain 未設定${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Domain: $DOMAIN${NC}"
echo ""

# 4. 測試 API 連線
echo -e "${BLUE}[4/4]${NC} 測試 API 連線..."
echo ""

TEST_URL="$DOMAIN/api/notifications/windows/pending"

echo "請求 URL: $TEST_URL"
echo "API Key: $API_KEY_PREFIX... (長度: $API_KEY_LENGTH)"
echo ""

# 使用 curl 測試
echo "執行測試..."
HTTP_CODE=$(curl -s -o /tmp/api_response.json -w "%{http_code}" \
    -H "X-API-Key: $API_KEY" \
    -H "Content-Type: application/json" \
    "$TEST_URL")

echo ""
echo "HTTP 狀態碼: $HTTP_CODE"
echo ""

if [ -f /tmp/api_response.json ]; then
    echo "回應內容:"
    cat /tmp/api_response.json | jq '.' 2>/dev/null || cat /tmp/api_response.json
    echo ""
fi

echo ""
echo "========================================="

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ API 連線測試成功！${NC}"
    echo ""
    echo "您的 API Key 設定正確，可以正常使用。"
elif [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "403" ]; then
    echo -e "${RED}✗ 認證失敗（HTTP $HTTP_CODE）${NC}"
    echo ""
    echo "可能的原因："
    echo "1. API Key 不正確或已過期"
    echo "2. API Key 沒有正確的權限"
    echo "3. API Key 格式錯誤（有多餘的空格或換行）"
    echo ""
    echo "請檢查："
    echo "- 從管理後台重新取得正確的 API Key"
    echo "- 確認 API Key 沒有多餘的空格"
    echo "- 確認 API Key 有正確的權限"
    echo ""
    echo "當前 API Key 資訊："
    echo "  完整內容: $API_KEY"
    echo "  長度: $API_KEY_LENGTH"
    echo "  是否含空格: $(echo "$API_KEY" | grep -q ' ' && echo '是' || echo '否')"
    exit 1
else
    echo -e "${YELLOW}⚠ 收到非預期的 HTTP 狀態碼: $HTTP_CODE${NC}"
    echo ""
    echo "請檢查："
    echo "- 網路連線是否正常"
    echo "- API 伺服器是否正常運行"
    echo "- Domain 設定是否正確"
    exit 1
fi

echo "========================================="
echo ""

# 清理臨時檔案
rm -f /tmp/api_response.json
