use anchor_lang::prelude::*;
use std::mem::size_of;

#[account]
pub struct Vault {
    pub bump: u8,
    pub authority: Pubkey,
    pub ai_key: Pubkey,
    pub nonce: u64,
    pub collateral: Pubkey,
    pub collateral_amount: u64,
    pub total_lp: u64,
    pub is_paused: bool,
}

impl Vault {
    pub const VAULT_SPACE: usize = 8
        + size_of::<u8>() //bump
        + size_of::<Pubkey>() // authority
        + size_of::<Pubkey>() // ai_key
        + size_of::<u64>() // nonce
        + size_of::<Pubkey>() // collateral
        + size_of::<u64>() // collateral_amount
        + size_of::<u64>()  // total_lp
        + size_of::<bool>(); // is_paused
}
