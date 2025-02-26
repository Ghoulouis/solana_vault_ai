import { LuckyTrading } from "./../../target/types/lucky_trading";
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Keypair, PublicKey, sendAndConfirmTransaction } from "@solana/web3.js";

// Định nghĩa kiểu cho Perpetual Program ID (tùy chọn, để rõ ràng hơn)
const PERPETUALS_PROGRAM_ID = new PublicKey("PERPHjGBqRHArX4DySjwM6UJHiR3sWAatqfdBS2qQJu");

describe("lucky-trading", () => {
    // Cấu hình client để dùng cluster cục bộ hoặc môi trường được định nghĩa trong Anchor
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    // Khởi tạo chương trình LuckyTrading từ workspace
    const program = anchor.workspace.LuckyTrading as Program<LuckyTrading>;

    it("Test estimate price", async () => {
        // Địa chỉ ví hoặc tài khoản (có thể không cần nếu chỉ tính PDA)
        const address = new PublicKey("64S8vTV3ScdaZzGfeEoTipkZX6EiYndv5Az2LWitZ5b3");

        // Seed để tạo PDA
        const seed = "perpetuals";

        // Tính PDA dựa trên seed và Program ID của Jupiter Perpetuals
        const [pda, bump] = PublicKey.findProgramAddressSync([Buffer.from(seed)], PERPETUALS_PROGRAM_ID); // 5BUwFW4nRbftYTDMbgxykoFWqWHPzahFSNAaaaJtVKsq
    });

    // Ví dụ khởi tạo chương trình (đang bị comment)
    // it("Is initialized!", async () => {
    //     const tx = await program.methods.initialize().rpc();
    //     console.log("Your transaction signature:", tx);
    // });
});
