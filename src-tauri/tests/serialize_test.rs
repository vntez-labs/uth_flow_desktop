use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
struct TestStruct {
    field: String,
}

fn assert_serialize<T: Serialize>() {}
fn assert_deserialize<'de, T: Deserialize<'de>>() {}

#[test]
fn test_traits() {
    assert_serialize::<TestStruct>();
    assert_deserialize::<TestStruct>();
}
