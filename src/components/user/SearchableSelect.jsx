import React, { useEffect, useState } from "react";
import {
  TextField,
  CircularProgress,
  Box,
  Typography,
  Paper,
  ListItem,
  ListItemText,
  ClickAwayListener,
} from "@mui/material";

const SearchableSelect = ({ label, useSearchHook, onSelect, value }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const { data: searchData, isFetching } = useSearchHook(searchTerm, {
    skip: !searchTerm,
  });

  const data = searchData?.results || [];

  useEffect(()=>{
    if (value){
      setSearchTerm(value);
    }
  }, [value])

  const handleChange = (e) => {
    setSearchTerm(e.target.value);
    setShowSuggestions(true);
  };

  const handleSelect = (id) => {
    const selectedItem = data.find((d) => d.id === id);
    if (!selectedItem) return;

    // Set input text to the chosen name (so user sees it)
    setSearchTerm(`${selectedItem.first_name} ${selectedItem.last_name}`);
    setShowSuggestions(false); // close dropdown

    onSelect(selectedItem);
  };

  const handleClickAway = () => {
    setShowSuggestions(false);
  };

  return (
    <ClickAwayListener onClickAway={handleClickAway}>
      <Box sx={{ position: "relative" }}>
        <TextField
          fullWidth
          label={label}
          value={searchTerm}
          onChange={handleChange}
          placeholder={`Search ${label.toLowerCase()}...`}
          InputProps={{
            endAdornment: isFetching && <CircularProgress size={20} />,
          }}
        />

        {/* Suggestions dropdown */}
        {showSuggestions && searchTerm && data.length > 0 && (
          <Paper
            sx={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              zIndex: 10,
              maxHeight: 250,
              overflowY: "auto",
              mt: 1,
            }}
          >
            {data.map((item) => (
              <ListItem
                key={item.id}
                button
                onClick={() => handleSelect(item.id)}
                sx={{ cursor: "pointer" }}
              >
                <ListItemText
                  primary={`${item.first_name} ${item.last_name}`}
                  secondary={item.email}
                />
              </ListItem>
            ))}
          </Paper>
        )}

        {!isFetching && searchTerm && showSuggestions && data.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            No results found
          </Typography>
        )}
      </Box>
    </ClickAwayListener>
  );
};

export default SearchableSelect;
