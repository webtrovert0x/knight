const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("-----------------------------------------");
  console.log("Deploying ChessGame to BOT Chain Testnet...");
  console.log("Network:", hre.network.name);

  const [deployer] = await hre.ethers.getSigners();
  if (deployer) {
    console.log("Deploying with account:", deployer.address);
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("Account balance:", hre.ethers.formatEther(balance), "BOT");
  }

  const ChessGame = await hre.ethers.getContractFactory("ChessGame");
  const chessGame = await ChessGame.deploy();
  await chessGame.waitForDeployment();

  const contractAddress = await chessGame.getAddress();
  console.log("✅ ChessGame deployed successfully to:", contractAddress);
  console.log("🔗 Explorer: https://scan.bohr.life/address/" + contractAddress);

  // Sync ABI and address to frontend
  const frontendContractsDir = path.join(__dirname, "../../frontend/src/contracts");
  if (!fs.existsSync(frontendContractsDir)) {
    fs.mkdirSync(frontendContractsDir, { recursive: true });
  }

  const artifact = await hre.artifacts.readArtifact("ChessGame");
  const contractData = {
    address: contractAddress,
    chainId: hre.network.config.chainId || 968,
    abi: artifact.abi,
  };

  fs.writeFileSync(
    path.join(frontendContractsDir, "ChessGame.json"),
    JSON.stringify(contractData, null, 2)
  );

  console.log("📁 Contract artifacts synced to frontend/src/contracts/ChessGame.json");
  console.log("-----------------------------------------");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
