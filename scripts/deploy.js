// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

async function main() {
    const USDC = await hre.ethers.getContractFactory("USDC");
    const usdc = await USDC.deploy("100000000000000000000000");

    await usdc.deployed();

    console.log("USDC deployed to:", usdc.address);
    let owner = "0x889C9983762ddbDCaA08e8E3d9cC975E14c2a8eB"; 
    const INRC = await hre.ethers.getContractFactory("INRC");
    const inrc = await INRC.deploy("INRC", "INR", usdc.address, owner);

    await inrc.deployed();

    console.log("INRC deployed to:", inrc.address);
    let exchange = await inrc.exe();
    console.log("Exchange deployed to:", exchange);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
