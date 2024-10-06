"use client";
import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, CircularProgress, Typography, Card, CardContent, CardMedia, MenuItem, Select } from '@mui/material';
import axios from 'axios';
import { useWallet } from "@solana/wallet-adapter-react";
import { Metaplex, walletAdapterIdentity } from "@metaplex-foundation/js";
import { Connection, clusterApiUrl } from "@solana/web3.js";
import LoginButton from './components/LoginButton';

const connection = new Connection(clusterApiUrl("testnet"));

const SearchPage: React.FC = () => {
  const { publicKey, wallet, connect, connected } = useWallet();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [source, setSource] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const [limit] = useState(10);

  const sources = ['sketchfab', 'thingiverse', 'smithsonian'];

  const handleSearch = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://35.154.167.42:8080/get_annotations', {
        params: {
          search: searchTerm,
          limit: limit,
          page: page,
          source: source,
        },
      });
      setResults(response.data.results);
      setTotalResults(response.data.total);
      setHasMore(response.data.hasMore);
    } catch (error) {
      console.error('Error fetching annotations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (uid: string) => {
    const downloadUrl = `http://35.154.167.42:8080/download_model/${uid}`;
    window.open(downloadUrl, '_blank');
  };

  const handleNextPage = () => {
    if (hasMore) {
      setPage((prevPage) => prevPage + 1);
    }
  };

  const handlePrevPage = () => {
    setPage((prevPage) => Math.max(prevPage - 1, 1));
  };

  const mintNFT = async (name: string, uri: string) => {
    if (!connected) {
      try {
        await connect();
      } catch (error) {
        console.error("Error connecting to wallet:", error);
        alert("Error connecting to wallet: " + error.message);
        return;
      }
    }

    if (!wallet || !publicKey) {
      alert("Wallet connection failed! Please connect your wallet.");
      return;
    }

    try {
      const metaplex = Metaplex.make(connection).use(walletAdapterIdentity(wallet));

      const { nft } = await metaplex.nfts().create({
        uri,
        name,
        sellerFeeBasisPoints: 500,  // 5% royalties
        maxSupply: 1,
        creators: [
          {
            address: publicKey,
            share: 100,
          },
        ],
      });

      console.log("NFT minted:", nft);
      alert(`NFT minted successfully! Address: ${nft.mintAddress.toBase58()}`);
    } catch (error) {
      console.error("Error minting NFT:", error);
      alert("Error minting NFT: " + error.message);
    }
  };

  useEffect(() => {
    handleSearch();
  }, [page, source]);

  return (
    <Box sx={{ backgroundColor: '#121212', minHeight: '100vh', padding: '2rem', color: 'white' }}>
      <LoginButton />
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
              <Button
                variant="contained"
                color="success"
                sx={{ mt: 2 }}
                onClick={() => mintNFT(result.name, result.thumbnail)}
                disabled={!publicKey}
              >
                Mint NFT
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

      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <Button disabled={page === 1} onClick={handlePrevPage} sx={{ mr: 2 }}>Previous</Button>
        <Typography>Page {page}</Typography>
        <Button disabled={!hasMore} onClick={handleNextPage} sx={{ ml: 2 }}>Next</Button>
      </Box>
    </Box>
  );
};

export default SearchPage;
