pub mod auth;
pub mod db;

pub use auth::login;
pub use db::{connect_db,get_banques, get_specialites, 
    add_specialite,get_residents/*,delete_specialty,modify_specialty, 
    ,add_resident, delete_resident, modify_resident,get_payments,generate_payments,get_rappels*/};
