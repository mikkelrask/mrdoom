#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use std::{env, path::PathBuf, process::Command, thread, time::Duration, net::TcpStream, io::ErrorKind};

// Function to check if server is ready
fn wait_for_server(host: &str, port: u16, timeout_secs: u64, retry_interval_ms: u64) -> bool {
    let start = std::time::Instant::now();
    let timeout = Duration::from_secs(timeout_secs);
    
    while start.elapsed() < timeout {
        match TcpStream::connect(format!("{}:{}", host, port)) {
            Ok(_) => {
                println!("Server at {}:{} is ready!", host, port);
                return true;
            },
            Err(e) if e.kind() == ErrorKind::ConnectionRefused => {
                println!("Waiting for server to spawn ({}:{}) ...", host, port);
            },
            Err(e) => {
                println!("Error connecting to server: {}", e);
            }
        }
        thread::sleep(Duration::from_millis(retry_interval_ms));
    }
    
    println!("Timed out waiting for server at {}:{}", host, port);
    false
}

fn main() {
    // Platform-specific environment variables
    #[cfg(target_os = "linux")]
    {
        env::set_var("WEBKIT_DISABLE_DMABUF_RENDERER", "1");
        
        if env::var("WAYLAND_DISPLAY").is_ok() {
            env::set_var("MOZ_ENABLE_WAYLAND", "1"); 
        }
        
        env::set_var("MESA_GL_VERSION_OVERRIDE", "4.5");
        env::set_var("MOZ_GMP_PATH", "/usr/lib/mozilla/plugins");
    }
    
    // Common environment variables for all platforms
    env::set_var("RUST_BACKTRACE", "1");
    env::set_var("RUST_LOG", "full");

    tauri::Builder::default()
        .setup(|app| {
            // Get the resource directory based on the platform
            let resource_dir = app.path_resolver().resource_dir()
                .expect("Failed to get resource directory");
            
            // Determine Node path and working directory
            let (node_path, work_dir) = {
                #[cfg(target_os = "linux")]
                {
                    // Check if we're running from the packaged app or in development
                    let packaged_node = resource_dir.join("node").join("bin").join("node");
                    if packaged_node.exists() {
                        // Use packaged node in the resource directory
                        (packaged_node, resource_dir.join("app"))
                    } else {
                        // Fallback to original Linux paths for development
                        (PathBuf::from("/usr/lib/mrdoom/_up_/dist/bin/node"), 
                         PathBuf::from("/usr/lib/mrdoom/_up_/dist"))
                    }
                }
                
                #[cfg(target_os = "windows")]
                {
                    // For Windows, use node.exe from the resource directory
                    (resource_dir.join("node").join("node.exe"), 
                     resource_dir.join("app"))
                }
                
                #[cfg(target_os = "macos")]
                {
                    // For macOS, use node from the resource directory
                    (resource_dir.join("node").join("bin").join("node"), 
                     resource_dir.join("app"))
                }
            };
            
            println!("Using Node path: {:?}", node_path);
            println!("Using working directory: {:?}", work_dir);
            
            if !node_path.exists() {
                panic!("Node binary not found at: {:?}", node_path);
            }
            
            Command::new(&node_path)
                .arg("index.cjs")
                .current_dir(&work_dir)
                .env("NODE_ENV", "production")
                .env("NPM_PREFIX", work_dir.join("node_modules"))
                .spawn()
                .expect("Failed to start Node.js server");
                
            println!("Waiting for Node.js server to be ready...");
            // Wait for the server to be ready at localhost:5000
            // Try for up to 30 seconds, checking every 200ms
            if !wait_for_server("localhost", 5000, 30, 200) {
                panic!("Timed out waiting for Node.js server to start");
            }
            println!("Node.js server is ready! Continuing with Tauri setup.");

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
