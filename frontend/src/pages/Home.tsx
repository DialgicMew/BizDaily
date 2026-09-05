import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Button,
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
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import { API_ENDPOINTS } from '../config/constants';
import { AppHeader } from '../components/AppHeader';
import { getTagColor } from '../utils/tagColor';

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

// Single card design used at every breakpoint — a responsive grid reflows it
// from one column on phones to several on desktop, instead of swapping to a
// completely different (and much plainer) table layout on larger screens.
const FundingCard = styled(Paper)(({ theme }) => ({
  borderRadius: 12,
  border: `1px solid ${theme.palette.divider}`,
  padding: '16px 18px',
  boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
  cursor: 'pointer',
  minWidth: 0, // grid items default to min-width:auto, which lets nowrap content force the track wider than the container
  overflow: 'hidden',
  transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
  '&:hover': {
    boxShadow: '0 8px 20px rgba(15, 23, 42, 0.1)',
    borderColor: theme.palette.primary.light,
    transform: 'translateY(-2px)',
  },
  '&:active': {
    transform: 'translateY(0)',
  },
}));

const CardGrid = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
  gap: '12px',
  [theme.breakpoints.down('sm')]: {
    gridTemplateColumns: '1fr',
    gap: '10px',
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

// API service
const fetchFundingData = async (
  page: number,
  pageSize: number = 20,
  searchQuery?: string,
  signal?: AbortSignal
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
    signal,
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

const formatAmount = (value: any, currency?: string): string => {
  if (value === null || value === undefined || value === '') return 'Undisclosed';
  const amount = Number(value);
  if (amount === 0) return 'Undisclosed';
  return `${currency || '$'} ${(amount / 1000000).toFixed(1)}M`;
};

const formatDate = (value: any): string => {
  if (!value) return '-';
  return new Date(value).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
};

interface TableState {
  page: number;
  pageSize: number;
  searchQuery?: string;
  filters?: Record<string, any>;
  orderBy?: Array<{ field: string; direction: 'asc' | 'desc' }>;
}

const TABLE_STATE_KEY = 'bizDaily_table_state';
const DEFAULT_PAGE_SIZE = 12;

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchExpanded, setMobileSearchExpanded] = useState(false);

  // Initialize state from URL params or localStorage
  const getInitialTableState = (): TableState => {
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
        pageSize: parseInt(urlPageSize || DEFAULT_PAGE_SIZE.toString(), 10),
        searchQuery: urlSearchQuery || undefined,
        filters,
        orderBy,
      };
    }

    const savedState = localStorage.getItem(TABLE_STATE_KEY);
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        // Migrate old per-device page sizes from before the unified card grid
        if ([10, 15, 25].includes(parsed.pageSize)) {
          parsed.pageSize = DEFAULT_PAGE_SIZE;
        }
        return parsed;
      } catch (e) {
        console.warn('Failed to parse saved table state');
      }
    }

    return {
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE,
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

      const newState = {
        page: parseInt(urlPage || '1', 10),
        pageSize: parseInt(urlPageSize || DEFAULT_PAGE_SIZE.toString(), 10),
        searchQuery: urlSearchQuery || undefined,
        filters,
        orderBy,
      };

      if (JSON.stringify(newState) !== JSON.stringify(tableState)) {
        setTableState(newState);
      }
    }
  }, [searchParams, tableState]);

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
    const controller = new AbortController();
    let cancelled = false;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetchFundingData(tableState.page, tableState.pageSize, tableState.searchQuery, controller.signal);
        if (!cancelled) {
          setData(response.data);
          setTotal(response.total);
        }
      } catch (err) {
        if (cancelled || (err instanceof DOMException && err.name === 'AbortError')) return;
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      cancelled = true;
      controller.abort();
    };
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
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'background.default',
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
        <Box sx={{ p: 2, borderTop: '1px solid #e0e0e0', backgroundColor: 'background.paper' }}>
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
          maxWidth: '1400px',
          width: '100%',
          margin: '0 auto',
          [theme.breakpoints.down('md')]: { p: 1.25 },
        }}
      >
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, py: 10 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, py: 10 }}>
            <Typography color="error">Error: {error}</Typography>
          </Box>
        ) : data.length === 0 ? (
          <Box sx={{ textAlign: 'center', color: 'text.secondary', py: 10 }}>
            <Typography sx={{ fontSize: '1.1rem' }}>No funding records found.</Typography>
          </Box>
        ) : (
          <CardGrid>
            {data.map((row, index) => {
              const stageColor = getTagColor(row.funding_stage);
              const sectorColor = getTagColor(row.sector);
              return (
                <FundingCard key={row.funding_uuid || index} onClick={(event) => handleRowClick(row, event)}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1.5 }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: 'text.primary' }} noWrap>
                        {row.company_name || '-'}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                        <LocationOnOutlinedIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                        <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary' }} noWrap>
                          {row.company_location || row.funded_city || 'Location N/A'}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                      <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: 'secondary.main' }}>
                        {formatAmount(row.funding_amount, row.currency)}
                      </Typography>
                      <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary' }}>{formatDate(row.funding_date)}</Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.6, mt: 1.25, alignItems: 'center' }}>
                    {row.funding_stage && (
                      <Chip
                        label={row.funding_stage}
                        size="small"
                        sx={{ backgroundColor: stageColor.bg, color: stageColor.color, fontWeight: 600, fontSize: '0.68rem', height: '22px' }}
                      />
                    )}
                    {row.sector && (
                      <Chip
                        label={row.sector}
                        size="small"
                        sx={{ backgroundColor: sectorColor.bg, color: sectorColor.color, fontWeight: 600, fontSize: '0.68rem', height: '22px' }}
                      />
                    )}
                    <ChevronRightIcon sx={{ ml: 'auto', color: 'text.secondary', fontSize: 18 }} />
                  </Box>

                  {/* Extra detail shown only at wider breakpoints — same card, more room to use */}
                  <Box sx={{ display: { xs: 'none', md: 'block' }, mt: 1 }}>
                    {row.investor_names && (
                      <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>
                        <Box component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>
                          Investors:{' '}
                        </Box>
                        {row.investor_names.length > 90 ? `${row.investor_names.slice(0, 90)}…` : row.investor_names}
                        {row.total_investor_count ? ` (${row.total_investor_count})` : ''}
                      </Typography>
                    )}
                    {(row.sub_sector || row.funding_type) && (
                      <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', mt: 0.25 }}>
                        {row.sub_sector && `${row.sub_sector}`}
                        {row.sub_sector && row.funding_type ? ' · ' : ''}
                        {row.funding_type}
                      </Typography>
                    )}
                  </Box>

                  {row.article_url && (
                    <Box sx={{ mt: 1 }}>
                      <Link
                        href={row.article_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        sx={{ fontSize: '0.75rem', color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                      >
                        View Article
                      </Link>
                    </Box>
                  )}
                </FundingCard>
              );
            })}
          </CardGrid>
        )}

        {/* Pagination */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            py: 2,
            flexShrink: 0,
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
