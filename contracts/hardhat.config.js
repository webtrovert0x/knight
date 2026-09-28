const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");

// Try loading .env from contracts/, frontend/.env.local, and root
[
  path.resolve(__dirname, ".env"),
  path.resolve(__dirname, "../frontend/.env.local"),
  path.resolve(__dirname, "../frontend/.env"),
  path.resolve(__dirname, "../.env"),
].forEach((envPath) => {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
});

require("@nomicfoundation/hardhat-ethers");
require("@nomicfoundation/hardhat-chai-matchers");
require("@nomicfoundation/hardhat-verify");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  defaultNetwork: "botchain_mainnet",
  networks: {
    hardhat: {},
    botchain_mainnet: {
      url: "https://rpc.botchain.ai",
      chainId: 677,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY.startsWith("0x") ? process.env.PRIVATE_KEY : "0x" + process.env.PRIVATE_KEY] : [],
      gasPrice: "auto",
    },
  },
  etherscan: {
    apiKey: {
      botchain_mainnet: "abc",
    },
    customChains: [
      {
        network: "botchain_mainnet",
        chainId: 677,
        urls: {
          apiURL: "https://scan.botchain.ai/api",
          browserURL: "https://scan.botchain.ai",
        },
      },
    ],
  },
  sourcify: {
    enabled: false,
  },
};

