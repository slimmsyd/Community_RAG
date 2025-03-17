const { WalletUtils } = require('../lib/arweave/walletUtils');
const { masterWallet } = require('../lib/arweave/masterWallet');
const fs = require('fs');
const path = require('path');

async function testWallet() {
    try {
        console.log('🔍 Testing Arweave wallet configuration...\n');

        // Initialize master wallet
        await masterWallet.initializeWallet();
        const state = await masterWallet.getWalletState();

        console.log('Wallet Status:');
        console.log('📝 Address:', state.address);
        console.log('💰 Balance:', state.balance, 'AR');
        console.log('🕒 Last Checked:', state.lastChecked);

        if (parseFloat(state.balance) === 0) {
            console.log('\n⚠️  Warning: Wallet has 0 balance');
            console.log('Please fund your wallet using the Arweave faucet:');
            console.log('https://faucet.arweave.net/');
        } else {
            console.log('\n✅ Wallet is configured and funded!');
        }

    } catch (error) {
        console.error('\n❌ Wallet test failed:', error);
        process.exit(1);
    }
}

testWallet(); 