import React, { useEffect, useState } from "react";
import { Box, useTheme } from "@mui/material";
import Header from "../../components/Header";
import GroupsIcon from '@mui/icons-material/Groups';
import StatBox from "../../components/StatBox";
import { tokens } from "../../theme";
import { invoke } from "@tauri-apps/api/tauri";


const Dashboard = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  
  const [residentsCount, setResidentsCount] = useState(0); // Define residentsCount state

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await invoke("get_residents");
        setResidentsCount(data.length); // Update residentsCount state with the length of data
      } catch (error) {
        console.error("Failed to fetch residents", error);
      }
    };

    fetchData();
  }, []);

  return (
    <Box m="20px">
      <Header title="DASHBOARD" subtitle="Welcome to your dashboard" />
      <Box
        display="grid"
        gridTemplateColumns="repeat(12, 1fr)"
        gridAutoRows="140px"
        gap="20px"
      >
        <Box
          gridColumn="span 3"
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <StatBox
            title={residentsCount} // Use residentsCount state
            subtitle="Residents en Formation"
            icon={<GroupsIcon sx={{ color: colors.blueAccent[500], fontSize: "26px" }} />}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;
