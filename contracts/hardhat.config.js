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
  networks: {
    hardhat: {},
    botchain_testnet: {
      url: "https://rpc.bohr.life",
      chainId: 968,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY.startsWith("0x") ? process.env.PRIVATE_KEY : "0x" + process.env.PRIVATE_KEY] : [],
      gasPrice: "auto",
    },
  },
};
