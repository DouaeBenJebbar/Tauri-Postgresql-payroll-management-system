pub mod auth;
pub mod db;

pub use auth::login;
pub use db::{connect_db, get_specialties, add_specialty,delete_specialty,modify_specialty, get_residents,add_resident, delete_resident, modify_resident};
