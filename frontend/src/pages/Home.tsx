import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
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
  Chip,
  useMediaQuery,
  useTheme,
  Collapse,
  styled,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { API_ENDPOINTS } from '../config/constants';
import { AppHeader } from '../components/AppHeader';

// Styled components
const DailyBriefButton = styled(Button)(({ theme }) => ({
  borderRadius: '8px',
  padding: '8px 24px',
  fontWeight: 600,
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
    backgroundColor: theme.palette.background.default,
    borderRadius: '8px',
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
  borderRadius: '8px',
  padding: '8px 16px',
  fontWeight: 600,
  minWidth: '80px',
  [theme.breakpoints.down('md')]: {
    minWidth: 'unset',
    padding: '8px 12px',
    fontSize: '0.75rem',
  },
}));

const RefreshButton = styled(Button)(({ theme }) => ({
  backgroundColor: theme.palette.secondary.main,
  color: 'white',
  borderRadius: '8px',
  padding: '8px 16px',
  fontWeight: 600,
  minWidth: '120px',
  '&:hover': {
    backgroundColor: '#128033',
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

const StyledTableContainer = styled(TableContainer)(() => ({
  maxHeight: 'calc(100vh - 200px)', // Leave space for navbar and pagination
  overflow: 'auto',
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 600,
  backgroundColor: '#f5f6f8',
  borderBottom: `2px solid ${theme.palette.divider}`,
  whiteSpace: 'nowrap',
  minWidth: '120px',
}));

const StyledTableRow = styled(TableRow)(() => ({
  '&:nth-of-type(even)': {
    backgroundColor: '#fafafa',
  },
  '&:hover': {
    backgroundColor: '#f0f4ff',
    cursor: 'pointer',
  },
}));

const MobileCard = styled(Paper)(({ theme }) => ({
  borderRadius: 10,
  border: `1px solid ${theme.palette.divider}`,
  padding: '12px 14px',
  marginBottom: '8px',
  boxShadow: 'none',
  cursor: 'pointer',
  transition: 'background-color 0.15s ease',
  '&:active': {
    backgroundColor: '#f0f4ff',
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
  'article_url',
];

// API service
const fetchFundingData = async (
  page: number,
  pageSize: number = 20,
  searchQuery?: string
): Promise<ApiResponse> => {
  const requestBody: any = {
    page: page - 1, // API uses 0-based indexing
    page_size: pageSize,
  };

  if (searchQuery && searchQuery.trim()) {
    requestBody.search_query = searchQuery.trim();
  }

  const response = await fetch(API_ENDPOINTS.FUNDING_FILTER, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};

const refreshFundingData = async (): Promise<{ message: string; status: string }> => {
  const response = await fetch(API_ENDPOINTS.FUNDING_REFRESH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
          onClick={(e) => e.stopPropagation()}
          sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
        >
          View Article
        </Link>
      ) : (
        '-'
      );
    case 'investor_names':
      return value && value.length > 60 ? `${value.substring(0, 60)}...` : value || '-';
    case 'funding_name':
      return value && value.length > 40 ? `${value.substring(0, 40)}...` : value || '-';
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

  // Mobile: a card list, not a fixed-height table, so a flat sensible default works well
  return 15;
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
        orderBy,
      };
    }

    const savedState = localStorage.getItem(TABLE_STATE_KEY);
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        if (parsed.pageSize === 10 || parsed.pageSize === 25) {
          parsed.pageSize = optimalPageSize;
        }
        return parsed;
      } catch (e) {
        console.warn('Failed to parse saved table state');
      }
    }

    return {
      page: 1,
      pageSize: optimalPageSize,
      searchQuery: undefined,
      filters: {},
      orderBy: [],
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
        orderBy,
      };

      if (JSON.stringify(newState) !== JSON.stringify(tableState)) {
        setTableState(newState);
      }
    }
  }, [searchParams, tableState, isMobile]);

  // Update URL and localStorage when table state changes
  const updateTableState = (newState: Partial<TableState>) => {
    const updatedState = { ...tableState, ...newState };
    setTableState(updatedState);

    const newSearchParams = new URLSearchParams();
    newSearchParams.set('page', updatedState.page.toString());
    newSearchParams.set('pageSize', updatedState.pageSize.toString());

    if (updatedState.searchQuery && updatedState.searchQuery.trim()) {
      newSearchParams.set('search', updatedState.searchQuery.trim());
    }

    if (updatedState.filters && Object.keys(updatedState.filters).length > 0) {
      newSearchParams.set('filters', JSON.stringify(updatedState.filters));
    }
    if (updatedState.orderBy && updatedState.orderBy.length > 0) {
      newSearchParams.set('orderBy', JSON.stringify(updatedState.orderBy));
    }

    setSearchParams(newSearchParams);
    localStorage.setItem(TABLE_STATE_KEY, JSON.stringify(updatedState));
  };

  const handleSearch = () => {
    if (loading) return;

    updateTableState({
      page: 1,
      searchQuery: searchInput.trim() || undefined,
    });
  };

  const handleSearchKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  const handleRefresh = async () => {
    if (refreshing || loading) return;

    try {
      setRefreshing(true);
      setRefreshMessage(null);

      const result = await refreshFundingData();
      setRefreshMessage(result.message);

      const response = await fetchFundingData(tableState.page, tableState.pageSize, tableState.searchQuery);
      setData(response.data);
      setTotal(response.total);

      setTimeout(() => setRefreshMessage(null), 3000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to refresh data';
      setRefreshMessage(`Error: ${errorMsg}`);
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
        const response = await fetchFundingData(tableState.page, tableState.pageSize, tableState.searchQuery);
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
    const target = event.target as HTMLElement;
    if (target.tagName === 'A' || target.closest('a')) {
      return; // Don't navigate if clicking on the article link
    }

    sessionStorage.setItem(`funding_${row.funding_uuid}`, JSON.stringify(row));
    navigate(`/funding/${row.funding_uuid}`);
  };

  const totalPages = Math.ceil(total / tableState.pageSize);

  const searchAndActions = (
    <>
      <DailyBriefButton variant="contained" onClick={() => navigate('/daily-brief')}>
        Daily Brief
      </DailyBriefButton>

      {isMobile && (
        <IconButton onClick={() => setMobileSearchExpanded(!mobileSearchExpanded)} sx={{ color: 'primary.main' }} aria-label="Toggle search">
          <SearchIcon />
        </IconButton>
      )}

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
                  <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                </InputAdornment>
              ),
            }}
            sx={{ width: '300px' }}
          />
          <SearchButton variant="contained" onClick={handleSearch} disabled={loading}>
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
    </>
  );

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <AppHeader
        mobileMenuOpen={mobileMenuOpen}
        onMobileMenuOpen={() => setMobileMenuOpen(true)}
        onMobileMenuClose={() => setMobileMenuOpen(false)}
      >
        {searchAndActions}
      </AppHeader>

      {/* Mobile Search Bar Collapse */}
      <Collapse in={mobileSearchExpanded && isMobile}>
        <Box sx={{ p: 2, borderTop: '1px solid #e0e0e0', backgroundColor: 'background.default' }}>
          <SearchTextField
            size="small"
            placeholder="Search companies, investors, sectors..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyPress={handleSearchKeyPress}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                </InputAdornment>
              ),
            }}
            sx={{ width: '100%', mb: 1 }}
          />
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <SearchButton variant="contained" onClick={handleSearch} disabled={loading} size="small">
              Search
            </SearchButton>
            <RefreshButton
              onClick={handleRefresh}
              disabled={loading || refreshing}
              startIcon={refreshing ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon />}
              size="small"
            >
              Sync
            </RefreshButton>
          </Box>
        </Box>
      </Collapse>

      {/* Main Content Area */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          p: 3,
          overflow: 'hidden',
          [theme.breakpoints.down('md')]: {
            p: 1,
            overflow: 'auto',
          },
        }}
      >
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
            <Typography color="error">Error: {error}</Typography>
          </Box>
        ) : isMobile ? (
          /* Mobile: compact card list instead of a horizontally-scrolling table */
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            {data.map((row, index) => (
              <MobileCard key={row.funding_uuid || index} onClick={(event) => handleRowClick(row, event)}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: 'text.primary' }} noWrap>
                      {row.company_name || '-'}
                    </Typography>
                    <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary' }} noWrap>
                      {row.company_location || row.funded_city || 'Location N/A'}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: 'secondary.main' }}>
                      {formatCellValue(row.funding_amount, 'funding_amount')}
                    </Typography>
                    <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary' }}>
                      {formatCellValue(row.funding_date, 'funding_date')}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1, alignItems: 'center' }}>
                  {row.funding_stage && (
                    <Chip label={row.funding_stage} size="small" sx={{ backgroundColor: '#f3e8fd', color: '#7c3aed', fontSize: '0.68rem', height: '20px' }} />
                  )}
                  {row.sector && (
                    <Chip label={row.sector} size="small" sx={{ backgroundColor: '#e8f0fe', color: 'primary.dark', fontSize: '0.68rem', height: '20px' }} />
                  )}
                  <ChevronRightIcon sx={{ ml: 'auto', color: 'text.secondary', fontSize: 18 }} />
                </Box>
              </MobileCard>
            ))}
            {data.length === 0 && (
              <Typography sx={{ textAlign: 'center', color: 'text.secondary', py: 6 }}>No funding records found.</Typography>
            )}
          </Box>
        ) : (
          /* Desktop: full data table */
          <Paper
            sx={{
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(15, 23, 42, 0.08)',
              border: `1px solid ${theme.palette.divider}`,
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <StyledTableContainer sx={{ flex: 1, mb: 2 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    {columns.map((column) => (
                      <StyledTableCell key={column}>{column.replace(/_/g, ' ').toUpperCase()}</StyledTableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.map((row, index) => (
                    <StyledTableRow key={row.funding_uuid || index} onClick={(event) => handleRowClick(row, event)}>
                      {columns.map((column) => (
                        <TableCell key={column} sx={{ whiteSpace: 'nowrap', minWidth: '120px' }}>
                          {formatCellValue(row[column], column)}
                        </TableCell>
                      ))}
                    </StyledTableRow>
                  ))}
                </TableBody>
              </Table>
            </StyledTableContainer>
          </Paper>
        )}

        {/* Pagination */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            py: 2,
            flexShrink: 0,
            [theme.breakpoints.down('md')]: { py: 1 },
          }}
        >
          <Pagination
            count={totalPages}
            page={tableState.page}
            onChange={handlePageChange}
            color="primary"
            size={isMobile ? 'small' : 'large'}
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
        <Alert onClose={() => setRefreshMessage(null)} severity={refreshMessage?.startsWith('Error:') ? 'error' : 'success'} variant="filled">
          {refreshMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Home;
