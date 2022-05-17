const { expect } = require('chai');
const { ethers } = require('hardhat');

describe("Store contract", function () {
    let Token;
    let hardhatToken;
    let owner;
    let addr1;
    let provider;

    beforeEach(async function () {
        Token = await ethers.getContractFactory("Store");
        [owner, addr1] = await ethers.getSigners();

        hardhatToken = await Token.deploy();

        provider = await ethers.provider; // Hardhat Network (local)
    })

    describe("Claim tokens", function () {
        it("Should mint an amount of tokens and give them to the contract's owner", async function () {
            const initialSupply = 10_000_000;

            await hardhatToken.mint(owner.address, initialSupply);
            
            expect(await hardhatToken.balanceOf(owner.address)).to.equal(initialSupply);
        });

        it("Should deposit ethers to contract account", async function () {
            const transaction_value = await ethers.utils.parseEther("8.0"); // transaction_value = 8 ETH
            const options = await {value: transaction_value};
            const amount = await ethers.utils.parseEther("4.0"); // amount_of_ETH_used_for_buying_token = 4 ETH

            const etherOfContractBeforeDepositing = await provider.getBalance(hardhatToken.address);

            await hardhatToken.connect(addr1).depositETH(amount, options);

            expect(await provider.getBalance(hardhatToken.address)).to.equal(etherOfContractBeforeDepositing.add(amount).add(await hardhatToken.getAppFee()));

            const w = ethers.utils.parseEther("1.0");
            const expectedValueOutput = await amount.div(w).mul(ethers.BigNumber.from(await hardhatToken.getSwapRate())); // expectedValueOutput =  amount / (10**18) * rate
            const buyerInfor = await hardhatToken.connect(addr1).getBuyerInformation();

            expect(buyerInfor.valueOutput).to.equal(expectedValueOutput); // amount / (10**18) * rate
        });

        it("Should allow accounts which deposited ETH to spend (receive) tokens of (from) the contract", async function() {
            // ---------------
            // Deposit ETH
            const transaction_value = await ethers.utils.parseEther("8.0"); // transaction_value = 8 ETH
            const options = await {value: transaction_value};
            const amount = await ethers.utils.parseEther("4.0"); // amount_of_ETH_used_for_buying_token = 4 ETH

            await hardhatToken.connect(addr1).depositETH(amount, options);

            // ---------------
            // Set allownance
            const buyerInfor = await hardhatToken.connect(addr1).getBuyerInformation();
            await hardhatToken.increaseAllowance(addr1.address, buyerInfor.valueOutput);

            expect(await hardhatToken.allowance(owner.address, addr1.address)).to.equal(buyerInfor.valueOutput);
        });

        it("Should transfer tokens to account that has already deposited ETH and wants to claim tokens", async function () {
            // ---------------
            // Mint tokens
            const initialSupply = 10_000_000;

            await hardhatToken.mint(owner.address, initialSupply);

            // ---------------
            // Deposit ETH
            const transaction_value = await ethers.utils.parseEther("8.0"); // transaction_value = 8 ETH
            const options = await {value: transaction_value};
            const amount = await ethers.utils.parseEther("4.0"); // amount_of_ETH_used_for_buying_token = 4 ETH

            await hardhatToken.connect(addr1).depositETH(amount, options);

            // ---------------
            // Set allownance
            const buyerInfor = await hardhatToken.connect(addr1).getBuyerInformation();
            await hardhatToken.increaseAllowance(addr1.address, buyerInfor.valueOutput);
            
            // ---------------
            // Claim tokens
            const aLittleMoreMiliSecond = 50;
            const waitTime = (await hardhatToken.getSpaceTimeClaim()) * 1000 + aLittleMoreMiliSecond; // wait a few seconds
            await new Promise(resolve => setTimeout(resolve, waitTime)); // https://stackoverflow.com/questions/33289726/combination-of-async-function-await-settimeout
            await hardhatToken.connect(addr1).claimToken();

            expect(await hardhatToken.balanceOf(addr1.address)).to.equal(buyerInfor.valueOutput);
        });

    })
})