package logger

import (
	"fmt"
	"os"
	"path/filepath"
	"sync"
	"time"
)

// Level 定義日誌級別
type Level int

const (
	DEBUG Level = iota
	INFO
	WARN
	ERROR
	SUCCESS
)

// String 返回日誌級別的字串表示
func (l Level) String() string {
	switch l {
	case DEBUG:
		return "DEBUG"
	case INFO:
		return "INFO"
	case WARN:
		return "WARN"
	case ERROR:
		return "ERROR"
	case SUCCESS:
		return "SUCCESS"
	default:
		return "UNKNOWN"
	}
}

// GUICallback 是 GUI 更新回調函數類型
type GUICallback func(message string)

// Logger 負責管理日誌輸出
type Logger struct {
	file        *os.File
	mu          sync.Mutex
	guiCallback GUICallback
	debugMode   bool
}

// New 創建新的 Logger 實例
func New(debugMode bool) (*Logger, error) {
	// 創建 logs 目錄
	logsDir := "logs"
	if err := os.MkdirAll(logsDir, 0755); err != nil {
		return nil, fmt.Errorf("無法創建 logs 目錄: %w", err)
	}

	// 創建日誌文件，使用當天日期命名
	today := time.Now().Format("2006-01-02")
	logFile := filepath.Join(logsDir, fmt.Sprintf("app_%s.log", today))

	file, err := os.OpenFile(logFile, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0644)
	if err != nil {
		return nil, fmt.Errorf("無法打開日誌文件: %w", err)
	}

	logger := &Logger{
		file:      file,
		debugMode: debugMode,
	}

	// 寫入啟動日誌
	logger.log(INFO, "=== 應用程式啟動 ===")
	logger.log(INFO, fmt.Sprintf("日誌文件: %s", logFile))
	logger.log(INFO, fmt.Sprintf("Debug 模式: %v", debugMode))

	return logger, nil
}

// SetGUICallback 設定 GUI 回調函數
func (l *Logger) SetGUICallback(callback GUICallback) {
	l.mu.Lock()
	defer l.mu.Unlock()
	l.guiCallback = callback
}

// SetDebugMode 設定 debug 模式
func (l *Logger) SetDebugMode(enabled bool) {
	l.mu.Lock()
	defer l.mu.Unlock()
	l.debugMode = enabled
	l.log(INFO, fmt.Sprintf("Debug 模式已%s", map[bool]string{true: "開啟", false: "關閉"}[enabled]))
}

// log 寫入日誌（內部方法，已持有鎖）
func (l *Logger) log(level Level, message string) {
	timestamp := time.Now().Format("2006-01-02 15:04:05")
	logLine := fmt.Sprintf("[%s] [%s] %s\n", timestamp, level, message)

	// 寫入文件
	if l.file != nil {
		l.file.WriteString(logLine)
	}

	// 通知 GUI（如果有回調）
	if l.guiCallback != nil {
		// 格式化給 GUI 的消息（簡短時間格式）
		shortTime := time.Now().Format("15:04:05")
		guiMsg := fmt.Sprintf("[%s] %s", shortTime, message)
		l.guiCallback(guiMsg)
	}
}

// Log 寫入指定級別的日誌
func (l *Logger) Log(level Level, message string) {
	l.mu.Lock()
	defer l.mu.Unlock()

	// DEBUG 級別的日誌只在 debug 模式下記錄
	if level == DEBUG && !l.debugMode {
		return
	}

	l.log(level, message)
}

// Logf 格式化寫入日誌
func (l *Logger) Logf(level Level, format string, args ...interface{}) {
	l.Log(level, fmt.Sprintf(format, args...))
}

// Debug 寫入 DEBUG 級別日誌
func (l *Logger) Debug(message string) {
	l.Log(DEBUG, message)
}

// Debugf 格式化寫入 DEBUG 級別日誌
func (l *Logger) Debugf(format string, args ...interface{}) {
	l.Logf(DEBUG, format, args...)
}

// Info 寫入 INFO 級別日誌
func (l *Logger) Info(message string) {
	l.Log(INFO, message)
}

// Infof 格式化寫入 INFO 級別日誌
func (l *Logger) Infof(format string, args ...interface{}) {
	l.Logf(INFO, format, args...)
}

// Warn 寫入 WARN 級別日誌
func (l *Logger) Warn(message string) {
	l.Log(WARN, message)
}

// Warnf 格式化寫入 WARN 級別日誌
func (l *Logger) Warnf(format string, args ...interface{}) {
	l.Logf(WARN, format, args...)
}

// Error 寫入 ERROR 級別日誌
func (l *Logger) Error(message string) {
	l.Log(ERROR, message)
}

// Errorf 格式化寫入 ERROR 級別日誌
func (l *Logger) Errorf(format string, args ...interface{}) {
	l.Logf(ERROR, format, args...)
}

// Success 寫入 SUCCESS 級別日誌
func (l *Logger) Success(message string) {
	l.Log(SUCCESS, message)
}

// Successf 格式化寫入 SUCCESS 級別日誌
func (l *Logger) Successf(format string, args ...interface{}) {
	l.Logf(SUCCESS, format, args...)
}

// Close 關閉日誌文件
func (l *Logger) Close() error {
	l.mu.Lock()
	defer l.mu.Unlock()

	l.log(INFO, "=== 應用程式關閉 ===")

	if l.file != nil {
		return l.file.Close()
	}
	return nil
}
