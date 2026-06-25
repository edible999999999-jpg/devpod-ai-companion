mod commands;
mod config;
mod event_bus;
mod hook_server;
mod qoder_log_watcher;

use std::sync::Arc;
use tauri::{Emitter, Manager};

pub fn run() {
    env_logger::init();

    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .setup(|app| {
            let app_handle = app.handle().clone();

            // Set up the main pet window
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.set_always_on_top(true);
                let _ = window.set_skip_taskbar(true);
                let _ = window.set_shadow(false);
                let _ = window.set_background_color(Some(tauri::window::Color(0, 0, 0, 0)));

                #[cfg(target_os = "macos")]
                apply_macos_transparency_and_circle(&window);
            }

            // Load configuration
            let config = config::AppConfig::load(&app_handle);
            app.manage(Arc::new(std::sync::Mutex::new(config)));

            // Start the hook event server
            let server_handle = app_handle.clone();
            std::thread::spawn(move || {
                let rt = tokio::runtime::Runtime::new().unwrap();
                rt.block_on(hook_server::start_server(server_handle));
            });

            // Start QoderWork session log watcher
            qoder_log_watcher::start_watcher(app_handle.clone());

            // Build system tray menu
            setup_tray(app)?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_config,
            commands::save_config,
            commands::get_hook_port,
            commands::install_hooks,
            commands::uninstall_hooks,
            commands::get_events,
            commands::respond_to_permission,
            commands::toggle_settings,
            commands::send_notification,
        ])
        .run(tauri::generate_context!())
        .expect("error while running DevPod");
}

/// Apply macOS-specific transparency and circular window mask
#[cfg(target_os = "macos")]
fn apply_macos_transparency_and_circle(window: &tauri::WebviewWindow) {
    use cocoa::appkit::NSWindow;
    use cocoa::base::{id, nil};
    use cocoa::foundation::NSAutoreleasePool;
    use objc::{msg_send, class, sel, sel_impl};

    // Core Graphics types for creating circular path
    #[repr(C)]
    #[derive(Clone, Copy)]
    struct CGPoint { x: f64, y: f64 }
    #[repr(C)]
    #[derive(Clone, Copy)]
    struct CGSize { width: f64, height: f64 }
    #[repr(C)]
    #[derive(Clone, Copy)]
    struct CGRect { origin: CGPoint, size: CGSize }
    #[repr(C)]
    #[derive(Clone, Copy)]
    struct CGAffineTransform {
        a: f64, b: f64, c: f64, d: f64, tx: f64, ty: f64,
    }

    use cocoa::appkit::{NSColor, NSWindowStyleMask};

    #[link(name = "CoreGraphics", kind = "framework")]
    extern "C" {
        fn CGPathCreateMutable() -> id;
        fn CGPathAddEllipseInRect(
            path: id,
            transform: *const CGAffineTransform,
            rect: CGRect,
        );
        fn CGColorSpaceCreateDeviceRGB() -> id;
        fn CGColorCreate(space: id, components: *const f64) -> id;
        fn CGColorRelease(color: id);
    }

    let _ = window.set_visible_on_all_workspaces(true);

    let ns_window = match window.ns_window() {
        Ok(w) => w as id,
        Err(_) => return,
    };

    unsafe {
        let pool = NSAutoreleasePool::new(nil);

        // 1. Set NSWindow background to fully clear and borderless
        let clear_color: id = NSColor::clearColor(nil);
        ns_window.setBackgroundColor_(clear_color);
        ns_window.setOpaque_(false);
        ns_window.setHasShadow_(false);
        ns_window.setStyleMask_(NSWindowStyleMask::NSBorderlessWindowMask);

        // 2. Make the content view layer-backed and fully transparent
        let content_view: id = ns_window.contentView();
        let _: () = msg_send![content_view, setWantsLayer: true];

        let mut layer: id = msg_send![content_view, layer];
        if layer == nil {
            let new_layer: id = msg_send![class!(CALayer), layer];
            let _: () = msg_send![content_view, setLayer: new_layer];
            layer = new_layer;
        }

        // Layer must be non-opaque and have a clear backgroundColor
        let _: () = msg_send![layer, setOpaque: false];
        let color_space = CGColorSpaceCreateDeviceRGB();
        let components: [f64; 4] = [0.0, 0.0, 0.0, 0.0]; // R, G, B, A
        let clear_cg_color = CGColorCreate(color_space, components.as_ptr());
        let _: () = msg_send![layer, setBackgroundColor: clear_cg_color];
        CGColorRelease(clear_cg_color);

        // 3. Set WKWebView backgrounds to transparent
        fn make_webview_transparent(view: id) {
            unsafe {
                let class_name: id = msg_send![view, className];
                let bytes: *const std::os::raw::c_char = msg_send![class_name, UTF8String];
                let class_str = std::ffi::CStr::from_ptr(bytes).to_str().unwrap_or("");
                if class_str.contains("WKWebView") || class_str.contains("WebViewer") {
                    let _: () = msg_send![view, setValue: false forKey: "drawsBackground"];
                    let _: () = msg_send![view, setValue: false forKey: "opaque"];
                }
                let subviews: id = msg_send![view, subviews];
                let count: usize = msg_send![subviews, count];
                for i in 0..count {
                    let subview: id = msg_send![subviews, objectAtIndex: i];
                    make_webview_transparent(subview);
                }
            }
        }
        make_webview_transparent(content_view);

        // 4. Create circular mask using CAShapeLayer + CGPath
        let frame: cocoa::foundation::NSRect = msg_send![content_view, bounds];
        let cg_rect = CGRect {
            origin: CGPoint { x: 0.0, y: 0.0 },
            size: CGSize { width: frame.size.width, height: frame.size.height },
        };

        let cg_path = CGPathCreateMutable();
        let identity = CGAffineTransform {
            a: 1.0, b: 0.0, c: 0.0, d: 1.0, tx: 0.0, ty: 0.0,
        };
        CGPathAddEllipseInRect(cg_path, &identity, cg_rect);

        let mask_layer: id = msg_send![class!(CAShapeLayer), layer];
        let _: () = msg_send![mask_layer, setPath: cg_path];
        let _: () = msg_send![layer, setMask: mask_layer];

        let _: () = msg_send![cg_path, release];

        let _: () = msg_send![pool, drain];
    }
}

fn setup_tray(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    use tauri::{
        menu::{Menu, MenuItem},
        tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    };

    let show = MenuItem::with_id(app, "show", "Show DevPod", true, None::<&str>)?;
    let hide = MenuItem::with_id(app, "hide", "Hide DevPod", true, None::<&str>)?;
    let settings = MenuItem::with_id(app, "settings", "Settings...", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&show, &hide, &settings, &quit])?;

    TrayIconBuilder::with_id("devpod-tray")
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&menu)
        .tooltip("DevPod - Developer Podcast Pet")
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "quit" => {
                app.exit(0);
            }
            "show" => {
                if let Some(win) = app.get_webview_window("main") {
                    let _ = win.show();
                    let _ = win.set_focus();
                }
            }
            "hide" => {
                if let Some(win) = app.get_webview_window("main") {
                    let _ = win.hide();
                }
            }
            "settings" => {
                if let Some(win) = app.get_webview_window("settings") {
                    let _ = win.show();
                    let _ = win.set_focus();
                }
            }
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                let app = tray.app_handle();
                if let Some(win) = app.get_webview_window("main") {
                    let _ = win.show();
                    let _ = win.set_focus();
                }
            }
        })
        .build(app)?;

    Ok(())
}
