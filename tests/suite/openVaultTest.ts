import * as anchor from "@coral-xyz/anchor";
import { createMint, getAssociatedTokenAddress, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { Program } from "@coral-xyz/anchor";

import { PublicKey } from "@solana/web3.js";
import { assert, expect } from "chai";
import { LuckyTrading } from "../../target/types/lucky_trading";

export const openVaultTest = async function ({ owner, agent }: { owner: anchor.Wallet; agent: anchor.Wallet }) {
    const program = anchor.workspace.LuckyTrading as Program<LuckyTrading>;
    const provider = anchor.AnchorProvider.env();
    let collateral: PublicKey;
    const new_agent = new anchor.Wallet(anchor.web3.Keypair.generate());
    return describe("open vault tests", function () {
        before("Initialize collateral", async function () {
            collateral = await createMint(
                provider.connection,
                {
                    publicKey: owner.payer.publicKey,
                    secretKey: owner.payer.secretKey,
                },
                owner.payer.publicKey,
                owner.payer.publicKey,
                6
            );
        });
        it("can open vault", async function () {
            let [vaultPda] = PublicKey.findProgramAddressSync(
                [Buffer.from("vault"), new_agent.publicKey.toBuffer()],
                program.programId
            );

            let vaultCollateralATA = await getAssociatedTokenAddress(collateral, vaultPda, true);
            let agentCollateralATA = await getAssociatedTokenAddress(collateral, new_agent.publicKey);
            await program.methods
                .openVault()
                .accounts({
                    authority: owner.publicKey,
                    collateral: collateral,
                    agent: new_agent.publicKey,
                    vault: vaultPda,
                    vaultCollateral: vaultCollateralATA,
                    agentCollateral: agentCollateralATA,
                    token2022Program: TOKEN_2022_PROGRAM_ID,
                })
                .signers([owner.payer])
                .rpc();
            const vault = await program.account.vault.fetch(vaultPda);

            expect(vault.authority).to.eql(owner.publicKey);

            await program.methods
                .closeVault(new_agent.publicKey)
                .accounts({
                    authority: owner.publicKey,
                    collateral: collateral,
                    vault: vaultPda,
                })
                .signers([owner.payer])
                .rpc();
        });
    });
};
