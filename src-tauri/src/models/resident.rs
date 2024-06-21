
use serde::{Serialize, Deserialize};


#[derive(Debug, Serialize, Deserialize)]
pub struct Resident {
    pub id_resident: i32,
    pub nom_prenom: String,
    pub date_debut: chrono::NaiveDate,
    pub id_specialite: Option<i32>,
    pub date_fin: Option<chrono::NaiveDate>,
    pub rib: String,
    pub id_banque: Option<i32>,
    pub nombre_enfants: i32,
    pub nom_specialite: Option<String>,
    pub nom_banque: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct NewResident {
    pub nom_prenom: String,
    pub date_debut: chrono::NaiveDate,
    pub id_specialite: Option<i32>,
    pub rib: String,
    pub id_banque: Option<i32>,
    pub nombre_enfants: Option<i32>,
}
