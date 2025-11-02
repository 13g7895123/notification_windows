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
	"windows-notification/internal/notification"
)

// AppWindow 代表應用程式視窗
type AppWindow struct {
	app          fyne.App
	window       fyne.Window
	cfg          *config.Config
	apiClient    *api.Client
	notifier     *notification.Notifier
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

	aw := &AppWindow{
		app:      myApp,
		window:   win,
		history:  make([]string, 0),
		notifier: notification.NewNotifier("Windows Notification Monitor"),
	}

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
	aw.cfg = cfg

	// Create API client with debug logger
	debugLogger := func(msg string) {
		aw.addHistory(msg)
	}
	aw.apiClient = api.NewClient(cfg.Domain, cfg.Debug, debugLogger)

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
		// Update API client with new debug setting
		debugLogger := func(msg string) {
			aw.addHistory(msg)
		}
		aw.apiClient = api.NewClient(aw.cfg.Domain, aw.cfg.Debug, debugLogger)

		// Immediate feedback
		if checked {
			aw.addHistory("[DEBUG] Debug mode ENABLED - API calls will show detailed information")
		} else {
			aw.addHistory("[INFO] Debug mode DISABLED")
		}
	})
	aw.debugCheck.SetChecked(aw.cfg.Debug)

	// Show initial debug status
	if aw.cfg.Debug {
		aw.addHistory("[DEBUG] Debug mode is ENABLED")
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
	}

	aw.cfg.Domain = aw.domainEntry.Text
	aw.cfg.Project = aw.projectEntry.Text
	aw.cfg.Interval = interval
	aw.cfg.Debug = aw.debugCheck.Checked

	if err := config.Save("config.json", aw.cfg); err != nil {
		aw.addHistory(fmt.Sprintf("[ERROR] Failed to save config: %v", err))
	} else {
		aw.addHistory("[SUCCESS] Configuration saved")
		// Update API client with debug setting
		debugLogger := func(msg string) {
			aw.addHistory(msg)
		}
		aw.apiClient = api.NewClient(aw.cfg.Domain, aw.cfg.Debug, debugLogger)
	}
}

// testAPI tests API connection immediately
func (aw *AppWindow) testAPI() {
	aw.addHistory("[TEST] Testing API connection...")
	aw.addHistory(fmt.Sprintf("[TEST] Debug Mode: %v", aw.cfg.Debug))
	aw.addHistory(fmt.Sprintf("[TEST] Target: %s/api/notifications?status=0&project=%s", aw.cfg.Domain, aw.cfg.Project))

	// Immediately check notifications once
	go aw.checkNotifications()
}

// start begins monitoring
func (aw *AppWindow) start() {
	aw.mu.Lock()
	defer aw.mu.Unlock()

	if aw.isRunning {
		return
	}

	aw.isRunning = true
	aw.startBtn.Disable()
	aw.stopBtn.Enable()
	aw.statusLabel.SetText("Status: Monitoring...")

	ctx, cancel := context.WithCancel(context.Background())
	aw.cancelFunc = cancel

	aw.addHistory(fmt.Sprintf("[START] Monitoring started - Project: %s, Interval: %d seconds", aw.cfg.Project, aw.cfg.Interval))
	if aw.cfg.Debug {
		aw.addHistory("[START] Debug mode is ON - detailed API information will be displayed")
	}

	go aw.monitorLoop(ctx)
}

// stop stops monitoring
func (aw *AppWindow) stop() {
	aw.addHistory("[INFO] Stop function called")

	aw.mu.Lock()
	if !aw.isRunning {
		aw.mu.Unlock()
		aw.addHistory("[INFO] Already stopped, ignoring")
		return
	}

	// Cancel the context first
	cancelFunc := aw.cancelFunc
	aw.isRunning = false
	aw.mu.Unlock()

	// Cancel outside of lock
	if cancelFunc != nil {
		aw.addHistory("[INFO] Cancelling monitoring loop...")
		cancelFunc()
	}

	// Update UI
	aw.startBtn.Enable()
	aw.stopBtn.Disable()
	aw.statusLabel.SetText("Status: Stopped")
	aw.addHistory("[STOP] Monitoring stopped successfully")
}

// monitorLoop 監控迴圈
func (aw *AppWindow) monitorLoop(ctx context.Context) {
	ticker := time.NewTicker(time.Duration(aw.cfg.Interval) * time.Second)
	defer ticker.Stop()

	// 立即執行一次
	aw.checkNotifications()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			aw.checkNotifications()
		}
	}
}

// checkNotifications checks for new notifications
func (aw *AppWindow) checkNotifications() {
	notifications, err := aw.apiClient.GetUnnotifiedNotifications(aw.cfg.Project)
	if err != nil {
		aw.addHistory(fmt.Sprintf("[ERROR] API query failed: %v", err))
		return
	}

	if len(notifications) == 0 {
		return
	}

	aw.addHistory(fmt.Sprintf("[QUERY] Found %d unnotified notification(s)", len(notifications)))

	for _, notif := range notifications {
		// Show system notification
		if err := aw.notifier.Show(notif.Title, notif.Message); err != nil {
			aw.addHistory(fmt.Sprintf("[ERROR] Failed to show notification (ID: %s): %v", notif.ID, err))
			continue
		}

		// Update status to notified
		if err := aw.apiClient.UpdateNotificationStatus(notif.ID); err != nil {
			aw.addHistory(fmt.Sprintf("[ERROR] Failed to update status (ID: %s): %v", notif.ID, err))
		} else {
			aw.addHistory(fmt.Sprintf("[NOTIFIED] %s - %s", notif.Title, notif.Message))
		}
	}
}

// addHistory 新增歷史記錄
func (aw *AppWindow) addHistory(msg string) {
	timestamp := time.Now().Format("15:04:05")
	fullMsg := fmt.Sprintf("[%s] %s", timestamp, msg)

	aw.mu.Lock()
	aw.history = append([]string{fullMsg}, aw.history...)
	if len(aw.history) > 100 {
		aw.history = aw.history[:100]
	}
	aw.mu.Unlock()

	aw.historyList.Refresh()
}

// Run 執行應用程式
func (aw *AppWindow) Run() {
	aw.window.ShowAndRun()
}
