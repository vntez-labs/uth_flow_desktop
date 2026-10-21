#[tokio::main]
async fn main() {
    let username = "074207005137".to_string();
    let entry = keyring::Entry::new("uth_flow_app", &username).unwrap();
    let password = entry.get_password().unwrap();
    println!("Password found: len {}", password.len());

    let client = wreq::Client::builder()
        .emulation(wreq_util::Emulation::Chrome120)
        .cookie_store(true)
        .build()
        .unwrap();

    let login_url = "https://courses.ut.edu.vn/login/index.php";
    let login_page_res = client
        .get(login_url)
        .header(
            "Accept",
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        )
        .send()
        .await
        .unwrap();

    let login_html = login_page_res.text().await.unwrap_or_default();
    let logintoken = login_html
        .split("name=\"logintoken\"")
        .nth(1)
        .and_then(|s| s.split("value=\"").nth(1))
        .and_then(|s| s.split('"').next())
        .expect("logintoken not found");

    println!("Logintoken: {}", logintoken);

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
        .unwrap();

    let login_status = login_submit_res.status().as_u16();
    let final_url = login_submit_res.url().to_string();
    println!("Login status: {}, final URL: {}", login_status, final_url);

    let course_page_res = client
        .get("https://courses.ut.edu.vn/my/courses.php")
        .header(
            "Accept",
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        )
        .send()
        .await
        .unwrap();

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
        });

    println!("Sesskey: {:?}", sesskey);
}
