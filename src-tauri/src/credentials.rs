use keyring::Entry;

const SERVICE_NAME: &str = "uth_flow_app";

pub fn save_password(mssv: &str, pass: &str) -> Result<(), String> {
    let entry = Entry::new(SERVICE_NAME, mssv).map_err(|e| e.to_string())?;
    entry.set_password(pass).map_err(|e| e.to_string())
}

pub fn get_password(mssv: &str) -> Result<String, String> {
    let entry = Entry::new(SERVICE_NAME, mssv).map_err(|e| e.to_string())?;
    entry.get_password().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_saved_password(mssv: String) -> Result<String, String> {
    get_password(&mssv)
}
