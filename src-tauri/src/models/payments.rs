
use bigdecimal::BigDecimal;
use chrono::NaiveDate;
use serde::{Serialize, Deserialize};// Import the SqlxBigDecimal alias
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Payment {
    pub id_payment: i32,
    pub id_resident: i32,
    pub worked_days: Option<i32>,
    pub allocations_fam: Option<BigDecimal>,
    pub amount: Option<BigDecimal>,
    pub date_payment: Option<NaiveDate>,
    pub resident_name: Option<String>,
}

#[derive(Debug, Serialize, Deserialize,FromRow)]
pub struct RappelAnnuel{
    pub id_rappel: i32,
    pub id_resident: Option<i32>,
    pub exercice: Option<i32>,
    pub nombre_jours: Option<i32>,
    pub montant: Option<BigDecimal>,
    pub resident_name: Option<String>,
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