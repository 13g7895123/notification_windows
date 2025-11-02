#!/bin/bash

echo "====================================="
echo "Windows 通知監控程式 - Docker 編譯"
echo "====================================="
echo ""

# 建立輸出目錄
mkdir -p dist

echo "[1/3] 正在建置 Docker 映像..."
docker build -t windows-notification-builder .
if [ $? -ne 0 ]; then
    echo "錯誤: Docker 映像建置失敗"
    exit 1
fi

echo ""
echo "[2/3] 正在從 Docker 容器中提取編譯好的執行檔..."
# 建立臨時容器並複製檔案
CONTAINER_ID=$(docker create windows-notification-builder)
if [ $? -ne 0 ]; then
    echo "錯誤: 建立容器失敗"
    exit 1
fi

docker cp $CONTAINER_ID:/windows-notification.exe ./dist/
docker cp $CONTAINER_ID:/config.json.example ./dist/
docker rm $CONTAINER_ID > /dev/null

if [ ! -f "./dist/windows-notification.exe" ]; then
    echo "錯誤: 提取執行檔失敗"
    exit 1
fi

echo ""
echo "[3/3] 檢查設定檔..."
if [ ! -f "./dist/config.json" ]; then
    echo "提示: 正在複製設定檔範例..."
    cp ./dist/config.json.example ./dist/config.json
fi

echo ""
echo "====================================="
echo "編譯完成！"
echo "====================================="
echo ""
echo "執行檔位置: ./dist/windows-notification.exe"
echo "設定檔位置: ./dist/config.json"
echo ""
echo "請將 dist 目錄中的檔案複製到 Windows 電腦上執行"
echo ""
