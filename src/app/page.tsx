"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Box, TextField, Button, CircularProgress, Typography, Card, CardContent, CardMedia } from '@mui/material';
import axios from 'axios';
import { useWallet } from "@solana/wallet-adapter-react";
import { Metaplex, walletAdapterIdentity } from '@metaplex-foundation/js';  // New Metaplex SDK Core implementation
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

  const handleDownload = (uid: string) => {
    const downloadUrl = `http://35.154.167.42:8080/download_model/${uid}`;
    window.open(downloadUrl, '_blank');
  };

  // Mint NFT using Metaplex Core
  const mintNFT = async (metadata: any) => {
    if (!publicKey) {
      alert("Please connect your wallet to mint an NFT");
      return;
    }

    try {
      // Initialize Metaplex SDK with wallet identity
      const metaplex = Metaplex.make(connection).use(walletAdapterIdentity({ publicKey, signTransaction }));

      // Create the NFT using Core standard
      const { nft } = await metaplex.nfts().create({
        uri: metadata.download_link,  // The download URL for the 3D model
        name: metadata.name,
        sellerFeeBasisPoints: 500,  // 5% royalties
        creators: [{ address: publicKey, share: 100 }],  // Creator is the wallet owner
        image: metadata.image,  // Thumbnail image URL
        description: metadata.description  // Model description
      });

      console.log('NFT Minted:', nft);
      return nft;
    } catch (error) {
      console.error('Error minting NFT:', error);
      throw error;
    }
  };

  // Handle NFT minting on the frontend
  const handleMintNFT = async (uid: string) => {
    if (!publicKey) {
      alert("Please connect your wallet to mint an NFT");
      return;
    }

    try {
      // Fetch metadata for the 3D model from the backend
      const response = await axios.post('http://35.154.167.42:8080/mint_nft', {
        uid: uid,
        wallet: publicKey.toBase58()  // User's wallet public address
      });

      const { metadata } = response.data;
      console.log('Metadata for NFT:', metadata);

      // Call mintNFT function to mint the NFT
      const mintedNFT = await mintNFT(metadata);
      console.log('Successfully minted NFT:', mintedNFT);
    } catch (error) {
      console.error('Error during minting process:', error);
    }
  };



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
              backgroundColor: 'rgba(255, 255, 255, 1)',
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
                backgroundColor: 'rgba(23, 23, 23, 0.7)', // Match background color
                color: 'white',
                width: { xs: '100%', sm: '45%', md: '23%' },
                margin: 1,
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.2)', // Match border style
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
                transition: 'transform 0.3s, box-shadow 0.3s',
                '&:hover': {
                  transform: 'scale(1.05)',
                  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.7)',
                },
              }}
            >
              {result.thumbnail && (
                <CardMedia
                  component="img"
                  image={result.thumbnail}
                  alt={result.name}
                  sx={{ height: 200, borderTopLeftRadius: '10px', borderTopRightRadius: '10px' }}
                />
              )}
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" gutterBottom>
                  {result.name}
                </Typography>
                <Typography variant="body2" sx={{ color: '#aaaaaa', mb: 2 }}>
                  {truncateDescription(result.description || "No description available.", 7)}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                  <Button
                    variant="contained"
                    color="secondary"
                    href={result.viewerUrl}
                    target="_blank"
                    sx={{
                      backgroundColor: 'rgba(23, 23, 23, 0.7)', // Match button color
                      '&:hover': {
                        backgroundColor: 'rgba(0, 204, 0, 0.7)',
                        boxShadow: '0 0 10px rgba(0, 255, 0, 0.8)', // Glowing effect on hover
                      },
                      border: '1px solid rgba(255, 255, 255, 0.2)', // Match border
                      transition: 'box-shadow 0.3s ease',
                    }}
                  >
                    View Model
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => handleDownload(result.uid)}
                    sx={{
                      backgroundColor: 'rgba(23, 23, 23, 0.7)', // Match button color
                      '&:hover': {
                        backgroundColor: 'rgba(0, 204, 0, 0.7)',
                        boxShadow: '0 0 10px rgba(0, 255, 0, 0.8)', // Glowing effect on hover
                      },
                      border: '1px solid rgba(255, 255, 255, 0.2)', // Match border
                      transition: 'box-shadow 0.3s ease',
                    }}
                  >
                    Download
                  </Button>
                </Box>
              </CardContent>
              <Box sx={{ p: 2, mt: 0 }}>
                <Button
                  variant="contained"
                  color="secondary"
                  fullWidth
                  onClick={() => handleMintNFT(result.uid)}
                  sx={{
                    backgroundColor: 'rgba(23, 23, 23, 0.7)', // Match button color
                    '&:hover': {
                      backgroundColor: 'rgba(0, 204, 0, 0.7)',
                      boxShadow: '0 0 10px rgba(0, 255, 0, 0.8)', // Glowing effect on hover
                    },
                    border: '1px solid rgba(255, 255, 255, 0.2)', // Match border
                    transition: 'box-shadow 0.3s ease',
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
