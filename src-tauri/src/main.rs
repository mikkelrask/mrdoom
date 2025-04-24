#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use std::{env, path::PathBuf, process::Command};

fn main() {
    tauri::Builder::default()
        .setup(|_app| {
            // Define the path to your Node.js binary
            let node_path = PathBuf::from("/usr/lib/mrdoom/_up_/dist/bin/node");

            // Set environment variables
            env::set_var("LIBGL_ALWAYS_SOFTWARE", "1");
            env::set_var("WEBKIT_DISABLE_DMABUF_RENDERER", "1");
            env::set_var("MESA_GL_VERSION_OVERRIDE", "4.5");
            env::set_var("MOZ_GMP_PATH", "/usr/lib/mozilla/plugins");
            env::set_var("RUST_BACKTRACE", "1");

            // Check if we are running on Wayland and set the Wayland-specific environment variable
            if env::var("WAYLAND_DISPLAY").is_ok() {
                env::set_var("MOZ_ENABLE_WAYLAND", "1");
            }

            // Ensure Node.js binary exists
            if !node_path.exists() {
                panic!("Node binary not found at: {:?}", node_path);
            }

            // Start the Node.js server
            Command::new(&node_path)
                .arg("index.js")
                .current_dir("/usr/lib/mrdoom/_up_/dist/server")
                .spawn()
                .expect("Failed to start Node.js server");

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

