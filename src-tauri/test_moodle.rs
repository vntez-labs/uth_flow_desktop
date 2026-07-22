#[tokio::main]
async fn main() {
    let client = wreq::Client::builder()
        .emulation(wreq_util::Emulation::Chrome120)
        .cookie_store(true)
        .build()
        .unwrap();
    let login_url = "https://courses.ut.edu.vn/login/index.php";
    let res = client.get(login_url).send().await.unwrap();
    let html = res.text().await.unwrap();
    println!("{}", html);
}
