"use client";
import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, CircularProgress, Typography, Card, CardContent, CardMedia, MenuItem, Select } from '@mui/material';
import axios from 'axios';

const SearchPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);  // Pagination state
  const [totalResults, setTotalResults] = useState(0);  // Total results count
  const [source, setSource] = useState('');  // Source filter
  const [hasMore, setHasMore] = useState(true);

  const sources = ['sketchfab', 'thingiverse', 'smithsonian'];  // Available sources

  const handleSearch = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://13.233.194.68:8080/get_annotations', {
        params: {
          search: searchTerm,
          limit: 10,  // Limit the results per page
          page: page,  // Use the current page for pagination
          source: source  // Pass selected source as a filter
        }
      });
      setResults(response.data.results);  // Set the results
      setTotalResults(response.data.total);  // Total count
      setHasMore(response.data.hasMore);  // If more pages exist
    } catch (error) {
      console.error('Error fetching annotations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (uid: string) => {
    const downloadUrl = `http://13.233.194.68:8080/download_model/${uid}`;
    window.open(downloadUrl, '_blank');
  };

  const handleNextPage = () => {
    setPage((prevPage) => prevPage + 1);
  };

  const handlePrevPage = () => {
    setPage((prevPage) => Math.max(prevPage - 1, 1));
  };

  useEffect(() => {
    handleSearch();  // Fetch results when page or source changes
  }, [page, source]);

  return (
    <Box sx={{ backgroundColor: '#121212', minHeight: '100vh', padding: '2rem', color: 'white' }}>
      <Typography variant="h4" sx={{ mb: 3, textAlign: 'center' }}>Search 3D Models</Typography>

      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
        <TextField
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          label="Search models"
          variant="outlined"
          sx={{ backgroundColor: '#fff', borderRadius: '4px', width: '60%' }}
        />
        <Button variant="contained" color="primary" sx={{ ml: 2 }} onClick={handleSearch}>
          Search
        </Button>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
        <Select
          value={source}
          onChange={(e) => setSource(e.target.value)}
          displayEmpty
          sx={{ backgroundColor: '#fff', borderRadius: '4px' }}
        >
          <MenuItem value="">All Sources</MenuItem>
          {sources.map((src) => (
            <MenuItem key={src} value={src}>{src}</MenuItem>
          ))}
        </Select>
      </Box>

      {loading && <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>}

      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', mt: 4 }}>
        {results.map((result, index) => (
          <Card key={index} sx={{ backgroundColor: '#1e1e1e', width: '80%', color: 'white', display: 'flex', alignItems: 'center' }}>
            {result.thumbnail && (
              <CardMedia
                component="img"
                image={result.thumbnail}
                alt={result.name}
                sx={{ width: 150, height: 150 }}
              />
            )}
            <CardContent>
              <Typography variant="h6">{result.name}</Typography>
              <Typography variant="body2" sx={{ color: '#aaaaaa' }}>
                {result.description || "No description available."}
              </Typography>
              <Button
                variant="contained"
                color="secondary"
                sx={{ mt: 2, mr: 2 }}
                href={result.viewerUrl}
                target="_blank"
              >
                View Model
              </Button>
              <Button
                variant="contained"
                color="primary"
                sx={{ mt: 2 }}
                onClick={() => handleDownload(result.uid)}
              >
                Download Model
              </Button>
            </CardContent>
          </Card>
        ))}
      </Box>

      {!loading && results.length === 0 && (
        <Typography variant="h6" sx={{ textAlign: 'center', mt: 4 }}>
          No models found. Try a different search term.
        </Typography>
      )}

      {/* Pagination Controls */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <Button disabled={page === 1} onClick={handlePrevPage} sx={{ mr: 2 }}>Previous</Button>
        <Typography>Page {page}</Typography>
        <Button disabled={!hasMore} onClick={handleNextPage} sx={{ ml: 2 }}>Next</Button>
      </Box>
    </Box>
  );
};

export default SearchPage;
