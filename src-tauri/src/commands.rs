use crate::config::AppConfig;
use crate::event_bus::PermissionDecision;
use crate::hook_server::PendingMap;
use serde_json::Value;
use std::sync::Arc;
use tauri::{Manager, State};

/// Get the current configuration
#[tauri::command]
pub async fn get_config(
    config: State<'_, Arc<std::sync::Mutex<AppConfig>>>,
) -> Result<Value, String> {
    let config = config.lock().map_err(|e| format!("Lock error: {}", e))?;
    serde_json::to_value(&*config).map_err(|e| format!("Serialize error: {}", e))
}

/// Save updated configuration
#[tauri::command]
pub async fn save_config(
    config: State<'_, Arc<std::sync::Mutex<AppConfig>>>,
    new_config: Value,
) -> Result<(), String> {
    let mut config = config.lock().map_err(|e| format!("Lock error: {}", e))?;
    let updated: AppConfig =
        serde_json::from_value(new_config).map_err(|e| format!("Parse error: {}", e))?;
    updated.save()?;
    *config = updated;
    Ok(())
}

/// Get the hook server port
#[tauri::command]
pub async fn get_hook_port(
    config: State<'_, Arc<std::sync::Mutex<AppConfig>>>,
) -> Result<u16, String> {
    let config = config.lock().map_err(|e| format!("Lock error: {}", e))?;
    Ok(config.hook_port)
}

/// Install Claude Code hooks to ~/.claude/settings.json
#[tauri::command]
pub async fn install_hooks(
    config: State<'_, Arc<std::sync::Mutex<AppConfig>>>,
) -> Result<String, String> {
    let _port = {
        let config = config.lock().map_err(|e| format!("Lock error: {}", e))?;
        config.hook_port
    };

    let home = dirs::home_dir().ok_or("Cannot determine home directory")?;
    let claude_dir = home.join(".claude");
    let settings_path = claude_dir.join("settings.json");

    // Ensure .claude directory exists
    std::fs::create_dir_all(&claude_dir).map_err(|e| format!("Failed to create .claude dir: {}", e))?;

    // Read existing settings or create new
    let mut settings: Value = if settings_path.exists() {
        let content = std::fs::read_to_string(&settings_path)
            .map_err(|e| format!("Failed to read settings: {}", e))?;
        serde_json::from_str(&content).unwrap_or(serde_json::json!({}))
    } else {
        serde_json::json!({})
    };

    // Determine hook script path
    let hook_script = home.join(".devpod").join("hooks").join("devpod-hook.sh");
    let hook_cmd = hook_script.to_string_lossy().to_string();

    // Build hooks configuration
    let devpod_hooks = serde_json::json!({
        "PermissionRequest": [{
            "hooks": [{
                "type": "command",
                "command": hook_cmd,
                "timeout": 120000
            }]
        }],
        "Stop": [{
            "hooks": [{
                "type": "command",
                "command": hook_cmd
            }]
        }],
        "TaskCompleted": [{
            "hooks": [{
                "type": "command",
                "command": hook_cmd
            }]
        }],
        "Notification": [{
            "hooks": [{
                "type": "command",
                "command": hook_cmd
            }]
        }]
    });

    // Merge hooks into settings
    if let Some(existing_hooks) = settings.get("hooks").and_then(|h| h.as_object()) {
        let mut merged = existing_hooks.clone();
        if let Some(new_hooks) = devpod_hooks.as_object() {
            for (key, value) in new_hooks {
                merged.insert(key.clone(), value.clone());
            }
        }
        settings["hooks"] = Value::Object(merged);
    } else {
        settings["hooks"] = devpod_hooks;
    }

    // Write back
    let content = serde_json::to_string_pretty(&settings)
        .map_err(|e| format!("Failed to serialize settings: {}", e))?;
    std::fs::write(&settings_path, content)
        .map_err(|e| format!("Failed to write settings: {}", e))?;

    Ok(format!(
        "Hooks installed in {:?}. Hook script: {:?}",
        settings_path, hook_script
    ))
}

/// Uninstall DevPod hooks from ~/.claude/settings.json
#[tauri::command]
pub async fn uninstall_hooks() -> Result<String, String> {
    let home = dirs::home_dir().ok_or("Cannot determine home directory")?;
    let settings_path = home.join(".claude").join("settings.json");

    if !settings_path.exists() {
        return Ok("No Claude Code settings found".to_string());
    }

    let content = std::fs::read_to_string(&settings_path)
        .map_err(|e| format!("Failed to read settings: {}", e))?;
    let mut settings: Value =
        serde_json::from_str(&content).unwrap_or(serde_json::json!({}));

    // Remove DevPod hook events
    if let Some(hooks) = settings.get_mut("hooks").and_then(|h| h.as_object_mut()) {
        let events = [
            "PermissionRequest",
            "Stop",
            "TaskCompleted",
            "Notification",
        ];
        for event in &events {
            hooks.remove(*event);
        }
    }

    let content = serde_json::to_string_pretty(&settings)
        .map_err(|e| format!("Failed to serialize: {}", e))?;
    std::fs::write(&settings_path, content)
        .map_err(|e| format!("Failed to write: {}", e))?;

    Ok("DevPod hooks removed from Claude Code settings".to_string())
}

/// Get recent events (for the frontend to display)
#[tauri::command]
pub async fn get_events() -> Result<Vec<Value>, String> {
    // For the scaffold, return empty. In production, read from a persistent store.
    Ok(vec![])
}

/// Toggle the settings window visibility
#[tauri::command]
pub async fn toggle_settings(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(win) = app.get_webview_window("settings") {
        if win.is_visible().unwrap_or(false) {
            win.hide().map_err(|e| format!("Failed to hide: {}", e))?;
        } else {
            win.show().map_err(|e| format!("Failed to show: {}", e))?;
            win.set_focus().map_err(|e| format!("Failed to focus: {}", e))?;
        }
    }
    Ok(())
}

/// Send a native system notification
#[tauri::command]
pub async fn send_notification(
    app: tauri::AppHandle,
    title: String,
    body: String,
) -> Result<(), String> {
    use tauri_plugin_notification::NotificationExt;
    app.notification()
        .builder()
        .title(&title)
        .body(&body)
        .show()
        .map_err(|e| format!("Failed to send notification: {}", e))?;
    Ok(())
}

/// Respond to a pending permission request from the frontend
#[tauri::command]
pub async fn respond_to_permission(
    pending: State<'_, PendingMap>,
    event_id: String,
    behavior: String,
    reason: Option<String>,
) -> Result<(), String> {
    let mut map = pending.lock().await;
    if let Some(mut pr) = map.remove(&event_id) {
        if let Some(sender) = pr.sender.take() {
            let decision = PermissionDecision {
                behavior,
                reason,
            };
            sender
                .send(decision)
                .map_err(|_| "Failed to send decision (receiver dropped)".to_string())?;
            Ok(())
        } else {
            Err("Already responded to this request".to_string())
        }
    } else {
        Err(format!("No pending permission request with id: {}", event_id))
    }
}
