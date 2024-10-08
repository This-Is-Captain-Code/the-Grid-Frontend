"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Box, TextField, Button, CircularProgress, Typography, Card, CardContent, CardMedia } from '@mui/material';
import axios from 'axios';
import { useWallet } from "@solana/wallet-adapter-react";
import { Connection, clusterApiUrl } from '@solana/web3.js';
import dynamic from 'next/dynamic';
import { Orbitron } from 'next/font/google'; // Import Handjet font

// Dynamically import LoginButton to prevent SSR issues
const LoginButton = dynamic(() => import('./components/LoginButton'), { ssr: false });

// Set up connection
const connection = new Connection(clusterApiUrl('devnet'));
const backgroundVideoUrl = 'https://res.cloudinary.com/ddrzwupca/video/upload/v1728355014/pxj2os0lc1ci7l32ado8.mp4';

// Load the Handjet font
const handjet = Orbitron({ subsets: ['latin'] });

// Helper function to truncate text to a specific number of words
const truncateDescription = (description: string, maxWords: number) => {
  return description.split(' ').slice(0, maxWords).join(' ') + (description.split(' ').length > maxWords ? '...' : '');
};

const Page: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1); // Pagination state
  const [source, setSource] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const [limit] = useState(10);
  const [isSearching, setIsSearching] = useState(false);

  const { publicKey, signTransaction } = useWallet();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Dynamic label for the search bar
  const sentences = [
    "Search 3D Models",
    "Find Your Perfect Model",
    "Explore the World of 3D"
  ];
  const typingSpeed = 100; // Speed in milliseconds
  const pauseDuration = 2000; // Pause between sentences in milliseconds
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');

  // Typing animation effect
  useEffect(() => {
    let typingTimeout: NodeJS.Timeout;
    let pauseTimeout: NodeJS.Timeout;

    const currentSentence = sentences[currentSentenceIndex];
    let index = 0;

    const typeSentence = () => {
      if (index < currentSentence.length) {
        setDisplayedText(currentSentence.slice(0, index + 1)); // Set displayedText directly
        index++;
        typingTimeout = setTimeout(typeSentence, typingSpeed);
      } else {
        // Pause before starting the next sentence
        pauseTimeout = setTimeout(() => {
          setCurrentSentenceIndex((prev) => (prev + 1) % sentences.length);
          setDisplayedText(''); // Clear the text for the next typing
        }, pauseDuration);
      }
    };

    typeSentence();

    return () => {
      clearTimeout(typingTimeout);
      clearTimeout(pauseTimeout);
    };
  }, [currentSentenceIndex]);

  // Fetch data
  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    setLoading(true);
    setIsSearching(true);
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://35.154.167.42:8080'}/get_annotations`, {
        params: {
          search: searchTerm,
          limit: limit,
          page: currentPage,
          source: source
        }
      });
      setResults(response.data.results);
      setHasMore(response.data.hasMore);
    } catch (error) {
      console.error('Error fetching annotations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSearching) {
      handleSearch();
    }
  }, [currentPage, source]);

  // Handler for next page
  const handleNextPage = () => {
    setCurrentPage((prevPage) => prevPage + 1);
  };

  // Handler for previous page
  const handlePreviousPage = () => {
    setCurrentPage((prevPage) => Math.max(prevPage - 1, 1)); // Prevent negative pages
  };

  return (
    <Box sx={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        style={{
          position: 'fixed',
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          top: 0,
          left: 0,
          zIndex: -1,
        }}
        src={backgroundVideoUrl}
      />

      {/* Overlay */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 0,
        }}
      />

      {/* Login Button at Top Right */}
      <Box sx={{ position: 'absolute', top: 20, right: 20, zIndex: 1 }}>
        <LoginButton />
      </Box>

      {/* Main Content */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: isSearching ? 'flex-start' : 'center',
          minHeight: '100vh',
          paddingTop: isSearching ? '4rem' : '0',
          transition: 'padding-top 0.5s ease',
        }}
      >
        <Typography
          variant="h2"
          className={handjet.className}
          sx={{
            position: isSearching ? 'absolute' : 'relative',
            top: isSearching ? 20 : 'auto',
            left: isSearching ? 20 : 'auto',
            color: 'white',
            transition: 'all 0.5s ease',
            mb: isSearching ? 2 : 0,
          }}
        >
          GRID
        </Typography>

        {/* Search Bar */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: 'center',
            mb: isSearching ? 4 : 0,
            transform: isSearching ? 'translateY(-50px)' : 'translateY(0)',
            transition: 'transform 0.5s ease, margin-bottom 0.5s ease',
            width: '80%',
            maxWidth: '600px',
          }}
        >
          <TextField
            inputRef={searchInputRef}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            label={displayedText}
            variant="outlined"
            fullWidth
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '4px',
              border: '2px solid #FFFFFF',
              boxShadow: '0 0 10px #FFFFFF',
              transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
              '&:focus-within': {
                borderColor: '#00FF00',
                boxShadow: '0 0 20px #00FF00',
              },
              mr: { sm: 2 },
              mb: { xs: 2, sm: 0 },
            }}
          />
          <Button
            variant="contained"
            color="primary"
            className={handjet.className}
            onClick={handleSearch}
            sx={{
              height: '56px',
              width: { xs: '100%', sm: 'auto' },
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              border: '2px solid #00FF00',
              boxShadow: '0 0 10px #00FF00',
              transition: 'background-color 0.3s ease, box-shadow 0.3s ease',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                boxShadow: '0 0 20px #00FF00',
              },
            }}
          >
            Search
          </Button>
        </Box>

        {/* Loading spinner */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Search results */}
        {isSearching && !loading && results.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', padding: '0 2rem' }}>
          {results.map((result, index) => (
            <Card
              key={index}
              sx={{
                backgroundColor: '#1e1e1e',
                color: 'white',
                width: { xs: '100%', sm: '45%', md: '23%' }, // Adjust width to ensure 4 cards per row
                margin: 1,
                borderRadius: '10px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
                transition: 'transform 0.3s, box-shadow 0.3s',
                '&:hover': {
                  transform: 'scale(1.05)', // Slightly enlarge on hover
                  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.7)',
                },
              }}
            >
              {result.thumbnail && (
                <CardMedia
                  component="img"
                  image={result.thumbnail}
                  alt={result.name}
                  sx={{ height: 200, borderTopLeftRadius: '10px', borderTopRightRadius: '10px' }} // Rounded corners
                />
              )}
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" gutterBottom>
                  {result.name}
                </Typography>
                <Typography variant="body2" sx={{ color: '#aaaaaa', mb: 2 }}>
                  {truncateDescription(result.description || "No description available.", 7)} {/* Truncate to 10 words */}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Button
                    variant="contained"
                    color="secondary"
                    href={result.viewerUrl}
                    target="_blank"
                    sx={{
                      backgroundColor: '#00FF00',
                      '&:hover': {
                        backgroundColor: '#00CC00', // Lighter green on hover
                      },
                    }}
                  >
                    View Model
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => handleDownload(result.uid)}
                    sx={{
                      backgroundColor: '#00FF00',
                      '&:hover': {
                        backgroundColor: '#00CC00', // Lighter green on hover
                      },
                    }}
                  >
                    Download
                  </Button>
                </Box>
              </CardContent>
              <Box sx={{ p: 2 }}>
                <Button
                  variant="contained"
                  color="secondary"
                  fullWidth
                  onClick={() => handleMintNFT(result.uid)}
                  sx={{
                    backgroundColor: '#00FF00',
                    '&:hover': {
                      backgroundColor: '#00CC00', // Lighter green on hover
                    },
                  }}
                >
                  Mint as NFT
                </Button>
              </Box>
            </Card>
          ))}
        </Box>
        
        
        )}

        {/* Pagination Buttons */}
        {results.length > 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Button
              variant="contained"
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              sx={{
                mr: 2,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                border: '2px solid #00FF00',
                '&:disabled': {
                  borderColor: 'gray',
                },
              }}
            >
              Previous
            </Button>
            <Button
              variant="contained"
              onClick={handleNextPage}
              disabled={!hasMore}
              sx={{
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                border: '2px solid #00FF00',
                '&:disabled': {
                  borderColor: 'gray',
                },
              }}
            >
              Next
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default Page;
