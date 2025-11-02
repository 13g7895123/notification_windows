package api

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
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

// DebugLogger is a function type for logging debug information
type DebugLogger func(message string)

// Client 是 API 客戶端
type Client struct {
	BaseURL     string
	HTTPClient  *http.Client
	Debug       bool
	DebugLogger DebugLogger
}

// NewClient 建立新的 API 客戶端
func NewClient(baseURL string, debug bool, logger DebugLogger) *Client {
	return &Client{
		BaseURL: baseURL,
		HTTPClient: &http.Client{
			Timeout: 10 * time.Second,
		},
		Debug:       debug,
		DebugLogger: logger,
	}
}

// logDebug logs debug information if debug mode is enabled
func (c *Client) logDebug(format string, args ...interface{}) {
	if c.Debug && c.DebugLogger != nil {
		c.DebugLogger(fmt.Sprintf(format, args...))
	}
}

// GetUnnotifiedNotifications 取得未通知的通知列表
func (c *Client) GetUnnotifiedNotifications(project string) ([]Notification, error) {
	url := fmt.Sprintf("%s/api/notifications?status=0", c.BaseURL)
	if project != "" {
		url += fmt.Sprintf("&project=%s", project)
	}

	// Debug: Log request
	startTime := time.Now()
	c.logDebug("[DEBUG] Request: GET %s", url)

	resp, err := c.HTTPClient.Get(url)
	duration := time.Since(startTime).Milliseconds()

	if err != nil {
		c.logDebug("[DEBUG] Request failed after %dms: %v", duration, err)
		return nil, fmt.Errorf("API 請求失敗: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		c.logDebug("[DEBUG] Response: Status %d (%dms)", resp.StatusCode, duration)
		return nil, fmt.Errorf("API 回應錯誤: %d", resp.StatusCode)
	}

	var apiResp APIResponse
	if err := json.NewDecoder(resp.Body).Decode(&apiResp); err != nil {
		c.logDebug("[DEBUG] Response parse error after %dms: %v", duration, err)
		return nil, fmt.Errorf("解析回應失敗: %w", err)
	}

	// Debug: Log response
	c.logDebug("[DEBUG] Response: Status 200 (%dms) | Count: %d | Success: %v", duration, apiResp.Count, apiResp.Success)

	if !apiResp.Success {
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
		return fmt.Errorf("建立請求失敗: %w", err)
	}

	// Debug: Log request
	startTime := time.Now()
	c.logDebug("[DEBUG] Request: PATCH %s | Body: %s", url, string(jsonData))

	req, err := http.NewRequest(http.MethodPatch, url, bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("建立請求失敗: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.HTTPClient.Do(req)
	duration := time.Since(startTime).Milliseconds()

	if err != nil {
		c.logDebug("[DEBUG] Request failed after %dms: %v", duration, err)
		return fmt.Errorf("API 請求失敗: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		c.logDebug("[DEBUG] Response: Status %d (%dms)", resp.StatusCode, duration)
		return fmt.Errorf("API 回應錯誤: %d", resp.StatusCode)
	}

	var apiResp APIResponse
	if err := json.NewDecoder(resp.Body).Decode(&apiResp); err != nil {
		c.logDebug("[DEBUG] Response parse error after %dms: %v", duration, err)
		return fmt.Errorf("解析回應失敗: %w", err)
	}

	// Debug: Log response
	c.logDebug("[DEBUG] Response: Status 200 (%dms) | Success: %v | Message: %s", duration, apiResp.Success, apiResp.Message)

	if !apiResp.Success {
		return fmt.Errorf("API 回應失敗: %s", apiResp.Message)
	}

	return nil
}
