use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize)]
pub struct DbConfig {
    pub host: String,
    pub user: String,
    pub password: String,
    pub database: String,
    pub port: u16,
}

