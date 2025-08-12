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
  styled
} from '@mui/material';

// Styled components
const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: '#ffffff',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  borderBottom: '1px solid #e0e0e0',
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
}));

const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  maxHeight: 'calc(100vh - 200px)', // Leave space for navbar and pagination
  overflow: 'auto',
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 600,
  backgroundColor: '#f5f5f5',
  borderBottom: '2px solid #e0e0e0',
  whiteSpace: 'nowrap',
  minWidth: '120px',
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(even)': {
    backgroundColor: '#fafafa',
  },
  '&:hover': {
    backgroundColor: '#f0f0f0',
    cursor: 'pointer',
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
const fetchFundingData = async (page: number, pageSize: number = 10): Promise<ApiResponse> => {
  const response = await fetch('http://localhost:8000/api/funding/funding/filter', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      page: page - 1, // API uses 0-based indexing
      page_size: pageSize,
    }),
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
  filters?: Record<string, any>;
  orderBy?: Array<{ field: string; direction: 'asc' | 'desc' }>;
}

// Local storage key for state persistence
const TABLE_STATE_KEY = 'bizDaily_table_state';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Initialize state from URL params or localStorage
  const getInitialTableState = (): TableState => {
    // First try URL parameters
    const urlPage = searchParams.get('page');
    const urlPageSize = searchParams.get('pageSize');
    const urlFilters = searchParams.get('filters');
    const urlOrderBy = searchParams.get('orderBy');
    
    if (urlPage) {
      let filters = {};
      let orderBy: Array<{ field: string; direction: 'asc' | 'desc' }> = [];
      
      try {
        if (urlFilters) filters = JSON.parse(urlFilters);
        if (urlOrderBy) orderBy = JSON.parse(urlOrderBy);
      } catch (e) {
        console.warn('Failed to parse URL parameters');
      }
      
      return {
        page: parseInt(urlPage, 10) || 1,
        pageSize: parseInt(urlPageSize || '10', 10),
        filters,
        orderBy
      };
    }
    
    // Fallback to localStorage
    const savedState = localStorage.getItem(TABLE_STATE_KEY);
    if (savedState) {
      try {
        return JSON.parse(savedState);
      } catch (e) {
        console.warn('Failed to parse saved table state');
      }
    }
    
    // Default state
    return {
      page: 1,
      pageSize: 10,
      filters: {},
      orderBy: []
    };
  };

  const [tableState, setTableState] = useState<TableState>(getInitialTableState);
  const [data, setData] = useState<FundingData[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Update state when URL changes (browser back/forward)
  useEffect(() => {
    const newState = getInitialTableState();
    if (JSON.stringify(newState) !== JSON.stringify(tableState)) {
      setTableState(newState);
    }
  }, [searchParams]);
  
  // Update URL and localStorage when table state changes
  const updateTableState = (newState: Partial<TableState>) => {
    const updatedState = { ...tableState, ...newState };
    setTableState(updatedState);
    
    // Update URL parameters
    const newSearchParams = new URLSearchParams();
    newSearchParams.set('page', updatedState.page.toString());
    newSearchParams.set('pageSize', updatedState.pageSize.toString());
    
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

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetchFundingData(tableState.page, tableState.pageSize);
        setData(response.data);
        setTotal(response.total);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [tableState.page, tableState.pageSize, tableState.filters, tableState.orderBy]);
  
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
      overflow: 'hidden'
    }}>
      {/* Top Navbar */}
      <StyledAppBar position="static">
        <Toolbar>
          <DailyBriefButton onClick={() => navigate('/daily-brief')}>
            Daily Brief
          </DailyBriefButton>
        </Toolbar>
      </StyledAppBar>
      
      {/* Main Content Area */}
      <Box sx={{ 
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        p: 3,
        overflow: 'hidden'
      }}>
        {/* Table Container */}
        <Paper sx={{ borderRadius: '12px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', border: '1px solid #e0e0e0' }}>
          <StyledTableContainer sx={{ flex: 1, mb: 2 }}>
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
                            minWidth: '120px'
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
          py: 2
        }}>
          <Pagination 
            count={totalPages}
            page={tableState.page}
            onChange={handlePageChange}
            color="primary"
            size="large"
            showFirstButton
            showLastButton
            disabled={loading}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default Home;