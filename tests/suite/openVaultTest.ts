import * as anchor from "@coral-xyz/anchor";
import { createMint } from "@solana/spl-token";
import { Program } from "@coral-xyz/anchor";

import { PublicKey } from "@solana/web3.js";
import { assert, expect } from "chai";
import { LuckyTrading } from "../../target/types/lucky_trading";
export const openVaultTest = async function ({ owner, agent }: { owner: anchor.Wallet; agent: anchor.Wallet }) {
    const program = anchor.workspace.LuckyTrading as Program<LuckyTrading>;
    const provider = anchor.AnchorProvider.env();
    let collateral: PublicKey;

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
                [Buffer.from("vault"), agent.publicKey.toBuffer()],
                program.programId
            );
            await program.methods
                .openVault(agent.publicKey)
                .accountsPartial({
                    authority: owner.publicKey,
                    collateral: collateral,
                    vault: vaultPda,
                })
                .signers([owner.payer])
                .rpc();
            const vault = await program.account.vault.fetch(vaultPda);

            expect(vault.authority).to.eql(owner.publicKey);

            await program.methods
                .closeVault(agent.publicKey)
                .accountsPartial({
                    authority: owner.publicKey,
                    collateral: collateral,
                    vault: vaultPda,
                })
                .signers([owner.payer])
                .rpc();
        });
    });
};
