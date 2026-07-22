use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use tauri::State;

#[derive(Serialize, Deserialize, FromRow)]
pub struct Note {
    pub id: String,
    pub name: String,
    pub date: String,
    pub start_time: String,
    pub end_time: String,
}

#[tauri::command]
pub async fn add_note(
    id: String,
    name: String,
    date: String,
    start_time: String,
    end_time: String,
    db: State<'_, sqlx::sqlite::SqlitePool>,
) -> Result<(), String> {
    sqlx::query("INSERT INTO notes (id, name, date, start_time, end_time) VALUES (?, ?, ?, ?, ?)")
        .bind(id)
        .bind(name)
        .bind(date)
        .bind(start_time)
        .bind(end_time)
        .execute(&*db)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn get_notes(db: State<'_, sqlx::sqlite::SqlitePool>) -> Result<Vec<Note>, String> {
    let notes = sqlx::query_as::<_, Note>(
        "SELECT id, name, date, start_time, end_time FROM notes ORDER BY created_at DESC",
    )
    .fetch_all(&*db)
    .await
    .map_err(|e| e.to_string())?;

    Ok(notes)
}

#[tauri::command]
pub async fn delete_note(
    id: String,
    db: State<'_, sqlx::sqlite::SqlitePool>,
) -> Result<(), String> {
    sqlx::query("DELETE FROM notes WHERE id = ?")
        .bind(id)
        .execute(&*db)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}
