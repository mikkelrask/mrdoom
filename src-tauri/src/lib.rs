pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            println!("Tauri setup is running...");
            if cfg!(debug_assertions) {
                println!("Debug mode: Initializing log plugin...");
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            // Register the dialog plugin
            if let Err(e) = app.handle().plugin(tauri_plugin_dialog::init()) {
                eprintln!("Failed to initialize dialog plugin: {}", e);
                return Err(Box::new(e));
            }

            println!("Setup complete.");
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
