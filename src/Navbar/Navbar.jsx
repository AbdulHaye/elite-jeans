import React, { useState, useEffect, useRef } from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Menu from "@mui/material/Menu";
import MenuIcon from "@mui/icons-material/Menu";
import Container from "@mui/material/Container";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import MenuItem from "@mui/material/MenuItem";
import AdbIcon from "@mui/icons-material/Adb";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./../Navbar/Navbar.css";
import { ArrowDropDownIcon } from "@mui/x-date-pickers";

// All possible menu items with their required roles
const allMenuItems = [
  { name: "WORK ORDER", path: "/", roles: ["general", "admin", "read_only"] },
  {
    name: "TECH PACK",
    path: "/techpack",
    roles: ["general", "admin", "read_only"],
  },
  { name: "Packaging", path: "/trim", roles: ["general", "admin", "read_only"] },
  {
    name: "PICTURES",
    path: "/picture",
    roles: ["general", "admin", "read_only"],
  },
  {
    name: "SHIPPING",
    path: "",
    roles: ["shipping", "vendor", "admin", "read_only"],
  },
  {
    name: "CONFIGURATIONS",
    path: "",
    roles: ["production", "general", "editSpecsTemplates", "admin"],
  },
  { name: "VENDOR PO", path: "/vendor-po", roles: ["admin"] },
  { name: "QUOTES", path: "/quotes", roles: ["pricing", "vendor", "admin"] },
  { name: "SALES CONTRACTS", path: "/sales-contract", roles: ["admin"] },
  { name: "USERS", path: "/users", roles: ["admin"] },
];

const faqSubMenus = [
  {
    name: "CONFIGURATIONS",
    path: "/Configuration",
    roles: ["production", "admin"],
  },
  { name: "POM LIBRARY", path: "/POM", roles: ["general", "admin"] },
  {
    name: "SIZE SCALE ASSIGNMENTS",
    path: "/new-scale-assignment",
    roles: ["production", "admin"],
  },
  {
    name: "Specs Templates",
    path: "/spec-template",
    roles: ["general", "editSpecsTemplates", "admin"],
  },
  {
    name: "Digital Pattern Library",
    path: "/digital-pattern",
    roles: ["admin"],
  },
];

const shippingSubmenus = [
  {
    name: "SHIPPING",
    path: "/shipping",
    roles: ["shipping", "vendor", "admin", "read_only"],
  },
  {
    name: "Arrangements",
    path: "/arrangments",
    roles: ["shipping", "vendor", "admin", "read_only"],
  },
];

const settings = ["Logout"];

function ResponsiveAppBar() {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [filteredMenus, setFilteredMenus] = useState([]);

  const navigate = useNavigate();
  const [faqOpen, setFaqOpen] = useState(false);
  const [shippingOpen, setShippingOpen] = useState(false);
  const [anchorElNav, setAnchorElNav] = useState(null);
  const [anchorElUser, setAnchorElUser] = useState(null);

  const faqRef = useRef(null);
  const shippingRef = useRef(null);

  useEffect(() => {
    // Get user from localStorage
    const userData = JSON.parse(localStorage.getItem("user"));
    if (userData) {
      setUser(userData);

      // Filter menus based on user roles
      const filtered = allMenuItems.filter((menu) => {
        // Admin gets all menus
        if (userData.type === "admin") return true;

        // Vendor gets vendor PO and shipping (which will show submenus)
        if (userData.type === "vendor") {
          return (
            menu.name === "SHIPPING" ||
            // menu.name === "VENDOR PO" ||
            menu.name === "QUOTES"
          );
        }

        // Read-only users get specific menus
        if (userData.type === "read_only") {
          return (
            menu.name === "WORK ORDER" ||
            menu.name === "TECH PACK" ||
            menu.name === "TRIMS" ||
            menu.name === "PICTURES" ||
            menu.name === "SHIPPING"
          );
        }

        // Regular users get menus based on their roles
        return menu.roles.some((role) => userData.role.includes(role));
      });

      setFilteredMenus(filtered);
    }
  }, []);

  const handleOpenNavMenu = (event) => {
    setAnchorElNav(event.currentTarget);
  };

  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

 const isActive = (path) => {
    if (!path || path === "/") {
      return (
        location.pathname === "/" ||
        location.pathname.startsWith("/work-order-detail")
      );
    }
    
    // Special case for TECH PACK to match both /techpack and detail routes
    if (path === "/techpack") {
      return (
        location.pathname.startsWith("/techpack") ||
        location.pathname.startsWith("/tech-pack-detail") ||
        location.pathname.startsWith("/sample-specs")
      );
    }
    
    return location.pathname.startsWith(path);
  };

  // Check if user has access to a specific menu
  const hasAccess = (menuRoles) => {
    if (!user) return false;
    if (user.type === "admin") return true;
    if (user.type === "vendor") {
      return menuRoles.some((role) =>
        ["shipping", "vendor", "admin"].includes(role)
      );
    }
    if (user.type === "read_only") {
      return menuRoles.some((role) => ["read_only"].includes(role));
    }

    return menuRoles.some((role) => user.role.includes(role));
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (faqRef.current && !faqRef.current.contains(event.target)) {
        setFaqOpen(false);
      }
      if (shippingRef.current && !shippingRef.current.contains(event.target)) {
        setShippingOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [faqRef, shippingRef]);

  if (!user) return null; // Don't render navbar if no user is logged in

  const handleLogout = () => {
    // Clear all items from localStorage
    localStorage.clear();

    // Navigate to login page
    navigate("/login");

    // Close the user menu
    handleCloseUserMenu();
  };
  return (
    <AppBar position="static" sx={{ backgroundColor: "rgba(10, 13, 14, 0.8)" }}>
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          <Typography
            variant="h6"
            noWrap
            component="a"
            // href="/"
            sx={{
              mr: 2,
              display: { xs: "none", md: "flex" },
              fontFamily: "monospace",
              fontWeight: 700,
              letterSpacing: ".05rem",
              color: "inherit",
              textDecoration: "none",
              fontSize: "14px",
            }}
          >
            Elite Jeans
          </Typography>

          {/* Mobile Menu */}
          <Box sx={{ flexGrow: 1, display: { xs: "flex", md: "none" } }}>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleOpenNavMenu}
              color="inherit"
            >
              <MenuIcon />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorElNav}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "left",
              }}
              keepMounted
              transformOrigin={{
                vertical: "top",
                horizontal: "left",
              }}
              open={Boolean(anchorElNav)}
              onClose={handleCloseNavMenu}
              sx={{ display: { xs: "block", md: "none" } }}
            >
              {filteredMenus.map((menu) => (
                <MenuItem key={menu?.name} onClick={handleCloseNavMenu}>
                  <Link
                    to={menu?.path}
                    style={{
                      textDecoration: "none",
                      color: isActive(menu?.path) ? "white" : "#999999",
                      fontWeight: isActive(menu?.path) ? "bold" : "normal",
                    }}
                  >
                    <Typography sx={{ textAlign: "center", fontSize: "11px" }}>
                      {menu?.name}
                    </Typography>
                  </Link>
                </MenuItem>
              ))}
            </Menu>
          </Box>

          {/* Mobile Logo */}
          <Typography
            variant="h5"
            noWrap
            component="a"
            href="#app-bar-with-responsive-menu"
            sx={{
              mr: 2,
              display: { xs: "flex", md: "none" },
              flexGrow: 1,
              fontFamily: "monospace",
              fontWeight: 700,
              letterSpacing: ".05rem",
              color: "inherit",
              textDecoration: "none",
              fontSize: "12px",
            }}
          >
            Elite Jeans
          </Typography>

          {/* Desktop Menu */}
          <Box
            sx={{
              flexGrow: 1,
              display: { xs: "none", md: "flex", ml: "30px" },
            }}
          >
            {filteredMenus.map((menu) =>
              menu?.name === "SHIPPING" ? (
                <Box
                  key={menu?.name}
                  sx={{ position: "relative" }}
                  ref={shippingRef}
                >
                  <Button
                    onClick={() => setShippingOpen(!shippingOpen)}
                    sx={{
                      my: 2,
                      color: shippingSubmenus.some((item) =>
                        isActive(item.path)
                      )
                        ? "white"
                        : "#999999",
                      fontWeight: shippingSubmenus.some((item) =>
                        isActive(item.path)
                      )
                        ? "bold"
                        : "normal",
                      borderBottom: shippingSubmenus.some((item) =>
                        isActive(item.path)
                      )
                        ? "2px solid white"
                        : "none",
                      display: "block",
                      fontSize: "11px",
                    }}
                  >
                    {menu?.name}
                    <span style={{ marginLeft: "5px" }}>&#9662;</span>
                  </Button>
                  {shippingOpen && (
                    <Box
                      sx={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        zIndex: 9999,
                        backgroundColor: "white",
                        boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",
                      }}
                    >
                      {shippingSubmenus
                        .filter((submenu) => hasAccess(submenu.roles))
                        .map((submenu) => (
                          <Link
                            key={submenu?.name}
                            to={submenu?.path}
                            style={{ textDecoration: "none", color: "inherit" }}
                          >
                            <Button
                              sx={{
                                color: "black",
                                display: "block",
                                width: "100%",
                                textAlign: "left",
                                fontSize: "11px",
                              }}
                            >
                              {submenu?.name}
                            </Button>
                          </Link>
                        ))}
                    </Box>
                  )}
                </Box>
              ) : menu.name === "CONFIGURATIONS" ? (
                <Box
                  key={menu?.name}
                  sx={{ position: "relative" }}
                  ref={faqRef}
                >
                  <Button
                    onClick={() => setFaqOpen(!faqOpen)}
                    sx={{
                      my: 2,
                      color: faqSubMenus.some((item) => isActive(item.path))
                        ? "white"
                        : "#999999",
                      fontWeight: faqSubMenus.some((item) =>
                        isActive(item.path)
                      )
                        ? "bold"
                        : "normal",
                      borderBottom: faqSubMenus.some((item) =>
                        isActive(item.path)
                      )
                        ? "2px solid white"
                        : "none",
                      display: "block",
                      fontSize: "11px",
                    }}
                  >
                    {menu.name}
                    <span style={{ marginLeft: "5px" }}>&#9662;</span>
                  </Button>
                  {faqOpen && (
                    <Box
                      sx={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        zIndex: 9999,
                        backgroundColor: "white",
                        boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",
                      }}
                    >
                      {faqSubMenus
                        .filter((submenu) => hasAccess(submenu.roles))
                        .map((submenu) => (
                          <Link
                            key={submenu?.name}
                            to={submenu?.path}
                            style={{ textDecoration: "none", color: "inherit" }}
                          >
                            <Button
                              sx={{
                                color: "black",
                                display: "block",
                                width: "100%",
                                textAlign: "left",
                                fontSize: "11px",
                              }}
                            >
                              {submenu?.name}
                            </Button>
                          </Link>
                        ))}
                    </Box>
                  )}
                </Box>
              ) : (
                <Link
                  key={menu?.name}
                  to={menu?.path}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <Button
                    sx={{
                      my: 2,
                      color: isActive(menu?.path) ? "white" : "#999999",
                      fontWeight: isActive(menu?.path) ? "bold" : "normal",
                      borderBottom: isActive(menu?.path)
                        ? "2px solid white"
                        : "none",
                      display: "block",
                      fontSize: "11px",
                    }}
                  >
                    {menu.name}
                  </Button>
                </Link>
              )
            )}
          </Box>

          {/* User Settings */}
          <Box sx={{ flexGrow: 0 }}>
            <Tooltip title={user?.username || "User"} arrow>
              <IconButton
                size="medium"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleOpenUserMenu}
                color="inherit"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  p: 1,
                  borderRadius: 1,
                  "&:hover": {
                    backgroundColor: "action.hover",
                  },
                  transition: "background-color 0.2s ease",
                }}
              >
                <Avatar
                  alt={user?.username || "User"}
                  src={user?.avatarUrl || "/static/images/avatar/2.jpg"}
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: "primary.main",
                    color: "primary.contrastText",
                  }}
                >
                  {user?.username?.charAt(0).toUpperCase() || "U"}
                </Avatar>
                <Typography
                  variant="subtitle2"
                  sx={{
                    display: { xs: "none", sm: "block" },
                    fontWeight: "medium",
                    maxWidth: 120,
                    textOverflow: "ellipsis",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                  }}
                >
                  {user?.username || "User"}
                </Typography>
                <ArrowDropDownIcon
                  fontSize="small"
                  sx={{
                    color: "text.secondary",
                    transition: "transform 0.2s ease",
                    // transform: open ? 'rotate(180deg)' : 'rotate(0)',
                  }}
                />
              </IconButton>
            </Tooltip>
            <Menu
              sx={{ mt: "45px" }}
              id="menu-appbar"
              anchorEl={anchorElUser}
              anchorOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              keepMounted
              transformOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}
            >
              {settings?.map((setting) => (
                <MenuItem
                  key={setting}
                  onClick={
                    setting === "Logout" ? handleLogout : handleCloseUserMenu
                  }
                >
                  <Typography sx={{ textAlign: "center", fontSize: "11px" }}>
                    {setting}
                  </Typography>
                </MenuItem>
              ))}
            </Menu>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}

export default ResponsiveAppBar;
