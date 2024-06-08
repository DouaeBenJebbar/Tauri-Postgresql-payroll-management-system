use sqlx::FromRow;
use serde::{Serialize, Deserialize};
use chrono::NaiveDate;

#[derive(Debug, Serialize, Deserialize, FromRow)]

pub struct Payment {
    pub id_payment: i32,
    pub id_resident: i32,
    pub date_from: chrono::NaiveDate,
    pub date_to: chrono::NaiveDate,
    pub amount: f64,
    pub allocations_fam: f64,
    pub worked_days: i32,
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