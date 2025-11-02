package notification

import (
	"fmt"

	"github.com/go-toast/toast"
)

// Notifier 負責顯示系統通知
type Notifier struct {
	AppID string
}

// NewNotifier 建立新的通知器
func NewNotifier(appID string) *Notifier {
	return &Notifier{
		AppID: appID,
	}
}

// Show 顯示 Windows 系統通知
func (n *Notifier) Show(title, message string) error {
	notification := toast.Notification{
		AppID:   n.AppID,
		Title:   title,
		Message: message,
	}

	err := notification.Push()
	if err != nil {
		return fmt.Errorf("顯示通知失敗: %w", err)
	}

	return nil
}
