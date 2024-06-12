
use bigdecimal::BigDecimal;
use chrono::NaiveDate;
use serde::{Serialize, Deserialize};// Import the SqlxBigDecimal alias
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct PaiementMensuel {
    pub id_paiement: i32,
    pub id_resident: i32,
    pub jours_travail: i32,
    pub allocations_familiales: Option<BigDecimal>,
    pub montant: BigDecimal,
    pub date_paiement: NaiveDate,
    pub nom_resident: Option<String>,
    pub rib: Option<i32>,
    pub nom_banque: Option<String>,
}

#[derive(Debug, Serialize, Deserialize,FromRow)]
pub struct RappelAnnuel{
    pub id_rappel: i32,
    pub id_resident: i32,
    pub exercice: i32,
    pub duree_rappel: i32,
    pub montant: BigDecimal,
}


/*
#[derive(Insertable, Serialize, Deserialize)]
pub struct NewPayment {
    pub id_resident: i32,
    pub date_from: chrono::NaiveDate,
    pub date_to: chrono::NaiveDate,
    pub amount: f64,
    pub allocations_fam: f64,
    pub worked_days: i32,
}*/