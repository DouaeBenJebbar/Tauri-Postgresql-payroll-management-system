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
import { saveAs } from 'file-saver';
import ExcelJS from 'exceljs';
import n2words from 'n2words';

const Rappels = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [rappels, setRappels] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [filteredRappels, setFilteredRappels] = useState([]);
  const [uniqueYears, setUniqueYears] = useState([]);
  const [uniqueMonths, setUniqueMonths] = useState([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const monthLabels = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ];

  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");

  const [reloadTrigger, setReloadTrigger] = useState(false);

  const handleGenerateClick = async () => {
    try {
      if (filteredRappels.length === 0) {
        throw new Error('Aucun rappel filtré à exporter.');
      }
  
      const headerResponse = await fetch('/templates/headerOV-RAP.xlsx');
      if (!headerResponse.ok) {
        throw new Error('Failed to fetch template file');
      }
      const headerArrayBuffer = await headerResponse.arrayBuffer();
  
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(headerArrayBuffer);
  
      // Ensure worksheet exists and is loaded correctly
      const worksheet = workbook.getWorksheet('OV-RAP (14)'); // Replace 'Sheet1' with actual sheet name/index
      if (!worksheet) {
        throw new Error('Worksheet not found in the workbook.');
      }
  
      let currentRow = 19; // Start adding data from row 19
      let totalNetAPayer = 0;
  
      // Insert data rows
      for (const item of filteredRappels) {
        if (item.exercice === "Total") {
          const row = worksheet.getRow(currentRow);
          row.height = 60.75;
          row.getCell(2).value = { richText: [{ text: item.nom_resident, font: { size: 26, italic: true, name: 'Times New Roman' } }] };
          row.getCell(3).value = { richText: [{ text: item.rib, font: { size: 26, italic: true, name: 'Times New Roman' } }] };
          row.getCell(4).value = { richText: [{ text: item.nom_banque, font: { size: 26, italic: true, name: 'Times New Roman' } }] };
          row.getCell(5).value = parseFloat(item.net_a_payer).toFixed(2); // Set as numeric value directly
          row.getCell(5).numFmt = '#,##0.00'; // Numeric format
          row.font = { size: 26, italic: true, name: 'Times New Roman' }; // Apply font style
          applyBordersToRow(row); // Apply borders to the entire row
          row.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true }; // Wrap text and align
  
          // Accumulate total net_a_payer
          totalNetAPayer += parseFloat(item.net_a_payer);
          currentRow++;
        }
      }
  
      // Insert total row after data rows
      const totalRow = worksheet.getRow(currentRow);
      totalRow.height = 60.75; // Set row height
      totalRow.getCell(2).value = { richText: [{ text: 'TOTAL', font: { size: 26, italic: true, name: 'Times New Roman' } }] };
      totalRow.getCell(3).value = null; // Merging cells, so leave other cells null
      totalRow.getCell(4).value = null;
      totalRow.getCell(5).value = parseFloat(totalNetAPayer.toFixed(2)); // Set as numeric value directly
      totalRow.getCell(5).numFmt = '#,##0.00'; // Numeric format
      totalRow.font = { size: 26, italic: true, name: 'Times New Roman' }; // Apply font style
      applyBordersToRow(totalRow); // Apply borders to the entire row
      worksheet.mergeCells(currentRow, 2, currentRow, 4); // Merge cells B, C, D for 'TOTAL'
  
      const totalInWords = n2words(totalNetAPayer, { lang: 'fr' });

      // Insert the total value and its French word version in B17 and C17 respectively
      const summaryRow = worksheet.getRow(17);
      summaryRow.getCell(2).value = parseFloat(totalNetAPayer.toFixed(2));
      summaryRow.getCell(3).value = totalInWords; // French word version
      summaryRow.font = { size: 23, name: 'Times New Roman' }; 
  
  
      // Insert additional rows
      currentRow++; // Move to the next row after 'TOTAL'
  
      // Merge cells B to E and insert text in the subsequent row
      const additionalRow1 = worksheet.getRow(currentRow);
      additionalRow1.getCell(2).value = "RAPPEL DE L'INDEMNITE DE FONCTION DES MEDECINS RESIDENTS DU  AU ";
      worksheet.mergeCells(currentRow, 2, currentRow, 5); // Merge cells B to E
      additionalRow1.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }; // Center align and wrap text
      additionalRow1.font = { size: 26, italic: true, name: 'Times New Roman' }; // Apply font style
      additionalRow1.height = 60.75;
      currentRow++;
  
      // Insert 'L'ORDONNATEUR' and 'LE FONDE DE POUVOIRS' in the next row
      const additionalRow2 = worksheet.getRow(currentRow);
      additionalRow2.getCell(2).value = "L'ORDONNATEUR";
      additionalRow2.getCell(4).value = "LE FONDE DE POUVOIRS";
      additionalRow2.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }; // Center align and wrap text
      additionalRow2.getCell(2).font = { size: 26, bold: true, name: 'Times New Roman' }; // Apply font style (size 26)
      additionalRow2.getCell(4).font = { size: 20, bold: true, name: 'Times New Roman' }; // Apply font style (size 20)
      additionalRow2.height = 70;
      currentRow++;
  
      // Clear borders after the additional rows
      for (let i = currentRow; i <= worksheet.rowCount; i++) {
        const clearRow = worksheet.getRow(i);
        clearRow.eachCell((cell) => {
          cell.border = {};
        });
      }
  
      const fileName = `OV-RAP ${selectedMonth} ${selectedYear}.xlsx`;
  
      // Save the modified workbook with the generated file name
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, fileName);
    } catch (error) {
      console.error('Error generating Excel file from template:', error);
      setSnackbarMessage(`Erreur lors de la génération du fichier Excel: ${error.message}`);
      setSnackbarOpen(true);
    }
  };
  
  const applyBordersToRow = (row) => {
    // Apply borders to all cells in the row
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });
  };
  
  
  

  useEffect(() => {
    const fetchRappels = async () => {
      try {
        const data = await invoke("get_rappels");
        const transformedData = transformData(data);
        console.log('Transformed Data:', transformedData); // Debug here
        setRappels(data);
        setFilteredRappels(transformedData);
        extractUniqueYearsAndMonths(data);
      } catch (error) {
        console.error("Échec de la récupération des rappels", error);
      }
    };
    fetchRappels();
  }, [reloadTrigger]);

  useEffect(() => {
    let filtered = rappels.filter((rappel) =>
      rappel.nom_resident.toString().includes(searchInput)
    );

    if (selectedYear) {
      filtered = filtered.filter(
        (rappel) => new Date(rappel.date_generation).getFullYear() === parseInt(selectedYear, 10)
      );
    }

    if (selectedMonth) {
      filtered = filtered.filter(
        (rappel) => monthLabels[new Date(rappel.date_generation).getMonth()] === selectedMonth
      );
    }

    setFilteredRappels(transformData(filtered));
  }, [searchInput, selectedYear, selectedMonth, rappels]);

  const extractUniqueYearsAndMonths = (rappels) => {
    const years = new Set();
    const months = new Set();

    rappels.forEach((rappel) => {
      const date = new Date(rappel.date_generation);
      years.add(date.getFullYear());
      months.add(date.getMonth());
    });

    const sortedYears = Array.from(years).sort((a, b) => b - a);
    const sortedMonths = Array.from(months).sort((a, b) => b - a);

    setUniqueYears(sortedYears);
    setUniqueMonths(sortedMonths.map(month => monthLabels[month]));

    setSelectedYear(sortedYears[0]);
    setSelectedMonth(monthLabels[sortedMonths[0]]);
  };

  const formatDaysToPeriod = (days) => {
    const years = Math.floor(days / 365);
    const remainingDaysAfterYears = days % 365;
    const months = Math.floor(remainingDaysAfterYears / 30);
    const remainingDays = remainingDaysAfterYears % 30;
  
    const yearsString = years > 0 ? `${years} ${years > 1 ? 'ans' : 'an'}` : "";
    const monthsString = months > 0 ? `${months} ${months > 1 ? 'mois' : 'mois'}` : "";
    const daysString = remainingDays > 0 ? `${remainingDays} ${remainingDays > 1 ? 'jours' : 'jour'}` : "";
  
    return `${yearsString}${yearsString && (monthsString || daysString) ? " " : ""}${monthsString}${(yearsString || monthsString) && daysString ? " " : ""}${daysString}`;
  };
  

  const transformData = (rappels) => {
    const groupedByResident = rappels.reduce((acc, rappel) => {
      if (!acc[rappel.nom_resident]) {
        acc[rappel.nom_resident] = [];
      }
      acc[rappel.nom_resident].push(rappel);
      return acc;
    }, {});
  
    const transformed = [];
    Object.keys(groupedByResident).forEach((resident) => {
      let totalMontant = 0;
      let totalDays = 0;
      groupedByResident[resident].forEach((rappel, index) => {
        totalMontant += parseFloat(rappel.montant);
        totalDays += parseInt(rappel.duree_rappel, 10);
        transformed.push({
          id: `${resident}-${index}`,
          nom_resident: resident,
          exercice: rappel.exercice,
          duree_rappel: formatDaysToPeriod(rappel.duree_rappel),
          montant: parseFloat(rappel.montant).toFixed(2),
          nom_banque: rappel.nom_banque,
          rib: rappel.rib,
        });
      });
      // Access the last rappel in the grouped array to get rib and nom_banque for the Total row
      const lastRappel = groupedByResident[resident][groupedByResident[resident].length - 1];
      transformed.push({
        id: `${resident}-total`,
        nom_resident: resident,
        exercice: "Total",
        duree_rappel: formatDaysToPeriod(totalDays),
        total_days: totalDays,
        montant: totalMontant.toFixed(2),
        rib: lastRappel.rib,
        nom_banque: lastRappel.nom_banque,
        net_a_payer: totalMontant.toFixed(2),
      });
    });
    return transformed;
  };
  
  const columns = [
    {
      field: "nom_resident",
      headerName: "Résident",
      flex: 2,
      renderCell: (params) => {
        if (params.row.exercice === "Total") {
          return (
            <div>
              Rappel Total de <strong>{params.row.nom_resident}</strong>
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
      field: "duree_rappel",
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
      <Header title="RAPPELS" />
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
          <InputLabel>Mois</InputLabel>
          <Select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            label="Mois"
          >
            {uniqueMonths.map((month, index) => (
              <MenuItem key={index} value={month}>
                {month}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl sx={{ ml: 2, minWidth: 120 }}>
          <InputLabel>Année</InputLabel>
          <Select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            label="Année"
          >
            {uniqueYears.map((year, index) => (
              <MenuItem key={index} value={year}>
                {year}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
          variant="contained"   
          onClick={handleGenerateClick}
          color="secondary"
          size="medium"
          sx={{ ml: 2 }}
        >
          Générer Ordre de Virement
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
