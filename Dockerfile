# 使用 Go 官方映像作為建置環境
FROM golang:1.21-alpine AS builder

# 安裝必要工具和 MinGW 交叉編譯工具鏈
RUN apk add --no-cache git gcc musl-dev mingw-w64-gcc

# 設定工作目錄
WORKDIR /build

# 複製所有原始碼
COPY . .

# 下載依賴並生成 go.sum
RUN go mod tidy && go mod download

# 編譯 Windows 執行檔（交叉編譯）
# -ldflags="-H windowsgui -s -w" 參數說明：
#   -H windowsgui: 隱藏 Windows 命令列視窗
#   -s: 移除符號表
#   -w: 移除 DWARF 除錯資訊
# 這些參數可以大幅減少執行檔大小
RUN CGO_ENABLED=1 CC=x86_64-w64-mingw32-gcc GOOS=windows GOARCH=amd64 \
    go build -ldflags="-H windowsgui -s -w" -o windows-notification.exe .

# 使用 alpine 作為最終映像（方便複製檔案）
FROM alpine:latest
COPY --from=builder /build/windows-notification.exe /
COPY --from=builder /build/config.json.example /
# 預設命令（實際上不會執行，只是為了讓 docker create 能正常工作）
CMD ["/bin/sh"]
