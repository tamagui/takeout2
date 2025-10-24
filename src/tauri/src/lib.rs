use tauri::{Emitter, Manager, Window, menu::{MenuBuilder, MenuItemBuilder, PredefinedMenuItem, SubmenuBuilder}};
use window_vibrancy::*;

#[tauri::command]
fn set_vibrancy(window: Window, is_dark_mode: bool) {
    #[cfg(target_os = "macos")]
    {
        let material = if is_dark_mode {
            NSVisualEffectMaterial::HudWindow
        } else {
            NSVisualEffectMaterial::HudWindow
        };

        apply_vibrancy(&window, material, None, None).expect("Failed to apply vibrancy");
    }
}

#[tauri::command]
fn create_test_window(app_handle: tauri::AppHandle) -> Result<(), String> {
    let window = tauri::WebviewWindowBuilder::new(
        &app_handle,
        "test",
        tauri::WebviewUrl::App("/sub-window".into()),
    )
    .title("Test Window")
    .inner_size(320.0, 350.0)
    .resizable(true)
    .maximizable(true)
    .hidden_title(true)
    .title_bar_style(tauri::TitleBarStyle::Overlay)
    .visible(false)
    .shadow(true)
    .transparent(true)
    .build()
    .map_err(|e| e.to_string())?;

    #[cfg(target_os = "macos")]
    {
        let material = NSVisualEffectMaterial::Sidebar;
        apply_vibrancy(&window, material, None, None)
            .map_err(|e| format!("Failed to apply vibrancy: {}", e))?;
    }

    window.show().map_err(|e| e.to_string())?;

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_window_state::Builder::new().build())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_updater::Builder::new().build());

    builder
        .plugin(tauri_plugin_single_instance::init(|app, args, _cwd| {
            println!("a new app instance was opened with {args:?}");
            let _ = app
                .get_webview_window("main")
                .expect("no main window")
                .set_focus();
        }))
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_process::init())
        .setup(|app| {
            let window = app.get_webview_window("main").unwrap();

            #[cfg(target_os = "macos")]
            apply_vibrancy(&window, NSVisualEffectMaterial::HudWindow, None, None)
                .expect("Unsupported platform! 'apply_vibrancy' is only supported on macOS");

            // Create complete native menu in Rust
            let app_submenu = SubmenuBuilder::new(app, "App")
                .item(&MenuItemBuilder::with_id("settings", "Settings")
                    .accelerator("CmdOrCtrl+,")
                    .build(app)?)
                .separator()
                .item(&PredefinedMenuItem::quit(app, Some("Quit"))?)
                .build()?;

            let file_submenu = SubmenuBuilder::new(app, "File")
                .item(&PredefinedMenuItem::close_window(app, Some("Close Window"))?)
                .build()?;

            let edit_submenu = SubmenuBuilder::new(app, "Edit")
                .item(&PredefinedMenuItem::undo(app, Some("Undo"))?)
                .item(&PredefinedMenuItem::redo(app, Some("Redo"))?)
                .separator()
                .item(&PredefinedMenuItem::cut(app, Some("Cut"))?)
                .item(&PredefinedMenuItem::copy(app, Some("Copy"))?)
                .item(&PredefinedMenuItem::paste(app, Some("Paste"))?)
                .item(&PredefinedMenuItem::select_all(app, Some("Select All"))?)
                .build()?;

            let view_submenu = SubmenuBuilder::new(app, "View")
                .item(&MenuItemBuilder::with_id("reload", "Reload Page")
                    .accelerator("CmdOrCtrl+R")
                    .build(app)?)
                .separator()
                .item(&PredefinedMenuItem::fullscreen(app, Some("Enter Full Screen"))?)
                .build()?;

            let window_submenu = SubmenuBuilder::new(app, "Window")
                .item(&PredefinedMenuItem::minimize(app, Some("Minimize"))?)
                .item(&PredefinedMenuItem::maximize(app, Some("Maximize"))?)
                .build()?;

            let help_submenu = SubmenuBuilder::new(app, "Help")
                .build()?;

            let menu = MenuBuilder::new(app)
                .item(&app_submenu)
                .item(&file_submenu)
                .item(&edit_submenu)
                .item(&view_submenu)
                .item(&window_submenu)
                .item(&help_submenu)
                .build()?;

            app.set_menu(menu)?;

            // Handle menu events
            app.on_menu_event(move |app, event| {
                match event.id.as_ref() {
                    "reload" => {
                        // Force reload the webview - works even when page is offline
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.eval("window.location.reload()");
                        }
                    }
                    "settings" => {
                        // Emit event to JavaScript to handle settings navigation
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.emit("menu-settings", ());
                        }
                    }
                    _ => {}
                }
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![set_vibrancy, create_test_window])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
