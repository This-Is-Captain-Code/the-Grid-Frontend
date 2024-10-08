"use client";
import React from "react";

import { useWallet } from "@solana/wallet-adapter-react";
import dynamic from 'next/dynamic';
import { Box } from "@mui/material";

const WalletMultiButton = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then(mod => mod.WalletMultiButton),
  { ssr: false }
);


const LoginButton: React.FC = () => {
  const { connected, publicKey } = useWallet();

  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <WalletMultiButton />
    </Box>
  );
};

export default LoginButton;
