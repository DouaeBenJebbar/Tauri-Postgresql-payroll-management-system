import React from "react";
import { Box, Typography, useTheme } from "@mui/material";
import { tokens } from "../theme"; // Ensure the path is correct

const StatBox = ({ title, subtitle, icon, progress, increase }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  return (
    <Box
      width="100%"
      borderRadius="4px"
      boxShadow="5px 5px 5px rgba(0, 0, 0, 0.1)" // Add boxShadow
      backgroundColor={colors.primary[400]} // Match the background color
    >
      <Box display="flex" justifyContent="space-between" p="15px">
        <Box>
          {icon}
          <Typography
            variant="h4"
            fontWeight="bold"
            sx={{ color: colors.grey[100] }}
          >
            {title}
          </Typography>
        </Box>
      </Box>
      <Box display="flex" justifyContent="space-between" mt="2px" p="15px">
        <Typography variant="h5" sx={{ color: colors.blueAccent[500] }}>
          {subtitle}
        </Typography>
      </Box>
    </Box>
  );
};

export default StatBox;
