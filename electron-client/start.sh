#!/bin/bash

# Electron Client 啟動腳本
# 用途：自動檢查依賴、建置並啟動 Electron 應用程式

set -e  # 遇到錯誤時停止執行

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 取得腳本所在目錄
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 日誌函數
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 檢查 Node.js 是否安裝
check_nodejs() {
    log_info "檢查 Node.js..."
    if ! command -v node &> /dev/null; then
        log_error "未找到 Node.js，請先安裝 Node.js 18 或更新版本"
        exit 1
    fi
    
    NODE_VERSION=$(node -v)
    log_success "Node.js 版本: $NODE_VERSION"
}

# 檢查 npm 是否安裝
check_npm() {
    log_info "檢查 npm..."
    if ! command -v npm &> /dev/null; then
        log_error "未找到 npm，請先安裝 npm"
        exit 1
    fi
    
    NPM_VERSION=$(npm -v)
    log_success "npm 版本: $NPM_VERSION"
}

# 檢查並安裝依賴
check_dependencies() {
    log_info "檢查依賴套件..."
    
    if [ ! -d "node_modules" ]; then
        log_warning "未找到 node_modules 目錄，開始安裝依賴..."
        npm install
        log_success "依賴安裝完成"
    else
        log_success "依賴套件已存在"
    fi
}

# 檢查設定檔
check_config() {
    log_info "檢查設定檔..."
    
    if [ ! -f "config.json" ]; then
        log_warning "未找到 config.json，從範例建立..."
        if [ -f "config.json.example" ]; then
            cp config.json.example config.json
            log_success "已建立 config.json，請編輯設定後重新執行"
            log_info "編輯命令: nano config.json 或 vim config.json"
            exit 0
        else
            log_error "未找到 config.json.example"
            exit 1
        fi
    else
        log_success "設定檔存在"
    fi
}

# 建置專案
build_project() {
    log_info "檢查建置檔案..."
    
    # 檢查是否需要建置
    if [ ! -d "dist" ] || [ ! -f "dist/main/index.js" ]; then
        log_warning "未找到建置檔案，開始建置專案..."
        npm run build
        log_success "建置完成"
    else
        log_success "建置檔案已存在"
        
        # 詢問是否重新建置
        read -p "是否要重新建置專案? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            log_info "重新建置專案..."
            npm run build
            log_success "建置完成"
        fi
    fi
}

# 啟動應用程式
start_app() {
    log_info "啟動 Electron 應用程式..."
    echo ""
    log_success "應用程式啟動中..."
    log_info "按 Ctrl+C 可停止應用程式"
    echo ""
    
    # 使用 npx 啟動 Electron，並禁用 GPU 加速（避免 Linux 上的問題）
    npx electron . --disable-gpu
}

# 主函數
main() {
    echo ""
    echo "========================================="
    echo "  Electron 通知監控客戶端 - 啟動腳本"
    echo "========================================="
    echo ""
    
    # 執行檢查流程
    check_nodejs
    check_npm
    check_dependencies
    check_config
    build_project
    
    echo ""
    echo "========================================="
    
    # 啟動應用程式
    start_app
}

# 執行主函數
main
