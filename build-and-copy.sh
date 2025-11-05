#!/bin/bash

echo "====================================="
echo "編譯並複製執行檔"
echo "====================================="
echo ""

# 執行 Docker 編譯
echo "[步驟 1/2] 執行 Docker 編譯..."
./build-docker.sh
if [ $? -ne 0 ]; then
    echo ""
    echo "錯誤: Docker 編譯失敗，中止作業"
    exit 1
fi

echo ""
echo "[步驟 2/2] 執行檔案複製..."
./copy.sh
if [ $? -ne 0 ]; then
    echo ""
    echo "錯誤: 檔案複製失敗"
    exit 1
fi

echo ""
echo "====================================="
echo "所有作業完成！"
echo "====================================="
echo ""
