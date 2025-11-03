package notification

import (
	"fmt"

	"github.com/go-toast/toast"
	"windows-notification/internal/logger"
)

// Notifier 負責顯示系統通知
type Notifier struct {
	AppID  string
	Logger *logger.Logger
}

// NewNotifier 建立新的通知器
func NewNotifier(appID string, log *logger.Logger) *Notifier {
	return &Notifier{
		AppID:  appID,
		Logger: log,
	}
}

// Show 顯示 Windows 系統通知
func (n *Notifier) Show(title, message string) error {
	if n.Logger != nil {
		n.Logger.Debugf("準備顯示通知: 標題='%s', 訊息='%s'", title, message)
	}

	notification := toast.Notification{
		AppID:   n.AppID,
		Title:   title,
		Message: message,
	}

	err := notification.Push()
	if err != nil {
		if n.Logger != nil {
			n.Logger.Errorf("顯示 Windows 通知失敗: %v (標題: %s)", err, title)
		}
		return fmt.Errorf("顯示通知失敗: %w", err)
	}

	if n.Logger != nil {
		n.Logger.Debugf("Windows 通知已成功推送")
	}

	return nil
}
