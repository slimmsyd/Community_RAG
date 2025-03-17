import { WalletUtils } from '../lib/arweave/walletUtils';
import * as fs from 'fs';
import * as path from 'path';

async function generateWallet() {
    try {
        console.log('Generating Arweave wallet...');
        const wallet = await WalletUtils.generateWallet();
        
        // Create the wallets directory if it doesn't exist
        const walletDir = path.join(process.cwd(), 'wallets');
        if (!fs.existsSync(walletDir)) {
            fs.mkdirSync(walletDir);
        }

        // Save the wallet key
        const walletPath = path.join(walletDir, 'master-wallet.json');
        fs.writeFileSync(walletPath, JSON.stringify(wallet.key, null, 2));

        console.log('✅ Wallet generated successfully!');
        console.log('📝 Wallet Address:', wallet.address);
        console.log('💾 Wallet saved to:', walletPath);
        console.log('\n⚠️  IMPORTANT: Keep your wallet file secure and never commit it to git!');
        
        // Create a .gitignore entry
        const gitignorePath = path.join(process.cwd(), '.gitignore');
        fs.appendFileSync(gitignorePath, '\n# Arweave Wallets\nwallets/\n');

    } catch (error) {
        console.error('❌ Failed to generate wallet:', error);
        process.exit(1);
    }
}

generateWallet(); 