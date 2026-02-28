---
sidebar_position: 3
---

# 火山引擎豆包（ASR）

## 适用场景

- 长音频（会议录音、网课录音）
- 对识别精度要求高
- 单文件最大 512MB，时长最高 4 小时

## 配置步骤

1. 访问 [火山引擎控制台](https://console.volcengine.com/speech/service/8) 注册并登录。
2. 搜索"语音识别"并开通服务，获取 **App ID**。
3. 在控制台"API Key 管理"中获取 **Access Token**。
4. 确保已获得 `volc.seedasr.auc`（豆包录音文件识别模型 2.0 标准版）的调用权限。
5. 打开 Obsidian → 设置 → **Aura** → 转录服务商 → **火山引擎**。
6. 填入 **App ID** 和 **Access Token**，保存。

## 优势

- 原生支持长音频，无需手动切片
- 企业级识别精度
