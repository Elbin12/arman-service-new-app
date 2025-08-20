"use client"
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useTheme,
  useMediaQuery,
  Divider,
  Button,
} from "@mui/material"
import { Menu as MenuIcon, BusinessCenter, LocationOn, Logout, AdminPanelSettings, Person } from "@mui/icons-material"
import { useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { HomeIcon as House } from "lucide-react"
import { useDispatch } from "react-redux"
import { logoutUser } from "../../store/slices/authSlice"

const drawerWidth = 280

// AdminLayout component props: { children }

const menuItems = [
  // { text: 'Dashboard', icon: Dashboard, path: '/admin' },
  { text: "Service Management", icon: BusinessCenter, path: "/admin/services" },
  { text: "Location Management", icon: LocationOn, path: "/admin/locations" },
  { text: "House Size Info", icon: House, path: "/admin/house-size-info" },
  // { text: 'Question Builder', icon: QuestionAnswer, path: '/admin/questions' },
  // { text: 'Settings', icon: Settings, path: '/admin/settings' },
]

export const AdminLayout = ({ children }) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))
  const [mobileOpen, setMobileOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  
  const dispatch = useDispatch();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const handleLogout = () => {
    dispatch(logoutUser())
    navigate('/admin/login');
  }

  const drawer = (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Toolbar>
        <Typography variant="h6" noWrap component="div" className="text-primary font-bold">
          Admin Panel
        </Typography>
      </Toolbar>
      <List style={{ flex: 1 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => navigate(item.path)}
              className="mx-2 rounded-lg"
              sx={{
                "&.Mui-selected": {
                  backgroundColor: "hsl(var(--primary) / 0.1)",
                  color: "hsl(var(--primary))",
                  "&:hover": {
                    backgroundColor: "hsl(var(--primary) / 0.15)",
                  },
                },
              }}
            >
              <ListItemIcon sx={{ color: location.pathname === item.path ? "hsl(var(--primary))" : "inherit" }}>
                <item.icon />
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Box sx={{ mt: "auto" }}>
        <Divider />
        <List>
          <ListItem disablePadding>
            <ListItemButton
              onClick={handleLogout}
              className="mx-2 rounded-lg"
              sx={{
                "&:hover": {
                  backgroundColor: "hsl(var(--destructive) / 0.1)",
                  color: "hsl(var(--destructive))",
                },
              }}
            >
              <ListItemIcon>
                <Logout />
              </ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>
    </div>
  )

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          backgroundColor: "hsl(var(--background))",
          color: "hsl(var(--foreground))",
          boxShadow: "var(--shadow-sm)",
          borderBottom: "1px solid hsl(var(--border))",
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: "none" } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            Service Booking Management
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Button
            variant="outlined"
            startIcon={<Person />}
            onClick={() => navigate("/")}
            sx={{
              borderColor: "hsl(var(--primary))",
              color: "hsl(var(--primary))",
              "&:hover": {
                borderColor: "hsl(var(--primary))",
                backgroundColor: "hsl(var(--primary) / 0.1)",
              },
            }}
          >
            Switch to User
          </Button>
        </Toolbar>
      </AppBar>
      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }} aria-label="admin navigation">
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          marginTop: "64px",
          backgroundColor: "hsl(var(--muted) / 0.3)",
          minHeight: "calc(100vh - 64px)",
        }}
      >
        {children}
      </Box>
    </Box>
  )
}
