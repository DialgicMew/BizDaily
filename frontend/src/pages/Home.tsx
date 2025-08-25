import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Pagination,
  CircularProgress,
  Typography,
  Link,
  TextField,
  InputAdornment,
  IconButton,
  Snackbar,
  Alert,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  useMediaQuery,
  useTheme,
  Collapse,
  styled
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import MenuIcon from '@mui/icons-material/Menu';

// Styled components
const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: '#ffffff',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  borderBottom: '1px solid #e0e0e0',
}));

const MobileMenuButton = styled(IconButton)(({ theme }) => ({
  color: '#1976d2',
  [theme.breakpoints.up('md')]: {
    display: 'none',
  },
}));

const MobileDrawer = styled(Drawer)(({ theme }) => ({
  '& .MuiDrawer-paper': {
    width: '280px',
    backgroundColor: '#ffffff',
  },
}));



const DailyBriefButton = styled(Button)(({ theme }) => ({
  backgroundColor: '#1976d2',
  color: 'white',
  borderRadius: '8px',
  padding: '8px 24px',
  textTransform: 'none',
  fontWeight: 600,
  '&:hover': {
    backgroundColor: '#1565c0',
  },
  [theme.breakpoints.down('md')]: {
    display: 'none', // Hide on mobile to save space
  },
}));

const SearchContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  marginLeft: 'auto',
  marginRight: '16px',
  [theme.breakpoints.down('md')]: {
    flexDirection: 'column',
    gap: '12px',
    width: '100%',
    marginLeft: 0,
    marginRight: 0,
  },
}));

const SearchTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    '& fieldset': {
      borderColor: '#e0e0e0',
    },
    '&:hover fieldset': {
      borderColor: '#1976d2',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#1976d2',
    },
  },
  '& .MuiInputBase-input': {
    padding: '10px 14px',
    fontSize: '14px',
  },
  [theme.breakpoints.down('md')]: {
    width: '100%',
    minWidth: 'unset',
  },
}));

const SearchButton = styled(Button)(({ theme }) => ({
  backgroundColor: '#1976d2',
  color: 'white',
  borderRadius: '8px',
  padding: '8px 16px',
  textTransform: 'none',
  fontWeight: 500,
  minWidth: '80px',
  '&:hover': {
    backgroundColor: '#1565c0',
  },
  '&:disabled': {
    backgroundColor: '#cccccc',
    color: '#888888',
  },
  [theme.breakpoints.down('md')]: {
    minWidth: 'unset',
    padding: '8px 12px',
    fontSize: '0.75rem',
  },
}));

const RefreshButton = styled(Button)(({ theme }) => ({
  backgroundColor: '#4caf50',
  color: 'white',
  borderRadius: '8px',
  padding: '8px 16px',
  textTransform: 'none',
  fontWeight: 500,
  minWidth: '120px',
  '&:hover': {
    backgroundColor: '#45a049',
  },
  '&:disabled': {
    backgroundColor: '#cccccc',
    color: '#888888',
  },
  [theme.breakpoints.down('md')]: {
    minWidth: 'unset',
    padding: '8px 12px',
    fontSize: '0.75rem',
  },
}));

const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  maxHeight: 'calc(100vh - 200px)', // Leave space for navbar and pagination
  overflow: 'auto',
  [theme.breakpoints.down('md')]: {
    maxHeight: 'calc(100vh - 160px)', // Maximum height minus navbar (64px) + minimal pagination (40px) + padding (56px)
    minHeight: 'calc(100vh - 160px)', // Same as max to prevent blank space
    height: 'calc(100vh - 160px)', // Fixed height to show all 25 rows
    '& .MuiTable-root': {
      minWidth: '800px', // Allow horizontal scroll on mobile
    },
  },
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 600,
  backgroundColor: '#f5f5f5',
  borderBottom: '2px solid #e0e0e0',
  whiteSpace: 'nowrap',
  minWidth: '120px',
  [theme.breakpoints.down('md')]: {
    fontSize: 'clamp(0.6rem, 1.6vw, 0.7rem)', // Responsive header font
    padding: 'clamp(4px, 0.8vh, 8px) clamp(1px, 0.3vw, 4px)', // Responsive header padding
    minWidth: 'clamp(60px, 12vw, 80px)', // Responsive column width
    height: 'clamp(24px, 3.5vh, 32px)', // Responsive header height
    lineHeight: '1.1',
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(even)': {
    backgroundColor: '#fafafa',
  },
  '&:hover': {
    backgroundColor: '#f0f0f0',
    cursor: 'pointer',
  },
  [theme.breakpoints.down('md')]: {
    // Dynamic height based on screen size - CSS clamp for responsive row height
    height: 'clamp(26px, 4.5vh, 36px)', // Min 26px, ideal 4.5% of viewport, max 36px
    minHeight: 'clamp(26px, 4.5vh, 36px)',
    '& .MuiTableCell-root': {
      fontSize: 'clamp(0.65rem, 1.8vw, 0.75rem)', // Responsive font size
      padding: 'clamp(2px, 0.5vh, 6px) clamp(1px, 0.3vw, 4px)', // Responsive padding
      lineHeight: '1.2',
    },
  },
}));

// API types
interface FundingData {
  funding_uuid: number;
  company_name: string;
  company_location: string;
  funded_city: string;
  funded_state: string;
  funding_name: string;
  funding_date: string;
  funding_amount: number;
  currency: string;
  funding_stage: string;
  funding_type: string;
  investment_stage: string;
  investor_count: number;
  total_investor_count: number;
  investor_names: string;
  sector: string;
  sub_sector: string;
  article_url: string;
  [key: string]: any;
}

interface ApiResponse {
  data: FundingData[];
  total: number;
  page: number;
  page_size: number;
}

// Column definitions (funding_uuid excluded from display but used internally)
const columns = [
  'company_name',
  'company_location',
  'funding_date',
  'funding_type',
  'funding_amount',
  'currency',
  'sector',
  'sub_sector',
  'funding_stage',
  'funded_city',
  'funded_state',
  'funding_name',
  'investment_stage',
  'investor_count',
  'total_investor_count',
  'investor_names',
  'article_url'
];

// API service
const fetchFundingData = async (
  page: number, 
  pageSize: number = 20, // Dynamic default, will be overridden by smart calculation
  searchQuery?: string
): Promise<ApiResponse> => {
  const requestBody: any = {
    page: page - 1, // API uses 0-based indexing
    page_size: pageSize,
  };
  
  // Add search query if provided
  if (searchQuery && searchQuery.trim()) {
    requestBody.search_query = searchQuery.trim();
  }
  
  const response = await fetch('http://localhost:8000/api/funding/funding/filter', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response.json();
};

const refreshFundingData = async (): Promise<{message: string, status: string}> => {
  const response = await fetch('http://localhost:8000/api/funding/funding/refresh', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response.json();
};

// Format cell values for display
const formatCellValue = (value: any, column: string): string | React.ReactNode => {
  if (value === null || value === undefined || value === '') {
    return '-';
  }
  
  switch (column) {
    case 'funding_amount':
      return value === 0 ? 'Undisclosed' : `$${(value / 1000000).toFixed(1)}M`;
    case 'funding_date':
      return new Date(value).toLocaleDateString();
    case 'article_url':
      return value ? (
        <Link
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            color: '#1976d2',
            textDecoration: 'none',
            '&:hover': {
              textDecoration: 'underline',
            },
          }}
        >
          View Article
        </Link>
      ) : '-';
    case 'investor_names':
      return value && value.length > 60 ? `${value.substring(0, 60)}...` : value || '-';
    case 'funding_name':
      return value && value.length > 40 ? `${value.substring(0, 40)}...` : value || '-';
    case 'company_location':
    case 'funded_city':
    case 'funded_state':
      return value || '-';
    case 'sector':
    case 'sub_sector':
      return value || '-';
    default:
      return String(value);
  }
};

// Table state interface for future extensibility
interface TableState {
  page: number;
  pageSize: number;
  searchQuery?: string;
  filters?: Record<string, any>;
  orderBy?: Array<{ field: string; direction: 'asc' | 'desc' }>;
}

// Local storage key for state persistence
const TABLE_STATE_KEY = 'bizDaily_table_state';

// Helper function to calculate optimal page size based on screen dimensions
const getOptimalPageSize = (isMobile: boolean): number => {
  if (!isMobile) {
    return 10; // Desktop default
  }
  
  // Mobile: Calculate based on viewport height and device characteristics
  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;
  
  // Fixed UI elements heights on mobile
  const navbarHeight = 64; // AppBar height
  const paginationHeight = 40; // Pagination container
  const paddingAndMargins = 8; // Minimal padding we set
  const tableHeaderHeight = 28; // Header row height from our styles
  
  // Available height for table rows
  const availableHeight = viewportHeight - navbarHeight - paginationHeight - paddingAndMargins - tableHeaderHeight;
  
  // Dynamic row height based on device size
  let rowHeight = 32; // Base row height
  
  // Adjust for very small screens (like iPhone SE)
  if (viewportHeight < 600) {
    rowHeight = 28; // Smaller rows for small screens
  }
  // Adjust for very large screens (like tablets or large phones)
  else if (viewportHeight > 900) {
    rowHeight = 36; // Slightly larger rows for big screens
  }
  
  // Adjust for landscape mode (usually means shorter height)
  if (viewportWidth > viewportHeight && viewportHeight < 500) {
    rowHeight = 26; // Extra compact for landscape
  }
  
  // Calculate how many rows fit
  const maxRows = Math.floor(availableHeight / rowHeight);
  
  // Ensure reasonable bounds based on screen size
  let minRows = 5;
  let maxRowsLimit = 50;
  
  // Adjust bounds for different device types
  if (viewportHeight < 600) {
    // Small phones: fewer minimum rows, reasonable maximum
    minRows = 3;
    maxRowsLimit = 15;
  } else if (viewportHeight > 900) {
    // Large screens/tablets: more rows allowed
    minRows = 8;
    maxRowsLimit = 60;
  }
  
  const optimalRows = Math.max(minRows, Math.min(maxRowsLimit, maxRows));
  
  console.log(`📱 Mobile page size calculation:
    Viewport: ${viewportWidth}x${viewportHeight}px
    Available: ${availableHeight}px  
    Row height: ${rowHeight}px (adjusted)
    Raw calculation: ${maxRows} rows
    Final optimal: ${optimalRows} rows`);
    
  return optimalRows;
};

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchExpanded, setMobileSearchExpanded] = useState(false);
  
  // Initialize state from URL params or localStorage
  const getInitialTableState = (): TableState => {
    const optimalPageSize = getOptimalPageSize(isMobile);
    
    // First try URL parameters
    const urlPage = searchParams.get('page');
    const urlPageSize = searchParams.get('pageSize');
    const urlSearchQuery = searchParams.get('search');
    const urlFilters = searchParams.get('filters');
    const urlOrderBy = searchParams.get('orderBy');
    
    if (urlPage || urlSearchQuery) {
      let filters = {};
      let orderBy: Array<{ field: string; direction: 'asc' | 'desc' }> = [];
      
      try {
        if (urlFilters) filters = JSON.parse(urlFilters);
        if (urlOrderBy) orderBy = JSON.parse(urlOrderBy);
      } catch (e) {
        console.warn('Failed to parse URL parameters');
      }
      
      return {
        page: parseInt(urlPage || '1', 10),
        pageSize: parseInt(urlPageSize || optimalPageSize.toString(), 10),
        searchQuery: urlSearchQuery || undefined,
        filters,
        orderBy
      };
    }
    
    // Fallback to localStorage
    const savedState = localStorage.getItem(TABLE_STATE_KEY);
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        // Update page size to optimal for current device if it's still default
        if (parsed.pageSize === 10 || parsed.pageSize === 25) {
          parsed.pageSize = optimalPageSize;
        }
        return parsed;
      } catch (e) {
        console.warn('Failed to parse saved table state');
      }
    }
    
    // Default state with device-optimal page size
    return {
      page: 1,
      pageSize: optimalPageSize,
      searchQuery: undefined,
      filters: {},
      orderBy: []
    };
  };

  const [tableState, setTableState] = useState<TableState>(getInitialTableState);
  const [searchInput, setSearchInput] = useState(getInitialTableState().searchQuery || '');
  const [data, setData] = useState<FundingData[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null);

  // Update state when URL changes (browser back/forward)
  useEffect(() => {
    const urlPage = searchParams.get('page');
    const urlPageSize = searchParams.get('pageSize');
    const urlSearchQuery = searchParams.get('search');
    const urlFilters = searchParams.get('filters');
    const urlOrderBy = searchParams.get('orderBy');
    
    if (urlPage || urlSearchQuery) {
      let filters = {};
      let orderBy: Array<{ field: string; direction: 'asc' | 'desc' }> = [];
      
      try {
        if (urlFilters) filters = JSON.parse(urlFilters);
        if (urlOrderBy) orderBy = JSON.parse(urlOrderBy);
      } catch (e) {
        console.warn('Failed to parse URL parameters');
      }
      
      const optimalPageSize = getOptimalPageSize(isMobile);
      const newState = {
        page: parseInt(urlPage || '1', 10),
        pageSize: parseInt(urlPageSize || optimalPageSize.toString(), 10),
        searchQuery: urlSearchQuery || undefined,
        filters,
        orderBy
      };
      
      if (JSON.stringify(newState) !== JSON.stringify(tableState)) {
        setTableState(newState);
      }
    }
  }, [searchParams, tableState, isMobile]);
  
  // Update page size when device type changes (mobile/desktop) or viewport size changes
  useEffect(() => {
    const calculateAndUpdatePageSize = () => {
      const optimalPageSize = getOptimalPageSize(isMobile);
      if (tableState.pageSize !== optimalPageSize) {
        setTableState(prevState => ({
          ...prevState,
          pageSize: optimalPageSize,
          page: 1 // Reset to first page when changing page size
        }));
      }
    };

    // Initial calculation
    calculateAndUpdatePageSize();

    // Debounced resize handler to avoid excessive calculations
    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      if (isMobile) {
        // Clear previous timeout
        clearTimeout(resizeTimeout);
        // Set new timeout to debounce rapid resize events
        resizeTimeout = setTimeout(() => {
          calculateAndUpdatePageSize();
        }, 150); // 150ms delay to debounce
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', () => {
      // For orientation change, add small delay to ensure viewport has updated
      setTimeout(handleResize, 300);
    });

    return () => {
      // Clean up event listeners
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      // Clean up any pending timeout
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
    };
  }, [isMobile, tableState.pageSize]);
  
  // Update URL and localStorage when table state changes
  const updateTableState = (newState: Partial<TableState>) => {
    const updatedState = { ...tableState, ...newState };
    setTableState(updatedState);
    
    // Update URL parameters
    const newSearchParams = new URLSearchParams();
    newSearchParams.set('page', updatedState.page.toString());
    newSearchParams.set('pageSize', updatedState.pageSize.toString());
    
    // Add search query to URL if present
    if (updatedState.searchQuery && updatedState.searchQuery.trim()) {
      newSearchParams.set('search', updatedState.searchQuery.trim());
    }
    
    // Add filters and orderBy to URL when implemented
    if (updatedState.filters && Object.keys(updatedState.filters).length > 0) {
      newSearchParams.set('filters', JSON.stringify(updatedState.filters));
    }
    if (updatedState.orderBy && updatedState.orderBy.length > 0) {
      newSearchParams.set('orderBy', JSON.stringify(updatedState.orderBy));
    }
    
    setSearchParams(newSearchParams);
    
    // Save to localStorage as backup
    localStorage.setItem(TABLE_STATE_KEY, JSON.stringify(updatedState));
  };

  // Search handler
  const handleSearch = () => {
    if (loading) return; // Prevent search during loading
    
    updateTableState({ 
      page: 1, // Reset to first page when searching
      searchQuery: searchInput.trim() || undefined 
    });
  };

  // Handle Enter key press in search field
  const handleSearchKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  // Handle refresh button click
  const handleRefresh = async () => {
    if (refreshing || loading) return; // Prevent multiple refreshes
    
    try {
      setRefreshing(true);
      setRefreshMessage(null);
      
      const result = await refreshFundingData();
      setRefreshMessage(result.message);
      
      // Refresh the current data after successful sync
      const response = await fetchFundingData(
        tableState.page, 
        tableState.pageSize, 
        tableState.searchQuery
      );
      setData(response.data);
      setTotal(response.total);
      
      // Clear success message after 3 seconds
      setTimeout(() => setRefreshMessage(null), 3000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to refresh data';
      setRefreshMessage(`Error: ${errorMsg}`);
      // Clear error message after 5 seconds
      setTimeout(() => setRefreshMessage(null), 5000);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetchFundingData(
          tableState.page, 
          tableState.pageSize, 
          tableState.searchQuery
        );
        setData(response.data);
        setTotal(response.total);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [tableState.page, tableState.pageSize, tableState.searchQuery, tableState.filters, tableState.orderBy]);
  
  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    updateTableState({ page: value });
  };
  
  const handleRowClick = (row: FundingData, event: React.MouseEvent) => {
    // Check if the click was on the article link
    const target = event.target as HTMLElement;
    if (target.tagName === 'A' || target.closest('a')) {
      return; // Don't navigate if clicking on the article link
    }
    
    // Store the funding data in sessionStorage for the detail page
    sessionStorage.setItem(`funding_${row.funding_uuid}`, JSON.stringify(row));
    
    // Navigate to funding detail page
    navigate(`/funding/${row.funding_uuid}`);
  };
  
  const totalPages = Math.ceil(total / tableState.pageSize);

  return (
    <Box sx={{ 
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      [theme.breakpoints.down('md')]: {
        height: '100vh',
        maxHeight: '100vh',
      }
    }}>
      {/* Top Navbar */}
      <StyledAppBar position="static">
        <Toolbar>
          {/* Mobile Menu Button */}
          <MobileMenuButton
            edge="start"
            onClick={() => setMobileMenuOpen(true)}
          >
            <MenuIcon />
          </MobileMenuButton>

          {/* BizDaily Branding */}
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              fontWeight: 700,
              color: '#1976d2',
              fontSize: { xs: '1.1rem', md: '1.25rem' },
              marginLeft: { xs: 1, md: 0 },
              marginRight: { xs: 'auto', md: 2 },
              cursor: 'pointer'
            }}
            onClick={() => navigate('/')}
          >
            BizDaily
          </Typography>

          {/* Desktop Daily Brief Button */}
          <DailyBriefButton onClick={() => navigate('/daily-brief')}>
            Daily Brief
          </DailyBriefButton>

          {/* Mobile Search Toggle */}
          {isMobile && (
            <IconButton
              onClick={() => setMobileSearchExpanded(!mobileSearchExpanded)}
              sx={{ color: '#1976d2' }}
            >
              <SearchIcon />
            </IconButton>
          )}
          
          {/* Desktop Search Container */}
          {!isMobile && (
            <SearchContainer>
              <SearchTextField
                size="small"
                placeholder="Search companies, investors, sectors..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={handleSearchKeyPress}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#666', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
                sx={{ width: '300px' }}
              />
              <SearchButton 
                onClick={handleSearch}
                disabled={loading}
              >
                Search
              </SearchButton>
              <RefreshButton 
                onClick={handleRefresh}
                disabled={loading || refreshing}
                startIcon={refreshing ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon />}
              >
                {refreshing ? 'Refreshing...' : 'Refresh Data'}
              </RefreshButton>
            </SearchContainer>
          )}
        </Toolbar>
        
        {/* Mobile Search Bar Collapse */}
        <Collapse in={mobileSearchExpanded && isMobile}>
          <Box sx={{ p: 2, borderTop: '1px solid #e0e0e0', backgroundColor: '#f8f9fa' }}>
            <SearchTextField
              size="small"
              placeholder="Search companies, investors, sectors..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyPress={handleSearchKeyPress}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#666', fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
              sx={{ width: '100%', mb: 1 }}
            />
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <SearchButton 
                onClick={handleSearch}
                disabled={loading}
                size="small"
              >
                Search
              </SearchButton>
              <RefreshButton 
                onClick={handleRefresh}
                disabled={loading || refreshing}
                startIcon={refreshing ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon />}
                size="small"
              >
                {refreshing ? 'Sync' : 'Sync'}
              </RefreshButton>
            </Box>
          </Box>
        </Collapse>
      </StyledAppBar>
      
      {/* Mobile Navigation Drawer */}
      <MobileDrawer
        anchor="left"
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      >
        <List>
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => {
                navigate('/daily-brief');
                setMobileMenuOpen(false);
              }}
            >
              <ListItemText 
                primary="Daily Brief" 
                primaryTypographyProps={{ 
                  fontWeight: 600, 
                  color: '#1976d2' 
                }} 
              />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => {
                navigate('/');
                setMobileMenuOpen(false);
              }}
            >
              <ListItemText primary="Home" />
            </ListItemButton>
          </ListItem>
        </List>
      </MobileDrawer>
      
      {/* Main Content Area */}
      <Box sx={{ 
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        p: 3,
        overflow: 'hidden',
        [theme.breakpoints.down('md')]: {
          p: 0.25, // Ultra minimal padding on mobile
          pb: 0, // No bottom padding
          height: 'calc(100vh - 64px)', // Full height minus navbar
          maxHeight: 'calc(100vh - 64px)',
        }
      }}>
        {/* Table Container */}
        <Paper sx={{ 
          borderRadius: '12px', 
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', 
          border: '1px solid #e0e0e0',
          flex: 1, // Take up available space
          display: 'flex',
          flexDirection: 'column',
          [theme.breakpoints.down('md')]: {
            borderRadius: '4px',
            margin: '0',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            flex: 1,
            height: 'calc(100vh - 108px)', // Height minus navbar (64px) + pagination (40px) + tiny padding (4px)
            maxHeight: 'calc(100vh - 108px)',
          }
        }}>
          <StyledTableContainer sx={{ 
            flex: 1, 
            mb: 2,
            [theme.breakpoints.down('md')]: {
              mb: 0, // No margin on mobile
              flex: 1,
              height: 'calc(100vh - 148px)', // Max space for table: total height - navbar - pagination - minimal padding
              maxHeight: 'calc(100vh - 148px)',
              minHeight: 'calc(100vh - 148px)',
            }
          }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
                <Typography color="error">Error: {error}</Typography>
              </Box>
            ) : (
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    {columns.map((column) => (
                      <StyledTableCell key={column}>
                        {column.replace(/_/g, ' ').toUpperCase()}
                      </StyledTableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.map((row, index) => (
                    <StyledTableRow 
                      key={row.funding_uuid || index}
                      onClick={(event) => handleRowClick(row, event)}
                    >
                      {columns.map((column) => (
                        <TableCell 
                          key={column}
                          sx={{ 
                            whiteSpace: 'nowrap',
                            minWidth: '120px',
                            [theme.breakpoints.down('md')]: {
                              fontSize: '0.75rem',
                              padding: '8px 4px',
                              minWidth: '80px',
                            },
                          }}
                        >
                          {formatCellValue(row[column], column)}
                        </TableCell>
                      ))}
                    </StyledTableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </StyledTableContainer>
        </Paper>
        
        {/* Pagination */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center',
          alignItems: 'center',
          py: 2,
          [theme.breakpoints.down('md')]: {
            py: 0.125, // Ultra minimal padding on mobile
            height: '40px', // Fixed height exactly
            minHeight: '40px',
            maxHeight: '40px',
            flexShrink: 0, // Don't let it shrink
            backgroundColor: '#ffffff',
            borderTop: '1px solid #e0e0e0',
          }
        }}>
          <Pagination 
            count={totalPages}
            page={tableState.page}
            onChange={handlePageChange}
            color="primary"
            size={isMobile ? "small" : "large"}
            showFirstButton={!isMobile}
            showLastButton={!isMobile}
            siblingCount={isMobile ? 0 : 1}
            boundaryCount={isMobile ? 1 : 2}
            disabled={loading}
          />
        </Box>
      </Box>
      
      {/* Refresh Status Snackbar */}
      <Snackbar
        open={!!refreshMessage}
        autoHideDuration={refreshMessage?.startsWith('Error:') ? 5000 : 3000}
        onClose={() => setRefreshMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setRefreshMessage(null)}
          severity={refreshMessage?.startsWith('Error:') ? 'error' : 'success'}
          variant="filled"
        >
          {refreshMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Home;