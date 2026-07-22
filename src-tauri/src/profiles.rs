use crate::constants::{get_client, BASE_URL};
use base64::{engine::general_purpose, Engine as _};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Deserialize, Serialize)]
pub struct Profile {
    mssv: String,
    ho_dem: Option<String>,
    ten: Option<String>,
    avatar: Option<String>,
    email: Option<String>,
    so_dien_thoai: Option<String>,
    ngay_sinh: Option<String>,
    noi_sinh: Option<String>,
    gioi_tinh: Option<bool>,
    khoa: Option<String>,
    khoa_hoc: Option<String>,
    nganh: Option<String>,
    chuyen_nganh: Option<String>,
    he_dao_tao: Option<String>,
    loai_hinh_dt: Option<String>,
}

#[derive(FromRow)]
struct ProfileRow {
    mssv: String,
    ho_dem: Option<String>,
    ten: Option<String>,
    avatar: Option<Vec<u8>>,
    email: Option<String>,
    so_dien_thoai: Option<String>,
    ngay_sinh: Option<String>,
    noi_sinh: Option<String>,
    gioi_tinh: Option<bool>,
    khoa: Option<String>,
    khoa_hoc: Option<String>,
    nganh: Option<String>,
    chuyen_nganh: Option<String>,
    he_dao_tao: Option<String>,
    loai_hinh_dt: Option<String>,
}

impl From<ProfileRow> for Profile {
    fn from(row: ProfileRow) -> Self {
        let avatar = row.avatar.map(|bytes| {
            let b64 = general_purpose::STANDARD.encode(&bytes);
            format!("data:image/jpeg;base64,{}", b64)
        });

        Self {
            mssv: row.mssv,
            ho_dem: row.ho_dem,
            ten: row.ten,
            avatar,
            email: row.email,
            so_dien_thoai: row.so_dien_thoai,
            ngay_sinh: row.ngay_sinh,
            noi_sinh: row.noi_sinh,
            gioi_tinh: row.gioi_tinh,
            khoa: row.khoa,
            khoa_hoc: row.khoa_hoc,
            nganh: row.nganh,
            chuyen_nganh: row.chuyen_nganh,
            he_dao_tao: row.he_dao_tao,
            loai_hinh_dt: row.loai_hinh_dt,
        }
    }
}

#[tauri::command]
pub async fn create_profile(
    profile: Profile,
    token: String,
    db: tauri::State<'_, sqlx::sqlite::SqlitePool>,
) -> Result<(), String> {
    let client = get_client();
    let avatar_bytes = client
        .get(format!("{}/user/imageBinary", BASE_URL))
        .header("Authorization", format!("Bearer {}", token))
        .send()
        .await
        .map_err(|e| format!("Lỗi lấy avatar: {}", e))?
        .bytes()
        .await
        .map_err(|e| format!("Lỗi đọc bytes avatar: {}", e))?;

    let avatar_vec = avatar_bytes.to_vec();

    sqlx::query(
        "INSERT INTO profiles (mssv, ho_dem, ten, avatar, email, so_dien_thoai, ngay_sinh, noi_sinh, gioi_tinh, khoa, khoa_hoc, nganh, chuyen_nganh, he_dao_tao, loai_hinh_dt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(profile.mssv)
    .bind(profile.ho_dem)
    .bind(profile.ten)
    .bind(if avatar_vec.is_empty() { None } else { Some(avatar_vec) })
    .bind(profile.email)
    .bind(profile.so_dien_thoai)
    .bind(profile.ngay_sinh)
    .bind(profile.noi_sinh)
    .bind(profile.gioi_tinh)
    .bind(profile.khoa)
    .bind(profile.khoa_hoc)
    .bind(profile.nganh)
    .bind(profile.chuyen_nganh)
    .bind(profile.he_dao_tao)
    .bind(profile.loai_hinh_dt)
    .execute(&*db)
    .await
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn get_profile_by_mssv(
    mssv: String,
    db: tauri::State<'_, sqlx::sqlite::SqlitePool>,
) -> Result<Option<Profile>, String> {
    let row = sqlx::query_as::<_, ProfileRow>("SELECT * FROM profiles WHERE mssv = ?")
        .bind(&mssv)
        .fetch_optional(&*db)
        .await
        .map_err(|e| e.to_string())?;

    Ok(row.map(|r| r.into()))
}
