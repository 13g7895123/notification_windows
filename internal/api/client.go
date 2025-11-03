package api

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"windows-notification/internal/logger"
)

// Notification 代表一個通知項目
type Notification struct {
	ID         string `json:"id"`
	Project    string `json:"project"`
	Title      string `json:"title"`
	Message    string `json:"message"`
	Status     string `json:"status"`
	CreatedAt  string `json:"created_at"`
	NotifiedAt string `json:"notified_at"`
}

// APIResponse 代表 API 的回應格式
type APIResponse struct {
	Success bool           `json:"success"`
	Data    []Notification `json:"data"`
	Count   int            `json:"count"`
	Message string         `json:"message"`
}

// Client 是 API 客戶端
type Client struct {
	BaseURL    string
	HTTPClient *http.Client
	Logger     *logger.Logger
}

// NewClientWithLogger 建立新的 API 客戶端（使用 logger）
func NewClientWithLogger(baseURL string, log *logger.Logger) *Client {
	return &Client{
		BaseURL: baseURL,
		HTTPClient: &http.Client{
			Timeout: 10 * time.Second,
		},
		Logger: log,
	}
}

// GetUnnotifiedNotifications 取得未通知的通知列表
func (c *Client) GetUnnotifiedNotifications(project string) ([]Notification, error) {
	url := fmt.Sprintf("%s/api/notifications?status=0", c.BaseURL)
	if project != "" {
		url += fmt.Sprintf("&project=%s", project)
	}

	// Log request
	startTime := time.Now()
	if c.Logger != nil {
		c.Logger.Debugf("API 請求: GET %s", url)
	}

	resp, err := c.HTTPClient.Get(url)
	duration := time.Since(startTime).Milliseconds()

	if err != nil {
		if c.Logger != nil {
			c.Logger.Errorf("API 請求失敗 (%dms): %v", duration, err)
		}
		return nil, fmt.Errorf("API 請求失敗: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		if c.Logger != nil {
			c.Logger.Errorf("API 回應錯誤: HTTP %d (%dms)", resp.StatusCode, duration)
		}
		return nil, fmt.Errorf("API 回應錯誤: %d", resp.StatusCode)
	}

	var apiResp APIResponse
	if err := json.NewDecoder(resp.Body).Decode(&apiResp); err != nil {
		if c.Logger != nil {
			c.Logger.Errorf("解析回應失敗 (%dms): %v", duration, err)
		}
		return nil, fmt.Errorf("解析回應失敗: %w", err)
	}

	// Log response
	if c.Logger != nil {
		c.Logger.Debugf("API 回應: HTTP 200 (%dms) | 數量: %d | 成功: %v", duration, apiResp.Count, apiResp.Success)
	}

	if !apiResp.Success {
		if c.Logger != nil {
			c.Logger.Errorf("API 回應失敗: %s", apiResp.Message)
		}
		return nil, fmt.Errorf("API 回應失敗: %s", apiResp.Message)
	}

	return apiResp.Data, nil
}

// UpdateNotificationStatus 更新通知狀態為已通知
func (c *Client) UpdateNotificationStatus(id string) error {
	url := fmt.Sprintf("%s/api/notifications/%s/status", c.BaseURL, id)

	payload := map[string]int{"status": 1}
	jsonData, err := json.Marshal(payload)
	if err != nil {
		if c.Logger != nil {
			c.Logger.Errorf("建立請求失敗: %v", err)
		}
		return fmt.Errorf("建立請求失敗: %w", err)
	}

	// Log request
	startTime := time.Now()
	if c.Logger != nil {
		c.Logger.Debugf("API 請求: PATCH %s | Body: %s", url, string(jsonData))
	}

	req, err := http.NewRequest(http.MethodPatch, url, bytes.NewBuffer(jsonData))
	if err != nil {
		if c.Logger != nil {
			c.Logger.Errorf("建立請求失敗: %v", err)
		}
		return fmt.Errorf("建立請求失敗: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.HTTPClient.Do(req)
	duration := time.Since(startTime).Milliseconds()

	if err != nil {
		if c.Logger != nil {
			c.Logger.Errorf("API 請求失敗 (%dms): %v", duration, err)
		}
		return fmt.Errorf("API 請求失敗: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		if c.Logger != nil {
			c.Logger.Errorf("API 回應錯誤: HTTP %d (%dms)", resp.StatusCode, duration)
		}
		return fmt.Errorf("API 回應錯誤: %d", resp.StatusCode)
	}

	var apiResp APIResponse
	if err := json.NewDecoder(resp.Body).Decode(&apiResp); err != nil {
		if c.Logger != nil {
			c.Logger.Errorf("解析回應失敗 (%dms): %v", duration, err)
		}
		return fmt.Errorf("解析回應失敗: %w", err)
	}

	// Log response
	if c.Logger != nil {
		c.Logger.Debugf("API 回應: HTTP 200 (%dms) | 成功: %v | 訊息: %s", duration, apiResp.Success, apiResp.Message)
	}

	if !apiResp.Success {
		if c.Logger != nil {
			c.Logger.Errorf("API 回應失敗: %s", apiResp.Message)
		}
		return fmt.Errorf("API 回應失敗: %s", apiResp.Message)
	}

	return nil
}
