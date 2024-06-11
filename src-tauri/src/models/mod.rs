pub mod db_config;
pub mod login_payload;
pub mod specialty;
pub mod resident;
pub mod payments;

pub use db_config::DbConfig;
pub use login_payload::LoginPayload;
pub use specialty::Specialite;
pub use resident::Resident;
pub use specialty:: NewSpecialite;
pub use resident:: NewResident;
pub use specialty::Banque;
pub use payments::PaiementMensuel;
pub use payments::RappelAnnuel;

use serde::Serialize;
use tokio::sync::Mutex;

#[derive(Debug, Serialize)]
pub struct MyError {
    pub message: String,
}

impl From<sqlx::Error> for MyError {
    fn from(err: sqlx::Error) -> Self {
        Self {
            message: format!("{}", err),
        }
    }
}

pub struct AppState {
    pub pool: Mutex<Option<sqlx::PgPool>>,
}