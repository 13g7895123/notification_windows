package config

import (
	"encoding/json"
	"os"
)

// Config 代表應用程式的設定
type Config struct {
	Domain   string `json:"domain"`   // API 網域
	Project  string `json:"project"`  // 專案名稱篩選
	Interval int    `json:"interval"` // 查詢間隔（秒）
	Debug    bool   `json:"debug"`    // Debug 模式
}

// Load 從指定路徑載入設定檔
func Load(path string) (*Config, error) {
	file, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	var cfg Config
	decoder := json.NewDecoder(file)
	if err := decoder.Decode(&cfg); err != nil {
		return nil, err
	}

	// 設定預設值
	if cfg.Interval == 0 {
		cfg.Interval = 5
	}

	return &cfg, nil
}

// Save 將設定儲存到指定路徑
func Save(path string, cfg *Config) error {
	file, err := os.Create(path)
	if err != nil {
		return err
	}
	defer file.Close()

	encoder := json.NewEncoder(file)
	encoder.SetIndent("", "  ")
	return encoder.Encode(cfg)
}
