import React, { useEffect, useState } from "react";
import {
  Box,
  useTheme,
  IconButton,
  InputBase,
  Snackbar,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { invoke } from "@tauri-apps/api/tauri";
import { tokens } from "../../theme";
import Header from "../../components/Header";
import SearchIcon from "@mui/icons-material/Search";

const Rappels = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [rappels, setRappels] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [filteredRappels, setFilteredRappels] = useState([]);
  const [uniqueYears, setUniqueYears] = useState([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState("Aucune");

  const [reloadTrigger, setReloadTrigger] = useState(false);

  useEffect(() => {
    const fetchRappels = async () => {
      try {
        const data = await invoke("get_rappels");
        setRappels(data);
        setFilteredRappels(transformData(data));
        extractUniqueYears(data);
      } catch (error) {
        console.error("Échec de la récupération des rappels", error);
      }
    };
    fetchRappels();
  }, [reloadTrigger]);

  useEffect(() => {
    let filtered = rappels.filter((rappel) =>
      rappel.resident_name.toString().includes(searchInput)
    );

    if (selectedYear !== "Aucune") {
      filtered = filtered.filter(
        (rappel) => rappel.exercice === parseInt(selectedYear, 10)
      );
    }
    setFilteredRappels(transformData(filtered));
  }, [searchInput, selectedYear, rappels]);

  const extractUniqueYears = (rappels) => {
    const years = rappels.map((rappel) => rappel.exercice);
    const uniqueYears = [...new Set(years)];
    setUniqueYears(uniqueYears);
  };

  const formatDaysToPeriod = (days) => {
    const months = Math.floor(days / 30);
    const remainingDays = days % 30;
    const monthsString = months > 0 ? `${months} mois` : "";
    const daysString = remainingDays > 0 ? `${remainingDays} jours` : "";
    return `${monthsString}${monthsString && daysString ? " " : ""}${daysString}`;
  };

  const transformData = (rappels) => {
    const groupedByResident = rappels.reduce((acc, rappel) => {
      if (!acc[rappel.resident_name]) {
        acc[rappel.resident_name] = [];
      }
      acc[rappel.resident_name].push(rappel);
      return acc;
    }, {});

    const transformed = [];
    Object.keys(groupedByResident).forEach((resident) => {
      let totalMontant = 0;
      let totalDays = 0;
      groupedByResident[resident].forEach((rappel, index) => {
        totalMontant += parseFloat(rappel.montant);
        totalDays += parseInt(rappel.nombre_jours, 10);
        transformed.push({
          id: `${resident}-${index}`,
          resident_name: resident,
          exercice: rappel.exercice,
          nombre_jours: formatDaysToPeriod(rappel.nombre_jours),
          montant: parseFloat(rappel.montant).toFixed(2),
        });
      });
      transformed.push({
        id: `${resident}-total`,
        resident_name: resident,
        exercice: "Total",
        nombre_jours: formatDaysToPeriod(totalDays),
        total_days: totalDays,
        montant: totalMontant.toFixed(2),
        net_a_payer: totalMontant.toFixed(2),
      });
    });
    return transformed;
  };

  const columns = [
    {
      field: "resident_name",
      headerName: "Résident",
      flex: 1,
      renderCell: (params) => {
        if (params.row.exercice === "Total") {
          return (
            <div>
              <strong>Rappel Total de {params.row.resident_name}</strong>
            </div>
          );
        }
        return params.value;
      },
    },
    {
      field: "exercice",
      headerName: "Exercice",
      flex: 1,
      renderCell: (params) => {
        if (params.row.exercice === "Total") {
          return null;
        }
        return params.value;
      },
    },
    {
      field: "nombre_jours",
      headerName: "Période du Rappel",
      flex: 1,
      renderCell: (params) => {
        if (params.row.exercice === "Total") {
          return (
            <strong>{params.value}</strong>
          );
        }
        return params.value;
      },
    },
    {
      field: "montant",
      headerName: "Montant",
      flex: 1,
      renderCell: (params) => {
        if (params.row.exercice === "Total") {
          return (
            <strong style={{ color: "blue" }}>
              {params.value} DH
            </strong>
          );
        }
        const value = parseFloat(params.value);
        const formattedValue = !isNaN(value) ? value.toFixed(2) : "0.00";
        return `${formattedValue} DH`;
      },
    },
    {
      field: "net_a_payer",
      headerName: "Net à Payer",
      flex: 1,
      renderCell: (params) => {
        if (params.row.exercice === "Total") {
          return (
            <strong>
              {params.value} DH
            </strong>
          );
        }
        return null;
      },
    },
    
  ];

  const calculateHeight = () => {
    const rowHeight = 52;
    const headerHeight = 56;
    const footerHeight = 56;
    const numRows = filteredRappels.length;
    const totalHeight = headerHeight + numRows * rowHeight + footerHeight;
    const maxHeight = 500;
    return totalHeight < maxHeight ? totalHeight : maxHeight;
  };

  return (
    <Box m="20px">
      <Header title="Rappels" />
      <Box display="flex" alignItems="center" marginTop={5} p={1}>
        <Box
          display="flex"
          alignItems="center"
          backgroundColor={colors.primary[400]}
          borderRadius="3px"
          p={1}
          sx={{ flex: 1 }}
        >
          <InputBase
            sx={{ ml: 2, flex: 1 }}
            placeholder="Recherche"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <IconButton type="button" sx={{ p: 1 }}>
            <SearchIcon />
          </IconButton>
        </Box>
        <FormControl sx={{ ml: 2, minWidth: 120 }}>
          <InputLabel>Exercice</InputLabel>
          <Select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            <MenuItem value="Aucune">Tous</MenuItem>
            {uniqueYears.map((year, index) => (
              <MenuItem key={index} value={year}>
                {year}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
          variant="contained"
          color = "secondary"
          size="medium"
          // onClick={handleGenerateClick}
          sx={{ ml: 2 }}
        >
          Générer Ordre de Paie
        </Button>
      </Box>

      <Box
        m="40px 0 0 0"
        sx={{
          height: `${calculateHeight()}px`,
          maxHeight: "600px",
          overflowY: "auto",
          "& .MuiDataGrid-root": {
            border: "none",
          },
          "& .MuiDataGrid-cell": {
            borderBottom: "none",
          },
          "& .name-column--cell": {
            color: colors.greenAccent[300],
          },
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: colors.blueAccent[700],
            borderBottom: "none",
          },
          "& .MuiDataGrid-virtualScroller": {
            backgroundColor: colors.primary[400],
          },
          "& .MuiCheckbox-root": {
            color: `${colors.greenAccent[200]} !important`,
          },
          "& .MuiDataGrid-footerContainer": {
            display: "none",
          },
          "& .bold": {
            fontWeight: 600,
          },
          "& .MuiDataGrid-row": {
            "&.total-row": {
              backgroundColor: colors.grey[800],

            },
          },
        }}
      >
        <DataGrid
          rows={filteredRappels}
          columns={columns}
          getRowId={(row) => row.id}
          disableSelectionOnClick
          autoHeight
          getRowClassName={(params) => {
            if (params.row.exercice === "Total") {
              return "total-row";
            }
            return "";
          }}
        />
      </Box>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarMessage.includes("Échec") ? "error" : "success"}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Rappels;
