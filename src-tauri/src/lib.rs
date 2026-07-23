mod accounts;
mod auth;
mod constants;
mod credentials;
mod database;
mod notes;
mod profiles;
mod utils;

use crate::accounts::{add_account, get_accounts, login_account, logout_account, remove_account};
use crate::auth::{
    fetch_portal_get, get_lich_ngay, get_lich_thang, get_lich_tuan, get_main_menu,
    get_moodle_events, get_moodle_course_contents, resolve_moodle_link, download_moodle_file, create_auto_login_webview, get_side_menu, get_summary_profile, login,
};
use crate::credentials::get_saved_password;
use crate::database::init_db;
use crate::notes::{add_note, delete_note, get_notes};
use crate::profiles::{create_profile, get_profile_by_mssv};
use crate::utils::save_base64_image;
use sqlx::sqlite::{SqliteConnectOptions, SqlitePoolOptions};
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() -> Result<(), Box<dyn std::error::Error>> {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .setup(|app| {
            let app_data_dir = app
                .path()
                .app_data_dir()
                .expect("Không thể lấy app_data_dir");
            std::fs::create_dir_all(&app_data_dir).expect("Không thể tạo thư mục");
            let db_path = app_data_dir.join("uth_flow.db");

            let options = SqliteConnectOptions::new()
                .filename(&db_path)
                .create_if_missing(true);

            let pool = tauri::async_runtime::block_on(async {
                let pool = SqlitePoolOptions::new()
                    .connect_with(options)
                    .await
                    .expect("Không thể kết nối DB");

                init_db(&pool)
                    .await
                    .expect("Không thể khởi tạo tables trong DB");

                pool
            });

            app.manage(pool);

            println!("✅ Database đã sẵn sàng tại: {:?}", db_path);
            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            login,
            get_summary_profile,
            add_account,
            get_accounts,
            create_profile,
            get_profile_by_mssv,
            login_account,
            logout_account,
            remove_account,
            get_saved_password,
            get_side_menu,
            get_main_menu,
            get_lich_thang,
            get_lich_tuan,
            get_lich_ngay,
            get_moodle_events,
            get_moodle_course_contents,
            fetch_portal_get,
            resolve_moodle_link,
            download_moodle_file,
            create_auto_login_webview,
            add_note,
            get_notes,
            delete_note,
            save_base64_image,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");

    Ok(())
}
