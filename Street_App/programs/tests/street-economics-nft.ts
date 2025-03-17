import * as anchor from "@project-serum/anchor";
import { Program, web3 } from "@project-serum/anchor";
import { StreetEconomicsNft } from "../target/types/street_economics_nft";
import { createMetadataAccountV3 } from '@metaplex-foundation/mpl-token-metadata';
import { PublicKey } from '@solana/web3.js';

describe("street-economics-nft", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.street_economics_nft as Program<StreetEconomicsNft>;
  const wallet = provider.wallet as anchor.Wallet;

  it("Initialize Collection", async () => {
    const [collectionMint] = await PublicKey.findProgramAddress(
      [Buffer.from("mint")],
      program.programId
    );

    await program.methods
      .initializeCollection("Test Collection", "TEST", "https://example.com")
      .accounts({
        metadata: web3.PublicKey.default,
        masterEdition: web3.PublicKey.default,
        collectionMint: collectionMint,
        mintAuthority: wallet.publicKey,
        payer: wallet.publicKey,
        tokenMetadataProgram: new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"),
      })
      .rpc();
  });

  it("Mints an NFT!", async () => {
    const mint = anchor.web3.Keypair.generate();
    const [collectionMint] = await PublicKey.findProgramAddress(
      [Buffer.from("mint")],
      program.programId
    );

    await program.methods
      .mintNft("Test NFT", "TEST", "https://example.com/nft.json")
      .accounts({
        metadata: web3.PublicKey.default,
        mint: mint.publicKey,
        collectionMint: collectionMint,
        mintAuthority: wallet.publicKey,
        payer: wallet.publicKey,
        tokenMetadataProgram: new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"),
      })
      .signers([mint])
      .rpc();
  });
}); 