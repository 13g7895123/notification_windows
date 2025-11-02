#!/bin/bash

# 複製腳本 - 根據 copy-config.json 設定檔複製檔案

CONFIG_FILE="copy-config.json"

echo "====================================="
echo "檔案複製工具"
echo "====================================="
echo ""

# 檢查設定檔是否存在
if [ ! -f "$CONFIG_FILE" ]; then
    echo "錯誤: 找不到設定檔 $CONFIG_FILE"
    exit 1
fi

# 檢查是否已安裝 jq（用於解析 JSON）
if ! command -v jq &> /dev/null; then
    echo "警告: 未安裝 jq，使用替代方法解析 JSON"
    USE_JQ=false
else
    USE_JQ=true
fi

# 讀取設定檔
if [ "$USE_JQ" = true ]; then
    # 使用 jq 解析 JSON
    SOURCE_DIR=$(jq -r '.source_dir' "$CONFIG_FILE")
    DEST_DIR=$(jq -r '.destination_dir' "$CONFIG_FILE")
    FILES=$(jq -r '.files[]' "$CONFIG_FILE")
else
    # 使用 grep 和 sed 簡單解析 JSON（不完美但可用）
    SOURCE_DIR=$(grep -o '"source_dir"[^,}]*' "$CONFIG_FILE" | sed 's/"source_dir":[[:space:]]*"\(.*\)"/\1/')
    DEST_DIR=$(grep -o '"destination_dir"[^,}]*' "$CONFIG_FILE" | sed 's/"destination_dir":[[:space:]]*"\(.*\)"/\1/')
    FILES=$(grep -o '"[^"]*\.exe"' "$CONFIG_FILE" | tr -d '"')
    FILES="$FILES
$(grep -o '"[^"]*\.json"' "$CONFIG_FILE" | grep -v "source_dir\|destination_dir" | tr -d '"')"
fi

echo "來源目錄: $SOURCE_DIR"
echo "目的目錄: $DEST_DIR"
echo ""

# 檢查來源目錄是否存在
if [ ! -d "$SOURCE_DIR" ]; then
    echo "錯誤: 來源目錄不存在: $SOURCE_DIR"
    exit 1
fi

# 建立目的目錄（如果不存在）
if [ ! -d "$DEST_DIR" ]; then
    echo "[建立] 建立目的目錄: $DEST_DIR"
    mkdir -p "$DEST_DIR"
    if [ $? -ne 0 ]; then
        echo "錯誤: 無法建立目錄 $DEST_DIR"
        exit 1
    fi
fi

# 複製檔案
echo "開始複製檔案..."
echo ""

SUCCESS_COUNT=0
FAIL_COUNT=0

while IFS= read -r file; do
    # 跳過空行
    [ -z "$file" ] && continue

    SOURCE_FILE="$SOURCE_DIR/$file"
    DEST_FILE="$DEST_DIR/$file"

    if [ -f "$SOURCE_FILE" ]; then
        echo "[複製] $SOURCE_FILE -> $DEST_FILE"
        cp "$SOURCE_FILE" "$DEST_FILE"
        if [ $? -eq 0 ]; then
            SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
        else
            echo "  ✗ 失敗"
            FAIL_COUNT=$((FAIL_COUNT + 1))
        fi
    else
        echo "[跳過] 檔案不存在: $SOURCE_FILE"
        FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
done <<< "$FILES"

echo ""
echo "====================================="
echo "複製完成！"
echo "====================================="
echo "成功: $SUCCESS_COUNT 個檔案"
echo "失敗: $FAIL_COUNT 個檔案"
echo "目的目錄: $DEST_DIR"
echo ""
