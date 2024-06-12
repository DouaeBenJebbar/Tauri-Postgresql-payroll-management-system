import React, { useEffect, useState } from "react";
import { Box, Typography, useTheme } from "@mui/material";
import Header from "../../components/Header";
import GroupsIcon from '@mui/icons-material/Groups';
import StarsIcon from '@mui/icons-material/Stars';
import PaidIcon from '@mui/icons-material/Paid';
import StatBox from "../../components/StatBox";
import { tokens } from "../../theme";
import { invoke } from "@tauri-apps/api/tauri";

const NotificationItem = ({ message }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  return (
    <Box
      p="10px"
      mb="10px"
      borderRadius="4px"
      backgroundColor={colors.blueAccent[500] }
      boxShadow="0px 0px 5px rgba(0, 0, 0, 0.1)"
      height="50px"
    >
      <Typography variant="body2">{message}</Typography>
    </Box>
  );
};

// Notifications component
const Notifications = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const notifications = [
    "New user registered",
    "Server error reported",
    "New message received",
    "Update available",
    // Add more notifications as needed
  ];

  return (
    <Box
      p="15px"
      borderRadius="4px"
      boxShadow="5px 5px 5px rgba(0, 0, 0, 0.1)"
      height="100%"
      backgroundColor={colors.primary[400]}
    >
      <Typography variant="h6" gutterBottom >
        Notifications
      </Typography>
      <Box overflow="auto" height="100%" >
        {notifications.map((message, index) => (
          <NotificationItem key={index} message={message} />
        ))}
      </Box>
    </Box>
  );
};

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
      <Header title="DASHBOARD"/>
      <Box display="flex" gap="20px">
        {/* StatBox Grid */}
        <Box
          display="grid"
          gridTemplateColumns="repeat(6, 1fr)" // Adjust the number of columns
          gridTemplateRows="repeat(2, 140px)" // Change the number of rows to 2
          gap="20px"
          width="70%"
          
        >
          <Box
            gridColumn="span 3"
            display="flex"
            alignItems="center"
            justifyContent="center"
            gridRow="span 1"
            
          >
            <StatBox
              title={residentsCount} // Use residentsCount state
              subtitle="Residents en Formation"
              icon={<GroupsIcon sx={{ color: colors.blueAccent[500], fontSize: "26px" }} />}
            />
          </Box>
          <Box
            gridColumn="span 3"
            display="flex"
            alignItems="center"
            justifyContent="center"
            gridRow="span 1"
          >
            <StatBox
              title={residentsCount} // Use residentsCount state
              subtitle="Spécialité médicale"
              icon={<StarsIcon sx={{ color: colors.blueAccent[500], fontSize: "26px" }} />}
            />
          </Box>
          <Box
            gridColumn="span 3"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <StatBox
              title={residentsCount} // Use residentsCount state
              subtitle="Salaire Total"
              icon={<PaidIcon sx={{ color: colors.blueAccent[500], fontSize: "26px" }} />}
            />
          </Box>
          <Box
            gridColumn="span 3"
            display="flex"
            alignItems="center"
            justifyContent="center"
            gridRow="span 1"
          >
            <StatBox
              title={residentsCount} // Use residentsCount state
              subtitle="Rappel Total"
              icon={<PaidIcon sx={{ color: colors.blueAccent[500], fontSize: "26px" }} />}
            />
          </Box>
        </Box>

        {/* Notifications */}
        <Box width="30%"

        >
          <Notifications />
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;
