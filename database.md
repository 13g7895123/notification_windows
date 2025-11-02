CREATE TABLE notifications (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    project         VARCHAR(100) NOT NULL COMMENT '專案名稱，例如: crm、backend、game_bot',
    title           VARCHAR(100) NOT NULL COMMENT '通知標題',
    message         TEXT NOT NULL COMMENT '通知內容',
    status          TINYINT NOT NULL DEFAULT 0 COMMENT '0=未通知, 1=已通知',
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '建立時間',
    notified_at     DATETIME NULL COMMENT '實際通知時間'
);