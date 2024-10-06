"use client"; 
import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, CircularProgress, Typography, Card, CardContent, CardMedia, MenuItem, Select } from '@mui/material';
import axios from 'axios';
import { useWallet } from "@solana/wallet-adapter-react";  // Solana Wallet Adapter
import { Metaplex, walletAdapterIdentity } from '@metaplex-foundation/js';  // New Metaplex SDK Core implementation
import { Connection, clusterApiUrl } from '@solana/web3.js';  // Solana Web3.js
import LoginButton from './components/LoginButton';  // Your existing login button component

// Setup Solana connection (change to 'devnet' or 'testnet' for testing)
const connection = new Connection(clusterApiUrl('devnet'));

const SearchPage: React.FC = () => {
  // State for search, results, and pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);  // Pagination state
  const [totalResults, setTotalResults] = useState(0);  // Total results count
  const [source, setSource] = useState('');  // Source filter
  const [hasMore, setHasMore] = useState(true);  // Track if more results exist
  const [limit] = useState(10);  // Fixed limit for results per page

  // Wallet adapter to interact with Solana
  const { publicKey, signTransaction } = useWallet();

  // Available 3D model sources
  const sources = ['sketchfab', 'thingiverse', 'smithsonian'];

  // Function to handle search based on searchTerm, source, and pagination
  const handleSearch = async () => {
    setLoading(true);  // Show loading spinner
    try {
      const response = await axios.get('http://35.154.167.42:8080/get_annotations', {
        params: {
          search: searchTerm,
          limit: limit,
          page: page,
          source: source
        }
      });
      // Set results, total results, and check if there are more pages
      setResults(response.data.results);
      setTotalResults(response.data.total);
      setHasMore(response.data.hasMore);
    } catch (error) {
      console.error('Error fetching annotations:', error);
    } finally {
      setLoading(false);  // Hide loading spinner
    }
  };

  // Function to handle downloading a 3D model by UID
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

  // Run search whenever the page or source changes
  useEffect(() => {
    handleSearch();
  }, [page, source]);

  return (
    <Box sx={{ backgroundColor: '#121212', minHeight: '100vh', padding: '2rem', color: 'white' }}>
      <LoginButton />  {/* Show login button to connect the wallet */}
      <Typography variant="h4" sx={{ mb: 3, textAlign: 'center' }}>Search 3D Models</Typography>

      {/* Search and source selection */}
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

      {/* Loading spinner */}
      {loading && <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>}

      {/* Search results */}
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
                sx={{ mt: 2, mr: 2 }}
                onClick={() => handleDownload(result.uid)}
              >
                Download Model
              </Button>
              <Button
                variant="contained"
                color="secondary"
                sx={{ mt: 2 }}
                onClick={() => handleMintNFT(result.uid)}  // Mint NFT button
              >
                Mint as NFT
              </Button>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* No results message */}
      {!loading && results.length === 0 && (
        <Typography variant="h6" sx={{ textAlign: 'center', mt: 4 }}>
          No models found. Try a different search term.
        </Typography>
      )}

      {/* Pagination controls */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <Button disabled={page === 1} onClick={() => setPage((prev) => Math.max(prev - 1, 1))} sx={{ mr: 2 }}>Previous</Button>
        <Typography>Page {page}</Typography>
        <Button disabled={!hasMore} onClick={() => setPage((prev) => prev + 1)} sx={{ ml: 2 }}>Next</Button>
      </Box>
    </Box>
  );
};

export default SearchPage;
