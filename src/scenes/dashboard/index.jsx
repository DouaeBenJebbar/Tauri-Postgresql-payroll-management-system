import React, { useEffect, useState } from "react";
import { Box, Typography, useTheme } from "@mui/material";
import Header from "../../components/Header";
import GroupsIcon from '@mui/icons-material/Groups';
import PaidIcon from '@mui/icons-material/Paid';
import StatBox from "../../components/StatBox";
import { tokens } from "../../theme";
import { invoke } from "@tauri-apps/api/tauri";
import dayjs from 'dayjs';
import 'dayjs/locale/fr'; // Import the French locale

const Dashboard = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const [residentsCount, setResidentsCount] = useState(0);
  const [monthlyPaymentsTotal, setMonthlyPaymentsTotal] = useState(0);
  const [monthlyRappelsTotal, setMonthlyRappelsTotal] = useState(0);

  useEffect(() => {
    const fetchResidents = async () => {
      try {
        const data = await invoke("get_residents");
        setResidentsCount(data.length);
      } catch (error) {
        console.error("Failed to fetch residents", error);
      }
    };

    const fetchPayments = async () => {
      try {
        const paymentsData = await invoke("get_paiments");
        console.log("Payments data:", paymentsData);

        const currentMonth = dayjs().month();
        const currentYear = dayjs().year();

        let totalPayments = 0;

        paymentsData.forEach(payment => {
          if (!payment.date_paiement || !payment.montant) {
            console.warn("Missing date or amount in payment:", payment);
            return;
          }

          const paymentDate = dayjs(payment.date_paiement);
          const amount = parseFloat(payment.montant);

          if (paymentDate.month() === currentMonth && paymentDate.year() === currentYear) {
            if (!isNaN(amount)) {
              totalPayments += amount;
            } else {
              console.warn("Invalid payment amount:", payment.montant);
            }
          }
        });

        console.log("Total payments for the current month:", totalPayments);
        setMonthlyPaymentsTotal(totalPayments);
      } catch (error) {
        console.error("Failed to fetch payments", error);
      }
    };

    const fetchRappels = async () => {
      try {
        const rappelsData = await invoke("get_rappels");
        console.log("Rappels data:", rappelsData);
    
        const currentMonth = dayjs().month();
        const currentYear = dayjs().year();
    
        let totalRappels = 0;
    
        rappelsData.forEach(rappel => {
          if (!rappel.date_generation || !rappel.montant) {
            console.warn("Missing date or amount in rappel:", rappel);
            return;
          }
    
          const rappelDate = dayjs(rappel.date_generation);
          const amount = parseFloat(rappel.montant);
    
          if (rappelDate.month() === currentMonth && rappelDate.year() === currentYear) {
            if (!isNaN(amount)) {
              totalRappels += amount;
            } else {
              console.warn("Invalid rappel amount:", rappel.montant);
            }
          }
        });
    
        console.log("Total rappels for the current month:", totalRappels);
        setMonthlyRappelsTotal(totalRappels);
      } catch (error) {
        console.error("Failed to fetch rappels", error);
      }
    };
    

    fetchResidents();
    fetchPayments();
    fetchRappels();
  }, []);

  dayjs.locale('fr');
  const currentMonthName = dayjs().format('MMMM');
  const currentYear = dayjs().year();

  return (
    <Box m="20px">
      {/* HEADER */}
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Header title="DASHBOARD" />
      </Box>

      {/* STATBOXES - Full Width */}
      <Box
        display="grid"
        gridTemplateColumns="repeat(3, 1fr)"
        gridAutoRows="140px"
        gap="20px"
        mt="20px"
      >
        {/* Residents Stats */}
        <Box
          gridColumn="span 1"
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <StatBox
            title={residentsCount}
            subtitle="Residents en Formation"
            icon={<GroupsIcon sx={{ color: colors.blueAccent[500], fontSize: "26px" }} />}
          />
        </Box>

        {/* Monthly Payments Stats */}
        <Box
          gridColumn="span 1"
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <StatBox
            title={`${monthlyPaymentsTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DH`}
            subtitle={`Paiements ${currentMonthName} ${currentYear}`}
            icon={<PaidIcon sx={{ color: colors.blueAccent[500], fontSize: "26px" }} />}
          />
        </Box>

        {/* Monthly Rappels Stats */}
        <Box
          gridColumn="span 1"
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <StatBox
            title={`${monthlyRappelsTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DH`}
            subtitle={`Rappels ${currentMonthName} ${currentYear}`}
            icon={<PaidIcon sx={{ color: colors.blueAccent[500], fontSize: "26px" }} />}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;
