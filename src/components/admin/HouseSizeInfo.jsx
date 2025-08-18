"use client"

import { useCallback, useMemo, useState, useEffect } from "react"
import {
  Box,
  Button,
  IconButton,
  TextField,
  Typography,
  Stack,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  InputAdornment,
} from "@mui/material"
import { Delete as DeleteIcon, Add as AddIcon, Save as SaveIcon } from "@mui/icons-material"
import {
  useGetHouseSizesQuery,
  useCreateHouseSizesMutation,
  useDeleteHouseSizeMutation,
  useUpdateHouseSizesMutation,
} from "../../store/api/houseSizesApi"

const parseNumber = (v) => {
  const n = Number.parseInt(v, 10)
  return Number.isNaN(n) ? null : n
}

const HouseSizeInfo = () => {
  const { data: fetched, isLoading: isFetching, isError, error } = useGetHouseSizesQuery()
  const [createHouseSizes, { isLoading: isSaving }] = useCreateHouseSizesMutation()
  const [updateHouseSizes] = useUpdateHouseSizesMutation()
  const [deleteHouseSize] = useDeleteHouseSizeMutation()

  const [rows, setRows] = useState([{ max: "", andUp: false }])
  const [initialized, setInitialized] = useState(false)
  const [packages, setPackages] = useState(["Package 1", "Package 2", "Package 3"])
  const [packageValues, setPackageValues] = useState({})
  const [savingRows, setSavingRows] = useState(new Set())

  useEffect(() => {
    if (!initialized && Array.isArray(fetched)) {
      const mappedRows = fetched.map((r) => ({
        id: r.id,
        max: r.max_sqft != null ? String(r.max_sqft) : "",
        andUp: r.max_sqft == null,
      }))

      const newPackageValues = {}
      const packageSet = new Set()

      fetched.forEach((r, idx) => {
        newPackageValues[idx] = {}
        r.template_prices.forEach((tp) => {
          newPackageValues[idx][tp.label] = tp.price.toString()
          packageSet.add(tp.label)
        })
      })

      setRows(mappedRows.length ? mappedRows : [{ max: "", andUp: false }])
      setPackageValues(newPackageValues)
      setPackages(Array.from(packageSet))
      setInitialized(true)
    }
  }, [fetched, initialized])

  const derivedRows = useMemo(() => {
    const result = []
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const prev = result[i - 1]
      const prevMax = i === 0 ? 0 : prev && prev.max !== "" ? parseNumber(prev.max) : null
      const min_sq_ft = i === 0 ? 0 : prevMax !== null ? prevMax + 1 : ""
      result.push({
        min: min_sq_ft,
        max: row.max,
        andUp: row.andUp,
      })
      if (row.andUp) break
    }
    return result
  }, [rows])

  const handleChangeMax = useCallback((index, value) => {
    setRows((prev) => {
      const copy = [...prev]
      copy[index] = { ...copy[index], max: value, andUp: false }
      
      // Auto-adjust subsequent rows if needed
      const currentMax = parseNumber(value)
      if (currentMax !== null) {
        let lastMax = currentMax
        
        for (let i = index + 1; i < copy.length; i++) {
          if (copy[i].andUp) break // Stop if we hit an "and up" row
          
          const nextRowMax = parseNumber(copy[i].max)
          const requiredMinimum = lastMax + 1
          
          // If next row's max is less than or equal to the required minimum, auto-adjust it
          if (nextRowMax === null || nextRowMax < requiredMinimum) {
            const newMax = lastMax + 500
            copy[i] = { ...copy[i], max: String(newMax) }
            lastMax = newMax
          } else {
            lastMax = nextRowMax
          }
        }
      }
      
      return copy
    })
  }, [])

  const toggleAndUp = (index) => {
    setRows((prev) => {
      const copy = [...prev]
      const currently = copy[index].andUp
      copy[index] = {
        ...copy[index],
        andUp: !currently,
        max: currently ? copy[index].max : "",
      }
      if (!currently) {
        copy.splice(index + 1)
      }
      return copy
    })
  }

  const handleAddRow = () => {
    setRows((prev) => {
      if (prev.some((r) => r.andUp)) return prev
      return [...prev, { max: "", andUp: false }]
    })
    setPackageValues((prev) => {
      const newValues = { ...prev }
      const newIndex = rows.length
      newValues[newIndex] = {}
      packages.forEach((pkg) => {
        newValues[newIndex][pkg] = ""
      })
      return newValues
    })
  }

  const handleDeleteRow = async (index) => {
    const row = rows[index]
    if (row.id) {
      try {
        await deleteHouseSize(row.id).unwrap()
        alert(`Row ${index + 1} deleted successfully`)
      } catch (error) {
        console.error("Delete failed:", error)
        alert("Failed to delete row from server.")
        return
      }
    }
    setRows((prev) => prev.filter((_, i) => i !== index))
    setPackageValues((prev) => {
      const updated = { ...prev }
      delete updated[index]
      const reindexed = {}
      Object.keys(updated).forEach((key, idx) => {
        if (parseInt(key) > index) {
          reindexed[idx] = updated[key]
        } else if (parseInt(key) < index) {
          reindexed[key] = updated[key]
        }
      })
      return reindexed
    })
  }

  const handleAddPackage = () => {
    setPackages((prev) => {
      const nextIndex = prev.length + 1
      return [...prev, `Package ${nextIndex}`]
    })
    setPackageValues((prev) => {
      const updated = { ...prev }
      rows.forEach((_, idx) => {
        const key = String(idx)
        if (!updated[key]) updated[key] = {}
        updated[key][`Package ${packages.length + 1}`] = ""
      })
      return updated
    })
  }

  const handlePackageValueChange = (rowIndex, packageName, value) => {
    setPackageValues((prev) => ({
      ...prev,
      [rowIndex]: {
        ...prev[rowIndex],
        [packageName]: value,
      },
    }))
  }

  const getRowError = (row, idx, derived) => {
    if (row.andUp) return ""
    const min = idx === 0 ? 0 : derived[idx - 1]?.max !== "" ? parseNumber(derived[idx - 1].max) + 1 : 0
    if (row.max === "") return ""
    const maxParsed = parseNumber(row.max)
    if (maxParsed === null) return "Invalid number"
    if (maxParsed < min) return `Must be ≥ ${min}`
    return ""
  }

  const handleSaveAffectedRows = async (startIndex) => {
    // Use a Promise to ensure we get the latest state
    return new Promise((resolve) => {
      // Get the current state using the callback form
      setRows((currentRows) => {
        setPackageValues((currentPackageValues) => {
          // Now we have the latest state, proceed with saving
          const affectedRows = []
          
          // Recalculate derived rows with current state
          const freshDerivedRows = []
          for (let i = 0; i < currentRows.length; i++) {
            const row = currentRows[i]
            const prev = freshDerivedRows[i - 1]
            const prevMax = i === 0 ? 0 : prev && prev.max !== "" ? parseNumber(prev.max) : null
            const min_sq_ft = i === 0 ? 0 : prevMax !== null ? prevMax + 1 : ""
            freshDerivedRows.push({
              min: min_sq_ft,
              max: row.max,
              andUp: row.andUp,
            })
            if (row.andUp) break
          }
          
          // Collect all rows that need to be updated
          for (let i = startIndex; i < freshDerivedRows.length; i++) {
            const row = freshDerivedRows[i]
            const originalRow = currentRows[i]
            if (!row) continue

            const minParsed = parseNumber(String(row.min))
            const maxParsed = parseNumber(originalRow.max)

            if (minParsed === null) {
              alert(`Invalid minimum value for row ${i + 1}`)
              resolve()
              return currentPackageValues
            }

            const packagesForRow = currentPackageValues[i] || {}
            const template_prices = Object.entries(packagesForRow).map(([label, priceStr], idx) => {
              const price = parseFloat(priceStr)
              return {
                label,
                price: isNaN(price) ? 0 : price,
                order: idx + 1,
              }
            })

            affectedRows.push({
              index: i,
              payload: {
                min_sqft: minParsed,
                max_sqft: originalRow.andUp || originalRow.max === "" ? null : maxParsed,
                order: i + 1,
                template_prices,
              },
              isNew: !originalRow.id,
              id: originalRow.id
            })

            console.log(`Row ${i + 1} payload:`, {
              min_sqft: minParsed,
              max_sqft: originalRow.andUp || originalRow.max === "" ? null : maxParsed,
              originalMaxValue: originalRow.max,
              template_prices,
              order: i + 1,
            })
          }

          // Now save the rows
          const saveRows = async () => {
            setSavingRows((prev) => {
              const newSet = new Set(prev)
              affectedRows.forEach(row => newSet.add(row.index))
              return newSet
            })

            try {
              for (const rowData of affectedRows) {
                if (rowData.isNew) {
                  await createHouseSizes(rowData.payload).unwrap()
                } else {
                  await updateHouseSizes({ id: rowData.id, sizes:rowData.payload }).unwrap()
                }
              }
              
              alert(`Successfully updated ${affectedRows.length} row(s)`)
              setInitialized(false) // Refresh data
              
            } catch (err) {
              console.error("Save error:", err)
              alert(`Error saving rows: ${err.message || 'Unknown error'}`)
            } finally {
              setSavingRows((prev) => {
                const newSet = new Set(prev)
                affectedRows.forEach(row => newSet.delete(row.index))
                return newSet
              })
              resolve()
            }
          }

          saveRows()
          return currentPackageValues
        })
        return currentRows
      })
    })
  }

  const handleSaveAll = async () => {
    // Save all rows starting from index 0
    await handleSaveAffectedRows(0)
  }

  return (
    <Box sx={{ p: 3, background: "#fff", borderRadius: 2, boxShadow: 1 }}>
      <Typography variant="h6" mb={2}>
        House Size Information
      </Typography>
      <Typography variant="body2" mb={2} color="text.secondary">
        Define square footage ranges. Minimum is auto-derived from previous row's maximum + 1. 
        When you update a maximum value, it automatically updates the minimum of subsequent rows.
        Any row can be toggled to "And Up" (no upper bound). Rows after an "And Up" are removed.
      </Typography>

      {isFetching && <Typography sx={{ mb: 2 }}>Loading existing ranges...</Typography>}
      {isError && (
        <Typography color="error" sx={{ mb: 2 }}>
          Failed to load ranges. {error?.toString ? error.toString() : ""}
        </Typography>
      )}

      <Box display="flex" justifyContent="flex-end" mb={2}>
        <Button onClick={handleAddPackage} variant="outlined" size="small">
          + Add Package Column
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ mb: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
              <TableCell sx={{ fontWeight: "bold", minWidth: 80 }}>Minimum</TableCell>
              <TableCell sx={{ fontWeight: "bold", minWidth: 100 }}>Maximum</TableCell>
              {packages.map((pkg) => (
                <TableCell key={pkg} sx={{ fontWeight: "bold", minWidth: 120 }}>
                  Minimum <br /> {pkg}
                </TableCell>
              ))}
              <TableCell sx={{ fontWeight: "bold", width: 100 }}>And Up</TableCell>
              <TableCell sx={{ width: 60 }}></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {derivedRows.map((row, index) => {
              const errorText = getRowError(rows[index], index, derivedRows)
              const isRowSaving = savingRows.has(index)

              return (
                <TableRow key={index}>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="body2">Sq Ft</Typography>
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          fontWeight: 500,
                          color: index === 0 ? 'text.primary' : 'primary.main'
                        }}
                      >
                        {row.min === "" ? "-" : row.min}
                      </Typography>
                      {index > 0 && (
                        <Typography variant="caption" color="text.secondary">
                          (auto)
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    {!row.andUp ? (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Typography variant="body2">to</Typography>
                        <TextField
                          size="small"
                          type="number"
                          placeholder="Maximum"
                          value={rows[index]?.max || ""}
                          onChange={(e) => handleChangeMax(index, e.target.value)}
                          sx={{ width: 100 }}
                          inputProps={{ min: 0 }}
                          error={!!errorText}
                          helperText={errorText}
                        />
                      </Box>
                    ) : (
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        And Up
                      </Typography>
                    )}
                  </TableCell>
                  {packages.map((pkg) => (
                    <TableCell key={`${index}-${pkg}`}>
                      <TextField
                        size="small"
                        placeholder="0"
                        value={packageValues[index]?.[pkg] || ""}
                        onChange={(e) => handlePackageValueChange(index, pkg, e.target.value)}
                        sx={{ width: 100 }}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">$</InputAdornment>,
                        }}
                      />
                    </TableCell>
                  ))}
                  <TableCell>
                    <Checkbox size="small" checked={rows[index]?.andUp || false} onChange={() => toggleAndUp(index)} />
                  </TableCell>
                  <TableCell>
                    <IconButton 
                      aria-label="delete" 
                      size="small" 
                      onClick={() => handleDeleteRow(index)} 
                      color="error"
                      disabled={savingRows.size > 0}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {derivedRows.length === 0 && !isFetching && (
        <Typography sx={{ textAlign: "center", py: 4, color: "text.secondary" }}>
          No ranges defined. Click "Add New Option" to start.
        </Typography>
      )}

      <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 2 }}>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={handleAddRow}
          size="small"
          data-testid="add-new-option"
          disabled={rows.some((r) => r.andUp)}
        >
          + Add New Option
        </Button>
        
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSaveAll}
          size="small"
          disabled={savingRows.size > 0 || rows.some((row, idx) => getRowError(row, idx, derivedRows))}
          color="primary"
        >
          {savingRows.size > 0 ? 'Saving...' : 'Save All'}
        </Button>
      </Stack>

      <Box sx={{ mt: 2, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
        <Typography variant="body2" color="info.contrastText">
          <strong>Note:</strong> When you save a row, all subsequent rows will also be updated automatically 
          since their minimum values are calculated based on the previous row's maximum + 1.
        </Typography>
      </Box>
    </Box>
  )
}

export default HouseSizeInfo