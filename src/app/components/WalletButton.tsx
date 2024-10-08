// Rename file from LoginButton.tsx to WalletButton.tsx
"use client";
import React from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Box, Typography } from "@mui/material";

const WalletButton: React.FC = () => {
  const { connected, publicKey } = useWallet();

  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <WalletMultiButton />
      {connected && publicKey && (
        <Typography variant="h6" sx={{ mt: 2 }}>
          Connected: {publicKey.toBase58()}
        </Typography>
      )}
    </Box>
  );
};

export default WalletButton;
