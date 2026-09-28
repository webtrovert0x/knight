const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("-----------------------------------------");
  console.log("Deploying ChessGame to BOT Chain Mainnet...");
  console.log("Network:", hre.network.name);

  const [deployer] = await hre.ethers.getSigners();
  if (deployer) {
    console.log("Deploying with account:", deployer.address);
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("Account balance:", hre.ethers.formatEther(balance), "BOT");
  }

  const ChessGame = await hre.ethers.getContractFactory("contracts/ChessGame.sol:ChessGame");
  const chessGame = await ChessGame.deploy();
  await chessGame.waitForDeployment();

  const contractAddress = await chessGame.getAddress();
  const explorerUrl = `https://scan.botchain.ai/address/${contractAddress}`;

  console.log("✅ ChessGame deployed successfully to:", contractAddress);
  console.log("🔗 Explorer:", explorerUrl);

  // Sync ABI and address to frontend
  const frontendContractsDir = path.join(__dirname, "../../frontend/src/contracts");
  if (!fs.existsSync(frontendContractsDir)) {
    fs.mkdirSync(frontendContractsDir, { recursive: true });
  }

  const artifact = await hre.artifacts.readArtifact("contracts/ChessGame.sol:ChessGame");
  const contractData = {
    address: contractAddress,
    chainId: hre.network.config.chainId || 677,
    abi: artifact.abi,
  };

  fs.writeFileSync(
    path.join(frontendContractsDir, "ChessGame.json"),
    JSON.stringify(contractData, null, 2)
  );

  // Also update ChessGame.ts in frontend
  const tsContent = `// Auto-generated contract definition
export const CHESS_CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_CHESS_CONTRACT_ADDRESS || '${contractAddress}') as \`0x\${string}\`;
export const CHESS_ABI = ${JSON.stringify(artifact.abi, null, 2)} as const;
`;
  fs.writeFileSync(path.join(frontendContractsDir, "ChessGame.ts"), tsContent);

  console.log("📁 Contract artifacts synced to frontend/src/contracts/ChessGame.json and ChessGame.ts");
  console.log("-----------------------------------------");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
