use sqlx::sqlite::SqlitePool;

pub async fn init_db(pool: &SqlitePool) -> Result<(), sqlx::Error> {
    sqlx::query(
        "
        CREATE TABLE IF NOT EXISTS accounts (
            mssv TEXT PRIMARY KEY,
            full_name TEXT NOT NULL,
            is_logged_in BOOLEAN NOT NULL DEFAULT 0,
            updated_at DATETIME DeFAULT CURRENT_TIMESTAMP
            
        );

        CREATE TABLE IF NOT EXISTS profiles (
            mssv TEXT PRIMARY KEY,
            ho_dem TEXT,
            ten TEXT,
            avatar BLOB,
            email TEXT,
            so_dien_thoai TEXT,
            ngay_sinh TEXT,
            noi_sinh TEXT,
            gioi_tinh BOOLEAN,
            khoa TEXT,
            khoa_hoc TEXT,
            nganh TEXT,
            chuyen_nganh TEXT,
            he_dao_tao TEXT,
            loai_hinh_dt TEXT,
            FOREIGN KEY (mssv) REFERENCES accounts(mssv) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS notes (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            date TEXT NOT NULL,
            start_time TEXT NOT NULL,
            end_time TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );",
    )
    .execute(pool)
    .await?;

    Ok(())
}
