pub mod auth;
pub mod db;

pub use auth::login;
pub use db::{
    connect_db,
    get_banques, 
    get_specialites, 
    add_specialite,
    get_residents,
    delete_specialite,
    modify_specialite, 
    add_resident,
    delete_resident,
    modify_resident,
    get_paiments,
    generate_payments,
    get_rappels,
    generate_rappel,
    get_resident_id
};
