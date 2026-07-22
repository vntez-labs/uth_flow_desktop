#[tauri::command]
pub fn save_base64_image(
    base64_data: String,
    app_handle: tauri::AppHandle,
) -> Result<String, String> {
    use base64::prelude::*;
    use std::io::Write;
    use tauri::Manager;
    let data = base64_data.replace("data:image/png;base64,", "");
    let bytes = BASE64_STANDARD.decode(&data).map_err(|e| e.to_string())?;

    // Default fallback if we can't get download_dir
    let mut path = app_handle
        .path()
        .download_dir()
        .unwrap_or_else(|_| std::path::PathBuf::from("."));
    path.push("ThoiKhoaBieu_Tuan.png");

    let mut file = std::fs::File::create(&path).map_err(|e| e.to_string())?;
    file.write_all(&bytes).map_err(|e| e.to_string())?;

    Ok(path.to_string_lossy().to_string())
}
