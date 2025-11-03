package gui

import (
	"context"
	"fmt"
	"strconv"
	"sync"
	"time"

	"fyne.io/fyne/v2"
	"fyne.io/fyne/v2/app"
	"fyne.io/fyne/v2/container"
	"fyne.io/fyne/v2/widget"

	"windows-notification/internal/api"
	"windows-notification/internal/config"
	"windows-notification/internal/logger"
	"windows-notification/internal/notification"
)

// AppWindow 代表應用程式視窗
type AppWindow struct {
	app          fyne.App
	window       fyne.Window
	cfg          *config.Config
	apiClient    *api.Client
	notifier     *notification.Notifier
	logger       *logger.Logger
	isRunning    bool
	cancelFunc   context.CancelFunc
	mu           sync.Mutex
	statusLabel  *widget.Label
	historyList  *widget.List
	history      []string
	domainEntry   *widget.Entry
	projectEntry  *widget.Entry
	intervalEntry *widget.Entry
	debugCheck    *widget.Check
	startBtn      *widget.Button
	stopBtn       *widget.Button
}

// NewAppWindow creates a new application window
func NewAppWindow() *AppWindow {
	myApp := app.New()
	win := myApp.NewWindow("Windows Notification Monitor")

	// 載入設定
	cfg, err := config.Load("config.json")
	if err != nil {
		// 使用預設設定
		cfg = &config.Config{
			Domain:   "http://localhost:9204",
			Project:  "",
			Interval: 5,
		}
	}

	// 創建 logger
	log, err := logger.New(cfg.Debug)
	if err != nil {
		// 如果無法創建 logger，記錄到控制台
		fmt.Printf("警告: 無法創建 logger: %v\n", err)
	}

	aw := &AppWindow{
		app:      myApp,
		window:   win,
		history:  make([]string, 0),
		notifier: notification.NewNotifier("Windows Notification Monitor", log),
		logger:   log,
		cfg:      cfg,
	}

	// 設定 logger 的 GUI 回調
	if aw.logger != nil {
		aw.logger.SetGUICallback(func(msg string) {
			aw.addHistoryDirect(msg)
		})
	}

	// Create API client with logger
	aw.apiClient = api.NewClientWithLogger(cfg.Domain, aw.logger)

	aw.buildUI()
	return aw
}

// buildUI 建立使用者介面
func (aw *AppWindow) buildUI() {
	// Settings area
	aw.domainEntry = widget.NewEntry()
	aw.domainEntry.SetText(aw.cfg.Domain)
	aw.domainEntry.SetPlaceHolder("e.g. http://localhost:9204")

	aw.projectEntry = widget.NewEntry()
	aw.projectEntry.SetText(aw.cfg.Project)
	aw.projectEntry.SetPlaceHolder("e.g. free_youtube")

	aw.intervalEntry = widget.NewEntry()
	aw.intervalEntry.SetText(strconv.Itoa(aw.cfg.Interval))
	aw.intervalEntry.SetPlaceHolder("Interval (seconds)")

	aw.debugCheck = widget.NewCheck("Debug Mode", func(checked bool) {
		aw.cfg.Debug = checked
		
		// 更新 logger 的 debug 模式
		if aw.logger != nil {
			aw.logger.SetDebugMode(checked)
		}

		// 更新 API client
		aw.apiClient = api.NewClientWithLogger(aw.cfg.Domain, aw.logger)

		// Immediate feedback
		if checked {
			if aw.logger != nil {
				aw.logger.Info("Debug 模式已開啟 - API 呼叫將顯示詳細資訊")
			}
		} else {
			if aw.logger != nil {
				aw.logger.Info("Debug 模式已關閉")
			}
		}
	})
	aw.debugCheck.SetChecked(aw.cfg.Debug)

	// Show initial debug status
	if aw.cfg.Debug && aw.logger != nil {
		aw.logger.Debug("Debug 模式已啟用")
	}

	settingsForm := container.NewVBox(
		widget.NewLabel("API Domain:"),
		aw.domainEntry,
		widget.NewLabel("Project Name:"),
		aw.projectEntry,
		widget.NewLabel("Check Interval (seconds):"),
		aw.intervalEntry,
		aw.debugCheck,
	)

	// Save button
	saveBtn := widget.NewButton("Save Config", func() {
		aw.saveConfig()
	})

	// Test API button
	testBtn := widget.NewButton("Test API", func() {
		aw.testAPI()
	})

	// Control buttons
	aw.startBtn = widget.NewButton("Start Monitoring", func() {
		aw.start()
	})

	aw.stopBtn = widget.NewButton("Stop Monitoring", func() {
		aw.addHistory("[INFO] Stop button clicked")
		go aw.stop()
	})
	aw.stopBtn.Disable()

	controlBox := container.NewHBox(aw.startBtn, aw.stopBtn, testBtn, saveBtn)

	// Status label
	aw.statusLabel = widget.NewLabel("Status: Not Started")

	// Notification history list
	aw.historyList = widget.NewList(
		func() int {
			return len(aw.history)
		},
		func() fyne.CanvasObject {
			return widget.NewLabel("")
		},
		func(id widget.ListItemID, obj fyne.CanvasObject) {
			label := obj.(*widget.Label)
			label.SetText(aw.history[id])
		},
	)

	historyBox := container.NewVBox(
		widget.NewLabel("Notification History:"),
		aw.historyList,
	)

	// Combine all elements
	content := container.NewVBox(
		widget.NewLabel("Settings"),
		settingsForm,
		controlBox,
		aw.statusLabel,
		historyBox,
	)

	aw.window.SetContent(content)
	aw.window.Resize(fyne.NewSize(600, 500))
}

// saveConfig saves configuration
func (aw *AppWindow) saveConfig() {
	interval, err := strconv.Atoi(aw.intervalEntry.Text)
	if err != nil {
		interval = 5
		if aw.logger != nil {
			aw.logger.Warnf("無效的間隔時間，使用預設值: %d 秒", interval)
		}
	}

	aw.cfg.Domain = aw.domainEntry.Text
	aw.cfg.Project = aw.projectEntry.Text
	aw.cfg.Interval = interval
	aw.cfg.Debug = aw.debugCheck.Checked

	if err := config.Save("config.json", aw.cfg); err != nil {
		if aw.logger != nil {
			aw.logger.Errorf("儲存設定失敗: %v", err)
		}
	} else {
		if aw.logger != nil {
			aw.logger.Success("設定已儲存")
			aw.logger.Infof("Domain: %s, Project: %s, Interval: %d 秒", aw.cfg.Domain, aw.cfg.Project, aw.cfg.Interval)
		}
		// Update API client
		aw.apiClient = api.NewClientWithLogger(aw.cfg.Domain, aw.logger)
	}
}

// testAPI tests API connection immediately
func (aw *AppWindow) testAPI() {
	if aw.logger != nil {
		aw.logger.Info("開始測試 API 連線...")
		aw.logger.Infof("Debug 模式: %v", aw.cfg.Debug)
		aw.logger.Infof("目標: %s/api/notifications?status=0&project=%s", aw.cfg.Domain, aw.cfg.Project)
	}

	// Immediately check notifications once
	go aw.checkNotifications()
}

// start begins monitoring
func (aw *AppWindow) start() {
	// Add immediate debug log (before acquiring lock)
	if aw.logger != nil {
		aw.logger.Info("開始按鈕被點擊")
	}

	aw.mu.Lock()
	if aw.isRunning {
		aw.mu.Unlock()
		if aw.logger != nil {
			aw.logger.Warn("監控已在執行中，忽略重複啟動")
		}
		return
	}

	aw.isRunning = true
	aw.startBtn.Disable()
	aw.stopBtn.Enable()
	aw.statusLabel.SetText("Status: Monitoring...")

	ctx, cancel := context.WithCancel(context.Background())
	aw.cancelFunc = cancel
	aw.mu.Unlock() // Release lock before logging

	// Log start information
	if aw.logger != nil {
		aw.logger.Infof("監控已啟動 - 專案: %s, 間隔: %d 秒", aw.cfg.Project, aw.cfg.Interval)
		aw.logger.Infof("API 端點: %s", aw.cfg.Domain)
		if aw.cfg.Debug {
			aw.logger.Debug("Debug 模式已開啟 - 將顯示詳細的 API 資訊")
		}
	}

	go aw.monitorLoop(ctx)
}

// stop stops monitoring
func (aw *AppWindow) stop() {
	if aw.logger != nil {
		aw.logger.Info("停止按鈕被點擊")
	}

	aw.mu.Lock()
	if !aw.isRunning {
		aw.mu.Unlock()
		if aw.logger != nil {
			aw.logger.Warn("監控未在執行中，忽略停止操作")
		}
		return
	}

	// Save cancel function and update state
	cancelFunc := aw.cancelFunc
	aw.isRunning = false

	// Update UI while holding lock (for consistency with start())
	aw.startBtn.Enable()
	aw.stopBtn.Disable()
	aw.statusLabel.SetText("Status: Stopped")
	aw.mu.Unlock() // Release lock before logging

	// Cancel outside of lock
	if cancelFunc != nil {
		if aw.logger != nil {
			aw.logger.Info("正在取消監控迴圈...")
		}
		cancelFunc()
	}

	if aw.logger != nil {
		aw.logger.Success("監控已成功停止")
	}
}

// monitorLoop 監控迴圈
func (aw *AppWindow) monitorLoop(ctx context.Context) {
	if aw.logger != nil {
		aw.logger.Debug("監控迴圈已啟動")
	}

	ticker := time.NewTicker(time.Duration(aw.cfg.Interval) * time.Second)
	defer ticker.Stop()

	// 立即執行一次
	if aw.logger != nil {
		aw.logger.Debug("執行首次通知檢查...")
	}
	aw.checkNotifications()

	for {
		select {
		case <-ctx.Done():
			if aw.logger != nil {
				aw.logger.Debug("監控迴圈收到取消信號，正在退出...")
			}
			return
		case <-ticker.C:
			if aw.logger != nil {
				aw.logger.Debug("定時器觸發，執行通知檢查...")
			}
			aw.checkNotifications()
		}
	}
}

// checkNotifications checks for new notifications
func (aw *AppWindow) checkNotifications() {
	notifications, err := aw.apiClient.GetUnnotifiedNotifications(aw.cfg.Project)
	if err != nil {
		if aw.logger != nil {
			aw.logger.Errorf("API 查詢失敗: %v", err)
		}
		return
	}

	if len(notifications) == 0 {
		if aw.logger != nil {
			aw.logger.Debug("沒有未通知的記錄")
		}
		return
	}

	if aw.logger != nil {
		aw.logger.Infof("發現 %d 個未通知的記錄", len(notifications))
	}

	for _, notif := range notifications {
		// Show system notification
		if err := aw.notifier.Show(notif.Title, notif.Message); err != nil {
			if aw.logger != nil {
				aw.logger.Errorf("顯示通知失敗 (ID: %s): %v", notif.ID, err)
			}
			continue
		}

		// Update status to notified
		if err := aw.apiClient.UpdateNotificationStatus(notif.ID); err != nil {
			if aw.logger != nil {
				aw.logger.Errorf("更新狀態失敗 (ID: %s): %v", notif.ID, err)
			}
		} else {
			if aw.logger != nil {
				aw.logger.Successf("已通知: %s - %s", notif.Title, notif.Message)
			}
		}
	}
}

// addHistory 新增歷史記錄（已棄用，由 logger 回調）
func (aw *AppWindow) addHistory(msg string) {
	timestamp := time.Now().Format("15:04:05")
	fullMsg := fmt.Sprintf("[%s] %s", timestamp, msg)
	aw.addHistoryDirect(fullMsg)
}

// addHistoryDirect 直接新增到歷史記錄（由 logger 回調使用）
func (aw *AppWindow) addHistoryDirect(msg string) {
	aw.mu.Lock()
	aw.history = append([]string{msg}, aw.history...)
	if len(aw.history) > 100 {
		aw.history = aw.history[:100]
	}
	aw.mu.Unlock()

	aw.historyList.Refresh()
}

// Run 執行應用程式
func (aw *AppWindow) Run() {
	if aw.logger != nil {
		aw.logger.Info("應用程式視窗已開啟")
	}
	
	aw.window.ShowAndRun()
	
	// 清理資源
	if aw.logger != nil {
		aw.logger.Info("應用程式即將關閉")
		aw.logger.Close()
	}
}
