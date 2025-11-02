package main

import (
	"windows-notification/internal/gui"
)

func main() {
	// 建立並執行 GUI 應用程式
	window := gui.NewAppWindow()
	window.Run()
}
