use wreq_util::Emulation;

pub const BASE_URL: &str = "https://portal.ut.edu.vn/api/v1";

pub fn get_client() -> wreq::Client {
    wreq::Client::builder()
        .emulation(Emulation::Chrome120)
        .cookie_store(true)
        .build()
        .unwrap()
}
