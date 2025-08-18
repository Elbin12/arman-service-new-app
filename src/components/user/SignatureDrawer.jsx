import React, { useEffect, useRef, useState } from "react";
import * as fabric from "fabric";
import { Box, Button, Typography, Paper } from "@mui/material";
import { Delete as DeleteIcon, Edit as EditIcon } from "@mui/icons-material";

export const SignatureDrawer = ({ label, value, onChange, width = 400, height = 150 }) => {
  const canvasRef = useRef(null);
  const [fabricCanvas, setFabricCanvas] = useState(null);
  const [isDrawing, setIsDrawing] = useState(true);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Create the Fabric.js canvas
    const canvas = new fabric.Canvas(canvasRef.current, {
      isDrawingMode: true,
      backgroundColor: "#ffffff",
      selection: false,
    });

    canvas.setWidth(width);
    canvas.setHeight(height);

    if (canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.color = "#000000";
      canvas.freeDrawingBrush.width = 2;
    }

    // Load existing signature if we have one
    if (value) {
      try {
        canvas.loadFromJSON(value, () => {
          canvas.renderAll();
        });
      } catch (error) {
        console.error("Error loading signature:", error);
      }
    }

    setFabricCanvas(canvas);

    // Save signature on path creation
    canvas.on("path:created", () => {
      const signatureData = canvas.toJSON();
      onChange(JSON.stringify(signatureData));
    });

    return () => {
      canvas.dispose();
    };
  }, []);

  const handleClear = () => {
    if (!fabricCanvas) return;
    fabricCanvas.clear();
    fabricCanvas.backgroundColor = "#ffffff";
    fabricCanvas.renderAll();
    onChange("");
  };

  const toggleDrawingMode = () => {
    if (!fabricCanvas) return;
    const newMode = !isDrawing;
    setIsDrawing(newMode);
    fabricCanvas.isDrawingMode = newMode;
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <Typography variant="body2" sx={{ fontWeight: "medium" }}>
        {label}
      </Typography>

      <Paper
        elevation={1}
        sx={{
          p: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          border: "1px solid #e0e0e0",
          borderRadius: 2,
        }}
      >
        <Box
          sx={{
            border: "2px dashed #ccc",
            borderRadius: 1,
            p: 1,
            backgroundColor: "#fafafa",
          }}
        >
          <canvas
            ref={canvasRef}
            style={{
              display: "block",
              touchAction: "none",
            }}
          />
        </Box>

        <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
          <Button
            variant={isDrawing ? "contained" : "outlined"}
            size="small"
            startIcon={<EditIcon />}
            onClick={toggleDrawingMode}
            color="primary"
          >
            {isDrawing ? "Drawing Mode" : "Selection Mode"}
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<DeleteIcon />}
            onClick={handleClear}
            color="error"
          >
            Clear
          </Button>
        </Box>

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mt: 1, textAlign: "center" }}
        >
          Click and drag to draw your signature above
        </Typography>
      </Paper>
    </Box>
  );
};