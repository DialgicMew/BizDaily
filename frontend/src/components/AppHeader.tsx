import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  styled,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';

export const MobileMenuButton = styled(IconButton)(({ theme }) => ({
  color: theme.palette.primary.main,
  [theme.breakpoints.up('md')]: {
    display: 'none',
  },
}));

export const NavDrawer = styled(Drawer)(({ theme }) => ({
  '& .MuiDrawer-paper': {
    width: '260px',
    backgroundColor: theme.palette.background.paper,
  },
}));

interface AppHeaderProps {
  mobileMenuOpen: boolean;
  onMobileMenuOpen: () => void;
  onMobileMenuClose: () => void;
  children?: React.ReactNode;
}

/** Shared top AppBar chrome: brand mark, mobile menu button, and the mobile nav drawer. */
export const AppHeader: React.FC<AppHeaderProps> = ({
  mobileMenuOpen,
  onMobileMenuOpen,
  onMobileMenuClose,
  children,
}) => {
  const navigate = useNavigate();

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <MobileMenuButton edge="start" onClick={onMobileMenuOpen} aria-label="Open navigation menu">
            <MenuIcon />
          </MobileMenuButton>

          <Typography
            variant="h6"
            component="div"
            sx={{
              color: 'primary.main',
              fontSize: { xs: '1.1rem', md: '1.25rem' },
              marginLeft: { xs: 1, md: 0 },
              marginRight: { xs: 'auto', md: 2 },
              cursor: 'pointer',
            }}
            onClick={() => navigate('/')}
          >
            BizDaily
          </Typography>

          {children}
        </Toolbar>
      </AppBar>

      <NavDrawer anchor="left" open={mobileMenuOpen} onClose={onMobileMenuClose}>
        <List>
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => {
                navigate('/');
                onMobileMenuClose();
              }}
            >
              <ListItemText primary="Home" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => {
                navigate('/daily-brief');
                onMobileMenuClose();
              }}
            >
              <ListItemText primary="Daily Brief" primaryTypographyProps={{ fontWeight: 600, color: 'primary.main' }} />
            </ListItemButton>
          </ListItem>
        </List>
      </NavDrawer>
    </>
  );
};

export default AppHeader;
