use crate::constants::{get_client, BASE_URL};

#[tauri::command]
pub async fn login(username: String, password: String) -> Result<serde_json::Value, String> {
    let client = get_client();
    let res = client
        .post(format!("{}/user/login", BASE_URL))
        .header("Accept", "application/json")
        .json(&serde_json::json!({"username": username, "password": password}))
        .send()
        .await
        .map_err(|e| format!("Lỗi gửi request: {}", e))?;

    let json_data = res
        .json::<serde_json::Value>()
        .await
        .map_err(|e| format!("Lỗi parse JSON: {}", e))?;

    Ok(json_data)
}

#[tauri::command]
pub async fn fetch_portal_get(
    token: String,
    endpoint: String,
) -> Result<serde_json::Value, String> {
    let client = get_client();
    let res = client
        .get(format!("{}/{}", BASE_URL, endpoint))
        .header("Accept", "application/json")
        .header("Authorization", format!("Bearer {}", token))
        .send()
        .await
        .map_err(|e| format!("Lỗi gửi request: {}", e))?;

    let json_data = res
        .json::<serde_json::Value>()
        .await
        .map_err(|e| format!("Lỗi đọc response: {}", e))?;

    Ok(json_data)
}

#[tauri::command]
pub async fn get_summary_profile(token: String) -> Result<serde_json::Value, String> {
    let client = get_client();
    let res = client
        .get(format!("{}/user/getSummaryProfile", BASE_URL))
        .header("Accept", "application/json")
        .header("Authorization", format!("Bearer {}", token))
        .send()
        .await
        .map_err(|e| format!("Lỗi gửi request: {}", e))?;

    let json_data = res
        .json::<serde_json::Value>()
        .await
        .map_err(|e| format!("Lỗi đọc response: {}", e))?;

    Ok(json_data)
}

#[tauri::command]
pub async fn get_side_menu(token: String) -> Result<serde_json::Value, String> {
    let client = get_client();
    let res = client
        .get(format!("{}/menu/sideMenu", BASE_URL))
        .header("Accept", "application/json")
        .header("Authorization", format!("Bearer {}", token))
        .send()
        .await
        .map_err(|e| format!("Lỗi gửi request: {}", e))?;

    let json_data = res
        .json::<serde_json::Value>()
        .await
        .map_err(|e| format!("Lỗi đọc response: {}", e))?;

    Ok(json_data)
}

#[tauri::command]
pub async fn get_main_menu(token: String) -> Result<serde_json::Value, String> {
    let client = get_client();
    let res = client
        .get(format!("{}/menu/mainMenu", BASE_URL))
        .header("Accept", "application/json")
        .header("Authorization", format!("Bearer {}", token))
        .send()
        .await
        .map_err(|e| format!("Lỗi gửi request: {}", e))?;

    let json_data = res
        .json::<serde_json::Value>()
        .await
        .map_err(|e| format!("Lỗi đọc response: {}", e))?;

    Ok(json_data)
}

#[tauri::command]
pub async fn get_lich_thang(token: String, date: String) -> Result<serde_json::Value, String> {
    let client = get_client();
    let res = client
        .get(format!("{}/lichhoc/thang?date={}", BASE_URL, date))
        .header("Accept", "application/json")
        .header("Authorization", format!("Bearer {}", token))
        .send()
        .await
        .map_err(|e| format!("Lỗi gửi request: {}", e))?;

    let json_data = res
        .json::<serde_json::Value>()
        .await
        .map_err(|e| format!("Lỗi đọc response: {}", e))?;

    Ok(json_data)
}

#[tauri::command]
pub async fn get_lich_tuan(token: String, date: String) -> Result<serde_json::Value, String> {
    let client = get_client();
    let res = client
        .get(format!("{}/lichhoc/tuan?date={}", BASE_URL, date))
        .header("Accept", "application/json")
        .header("Authorization", format!("Bearer {}", token))
        .send()
        .await
        .map_err(|e| format!("Lỗi gửi request: {}", e))?;

    let json_data = res
        .json::<serde_json::Value>()
        .await
        .map_err(|e| format!("Lỗi đọc response: {}", e))?;

    Ok(json_data)
}

#[tauri::command]
pub async fn get_lich_ngay(token: String, date: String) -> Result<serde_json::Value, String> {
    let client = get_client();
    let res = client
        .get(format!("{}/lichhoc/lichNgay?date={}", BASE_URL, date))
        .header("Accept", "application/json")
        .header("Authorization", format!("Bearer {}", token))
        .send()
        .await
        .map_err(|e| format!("Lỗi gửi request: {}", e))?;

    let json_data = res
        .json::<serde_json::Value>()
        .await
        .map_err(|e| format!("Lỗi đọc response: {}", e))?;

    Ok(json_data)
}

#[tauri::command]
pub async fn get_moodle_events(username: String) -> Result<serde_json::Value, String> {
    let password = crate::credentials::get_saved_password(username.clone())?;

    let client = get_client();

    // 1. Get Moodle login page to extract logintoken
    let login_url = "https://courses.ut.edu.vn/login/index.php";
    let login_page_res = client
        .get(login_url)
        .header(
            "Accept",
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        )
        .send()
        .await
        .map_err(|e| format!("Lỗi tải trang login moodle: {}", e))?;

    let login_html = login_page_res.text().await.unwrap_or_default();

    // Extract logintoken without regex
    let logintoken = login_html
        .split("name=\"logintoken\"")
        .nth(1)
        .and_then(|s| s.split("value=\"").nth(1))
        .and_then(|s| s.split('"').next())
        .ok_or_else(|| {
            format!(
                "Không tìm thấy logintoken. Html snippet: {:.200}",
                login_html
            )
        })?;


    // 2. Submit login to Moodle
    let login_submit_res = client
        .post(login_url)
        .header("Content-Type", "application/x-www-form-urlencoded")
        .header("Origin", "https://courses.ut.edu.vn")
        .header("Referer", login_url)
        .header(
            "Accept",
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        )
        .form(&[
            ("anchor", ""),
            ("logintoken", logintoken),
            ("username", &username),
            ("password", &password),
        ])
        .send()
        .await
        .map_err(|e| format!("Lỗi submit login moodle: {}", e))?;

    let final_login_url = login_submit_res.url().to_string();
    let login_status = login_submit_res.status().as_u16();
    let final_login_text = login_submit_res.text().await.unwrap_or_default();


    // Moodle returns 303 on successful login. If it's a 303, we shouldn't fail even if the URL is still login/index.php
    // (because wreq doesn't follow redirects by default).
    if login_status != 303
        && (final_login_url.contains("/login/index.php")
            || final_login_text.contains("name=\"logintoken\""))
    {
        return Err(format!("Đăng nhập Moodle thất bại.\nStatus: {}\nURL: {}\nLogintoken used: {}\nSnippet: {:.500}", login_status, final_login_url, logintoken, final_login_text));
    }

    // 3. Get sesskey from courses.php
    let course_page_res = client
        .get("https://courses.ut.edu.vn/my/courses.php")
        .header(
            "Accept",
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        )
        .send()
        .await
        .map_err(|e| format!("Lỗi tải trang courses: {}", e))?;

    let course_status = course_page_res.status().as_u16();
    let course_url = course_page_res.url().to_string();
    let course_html = course_page_res.text().await.unwrap_or_default();


    let sesskey = course_html
        .split(r#""sesskey":""#)
        .nth(1)
        .and_then(|s| s.split('"').next())
        .or_else(|| {
            course_html
                .split("name=\"sesskey\"")
                .nth(1)
                .and_then(|s| s.split("value=\"").nth(1))
                .and_then(|s| s.split('"').next())
        })
        .ok_or_else(|| format!("Không tìm thấy sesskey.\nCourse URL: {}\nStatus: {}\nRes len: {}\nSnippet: {:.500}", course_url, course_status, course_html.len(), course_html))?;


    // 4. Fetch events using core_calendar_get_action_events_by_timesort
    let now = chrono::Local::now()
        .with_timezone(&chrono::Local)
        .format("%s")
        .to_string()
        .parse::<i64>()
        .unwrap_or(0);

    let start_ts = now - (365 * 24 * 60 * 60); // 365 days in the past
    let end_ts = now + (365 * 24 * 60 * 60); // 365 days window

    let payload = serde_json::json!([
        {
            "index": 0,
            "methodname": "core_calendar_get_action_events_by_timesort",
            "args": {
                "timesortfrom": start_ts,
                "timesortto": end_ts,
                "limitnum": 50
            }
        },
        {
            "index": 1,
            "methodname": "core_course_get_enrolled_courses_by_timeline_classification",
            "args": {
                "offset": 0,
                "limit": 100,
                "classification": "all",
                "sort": "ul.timeaccess desc",
                "customfieldname": "",
                "customfieldvalue": ""
            }
        }
    ]);

    let events_req = client.post(format!("https://courses.ut.edu.vn/lib/ajax/service.php?sesskey={}&info=core_calendar_get_action_events_by_timesort,core_course_get_enrolled_courses_by_timeline_classification", sesskey))
        .header("Accept", "application/json, text/plain, */*")
        .header("Content-Type", "application/json");

    let events_res = events_req
        .json(&payload)
        .send()
        .await
        .map_err(|e| format!("Lỗi tải lịch: {}", e))?;

    let events_json = events_res
        .json::<serde_json::Value>()
        .await
        .map_err(|e| format!("Lỗi parse events JSON: {}", e))?;

    Ok(events_json)
}

pub async fn get_moodle_authenticated_client(username: &str) -> Result<wreq::Client, String> {
    let password = crate::credentials::get_saved_password(username.to_string())?;

    let client = get_client();

    // 1. Get Moodle login page to extract logintoken
    let login_url = "https://courses.ut.edu.vn/login/index.php";
    let login_page_res = client
        .get(login_url)
        .header(
            "Accept",
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        )
        .send()
        .await
        .map_err(|e| format!("Lỗi tải trang login moodle: {}", e))?;

    let login_html = login_page_res.text().await.unwrap_or_default();

    // Nếu đã đăng nhập (không có form login)
    if !login_html.contains("name=\"logintoken\"") {
        return Ok(client);
    }

    // Extract logintoken without regex
    let logintoken = login_html
        .split("name=\"logintoken\"")
        .nth(1)
        .and_then(|s| s.split("value=\"").nth(1))
        .and_then(|s| s.split('"').next())
        .ok_or_else(|| {
            format!(
                "Không tìm thấy logintoken. Html snippet: {:.200}",
                login_html
            )
        })?;

    // 2. Submit login to Moodle
    let login_submit_res = client
        .post(login_url)
        .header("Content-Type", "application/x-www-form-urlencoded")
        .header("Origin", "https://courses.ut.edu.vn")
        .header("Referer", login_url)
        .header(
            "Accept",
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        )
        .form(&[
            ("anchor", ""),
            ("logintoken", logintoken),
            ("username", username),
            ("password", &password),
        ])
        .send()
        .await
        .map_err(|e| format!("Lỗi submit login moodle: {}", e))?;

    let final_login_url = login_submit_res.url().to_string();
    let login_status = login_submit_res.status().as_u16();
    let final_login_text = login_submit_res.text().await.unwrap_or_default();

    if login_status != 303
        && (final_login_url.contains("/login/index.php")
            || final_login_text.contains("name=\"logintoken\""))
    {
        return Err(format!("Đăng nhập Moodle thất bại."));
    }

    Ok(client)
}

#[tauri::command]
pub async fn get_moodle_course_contents(username: String, course_id: i64) -> Result<serde_json::Value, String> {
    let client = get_moodle_authenticated_client(&username).await?;

    // 3. Get sesskey from courses.php
    let course_page_res = client
        .get("https://courses.ut.edu.vn/my/courses.php")
        .header(
            "Accept",
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        )
        .send()
        .await
        .map_err(|e| format!("Lỗi tải trang courses: {}", e))?;

    let course_html = course_page_res.text().await.unwrap_or_default();

    let sesskey = course_html
        .split(r#""sesskey":""#)
        .nth(1)
        .and_then(|s| s.split('"').next())
        .or_else(|| {
            course_html
                .split("name=\"sesskey\"")
                .nth(1)
                .and_then(|s| s.split("value=\"").nth(1))
                .and_then(|s| s.split('"').next())
        })
        .ok_or_else(|| format!("Không tìm thấy sesskey."))?;

    // 4. Fetch course contents using core_courseformat_get_state
    let payload = serde_json::json!([
        {
            "index": 0,
            "methodname": "core_courseformat_get_state",
            "args": {
                "courseid": course_id
            }
        }
    ]);

    let req = client.post(format!("https://courses.ut.edu.vn/lib/ajax/service.php?sesskey={}&info=core_courseformat_get_state", sesskey))
        .header("Accept", "application/json, text/plain, */*")
        .header("Content-Type", "application/json");

    let res = req
        .json(&payload)
        .send()
        .await
        .map_err(|e| format!("Lỗi tải nội dung môn học: {}", e))?;

    let json = res
        .json::<serde_json::Value>()
        .await
        .map_err(|e| format!("Lỗi parse course JSON: {}", e))?;

    Ok(json)
}

#[tauri::command]
pub async fn resolve_moodle_link(username: String, url: String) -> Result<String, String> {
    let client = get_moodle_authenticated_client(&username).await?;
    
    let res = client.get(&url).send().await.map_err(|e| e.to_string())?;
    let final_url = res.url().to_string();

    if final_url != url && !final_url.contains("courses.ut.edu.vn/mod/") && !final_url.contains("/login/index.php") {
        // Nếu tự động redirect ra ngoài (VD: link url google drive rút gọn)
        return Ok(final_url);
    }

    let html = res.text().await.map_err(|e| e.to_string())?;
    
    // Nếu là Google Meet
    if url.contains("mod/googlemeet") {
        if let Some(start) = html.find("https://meet.google.com/") {
            let end = html[start..].find('"').unwrap_or(0);
            if end > 0 {
                return Ok(html[start..start+end].to_string());
            }
        }
    }
    
    // Nếu là mod_url (Link bên ngoài)
    if url.contains("mod/url") {
        if let Some(start) = html.find("<div class=\"urlworkaround\">") {
            if let Some(href_start) = html[start..].find("href=\"") {
                let actual_start = start + href_start + 6;
                let end = html[actual_start..].find('"').unwrap_or(0);
                if end > 0 {
                    return Ok(html[actual_start..actual_start+end].to_string());
                }
            }
        }
    }

    // Nếu là PDF / File (mod_resource) -> Tìm link pluginfile.php
    // Moodle thường để file download ở link: https://courses.ut.edu.vn/pluginfile.php/xxx
    if url.contains("mod/resource") || url.contains("mod/folder") {
        let pattern = "https://courses.ut.edu.vn/pluginfile.php/";
        if let Some(start) = html.find(pattern) {
            let end = html[start..].find('"').unwrap_or(0);
            if end > 0 {
                let file_url = html[start..start+end].to_string();
                return Ok(file_url.replace("&amp;", "&"));
            }
        }
    }

    // Fallback: trả về link gốc
    Ok(url)
}

#[tauri::command]
pub async fn download_moodle_file(username: String, url: String) -> Result<String, String> {
    let client = get_moodle_authenticated_client(&username).await?;
    let res = client.get(&url).send().await.map_err(|e| e.to_string())?;
    
    let bytes = res.bytes().await.map_err(|e| e.to_string())?;
    
    // Parse filename từ url
    let filename = url.split('/').last().unwrap_or("document.pdf");
    let filename = filename.split('?').next().unwrap_or("document.pdf");
    // Decode đơn giản phần trăm (tạm thời thay %20 bằng space)
    let filename = filename.replace("%20", " ").replace("%28", "(").replace("%29", ")").replace("%2B", "+");

    let temp_dir = std::env::temp_dir();
    let file_path = temp_dir.join(&filename);
    
    std::fs::write(&file_path, bytes).map_err(|e| e.to_string())?;
    
    Ok(file_path.to_string_lossy().to_string())
}

#[tauri::command]
pub fn create_auto_login_webview(
    app: tauri::AppHandle,
    url: String,
    username: String,
    title: String,
) -> Result<(), String> {
    let password = crate::credentials::get_saved_password(username.clone()).unwrap_or_default();
    
    let script = format!(
        r#"
        document.addEventListener('DOMContentLoaded', () => {{
            if (window.location.href.includes('login/index.php')) {{
                const userInput = document.querySelector('input[name="username"]');
                const passInput = document.querySelector('input[name="password"]');
                const submitBtn = document.querySelector('button[type="submit"], input[type="submit"], button#loginbtn');
                
                if (userInput && passInput && submitBtn) {{
                    userInput.value = "{user}";
                    passInput.value = "{pass}";
                    
                    userInput.dispatchEvent(new Event('input', {{ bubbles: true }}));
                    passInput.dispatchEvent(new Event('input', {{ bubbles: true }}));
                    
                    setTimeout(() => {{
                        submitBtn.click();
                    }}, 500);
                }}
            }}
        }});
        "#,
        user = username,
        pass = password
    );

    let window_label = format!(
        "moodle-viewer-{}",
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_millis()
    );

    tauri::WebviewWindowBuilder::new(
        &app,
        window_label,
        tauri::WebviewUrl::External(tauri::Url::parse(&url).map_err(|e| e.to_string())?),
    )
    .title(title)
    .inner_size(1000.0, 700.0)
    .center()
    .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
    .initialization_script(&script)
    .build()
    .map_err(|e| e.to_string())?;

    Ok(())
}
