use crate::credentials::{get_password, save_password};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, sqlx::FromRow)]
pub struct UserAccount {
    mssv: String,
    full_name: String,
    is_logged_in: bool,
    updated_at: String,
}

#[tauri::command]
pub async fn add_account(
    mssv: String,
    full_name: String,
    password: String,
    db: tauri::State<'_, sqlx::sqlite::SqlitePool>,
) -> Result<(), String> {
    save_password(&mssv, &password).map_err(|e| e.to_string())?;

    sqlx::query("INSERT OR REPLACE INTO accounts (mssv, full_name) VALUES (?, ?)")
        .bind(&mssv)
        .bind(&full_name)
        .execute(&*db)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn get_accounts(
    db: tauri::State<'_, sqlx::sqlite::SqlitePool>,
) -> Result<Vec<UserAccount>, String> {
    let users = sqlx::query_as::<_, UserAccount>("SELECT * FROM accounts ORDER BY updated_at DESC")
        .fetch_all(&*db)
        .await
        .map_err(|e| e.to_string())?;

    Ok(users)
}

#[tauri::command]
#[allow(dead_code)]
pub async fn remove_account(
    mssv: String,
    db: tauri::State<'_, sqlx::sqlite::SqlitePool>,
) -> Result<(), String> {
    sqlx::query("DELETE FROM accounts WHERE mssv = ?")
        .bind(mssv)
        .execute(&*db)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn logout_account(
    mssv: String,
    db: tauri::State<'_, sqlx::sqlite::SqlitePool>,
) -> Result<(), String> {
    sqlx::query("UPDATE accounts SET is_logged_in = 0 WHERE mssv = ?")
        .bind(mssv)
        .execute(&*db)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[allow(dead_code)]
pub async fn update_account(
    mssv: String,
    full_name: String,
    db: tauri::State<'_, sqlx::sqlite::SqlitePool>,
) -> Result<(), String> {
    sqlx::query("UPDATE accounts SET full_name = ? WHERE mssv = ?")
        .bind(full_name)
        .bind(mssv)
        .execute(&*db)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

async fn get_account_by_mssv(
    mssv: &str,
    db: &tauri::State<'_, sqlx::sqlite::SqlitePool>,
) -> Result<Option<UserAccount>, String> {
    let user = sqlx::query_as::<_, UserAccount>("SELECT * FROM accounts WHERE mssv = ?")
        .bind(mssv)
        .fetch_optional(&**db)
        .await
        .map_err(|e| e.to_string())?;

    Ok(user)
}

#[tauri::command]
pub async fn login_account(
    username: String,
    password: String,
    db: tauri::State<'_, sqlx::sqlite::SqlitePool>,
) -> Result<(), String> {
    let mut tx = db.begin().await.map_err(|e| e.to_string())?;

    let user = get_account_by_mssv(&username, &db).await?;

    if let Some(user) = user {
        let stored_password = get_password(&user.mssv)?;

        if stored_password != password {
            return Err("Invalid password".to_string());
        }

        sqlx::query("UPDATE accounts SET is_logged_in = 1 WHERE mssv = ?")
            .bind(&username)
            .execute(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;
        tx.commit().await.map_err(|e| e.to_string())?;

        return Ok(());
    }

    Err("Invalid username or password".to_string())
}
