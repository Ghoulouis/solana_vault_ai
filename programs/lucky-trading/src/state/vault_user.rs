use anchor_lang::prelude::*;
use std::mem::size_of;

#[account]
pub struct VaultUser {
    pub lp: u64,
    pub lp_lock: u64,
}

impl VaultUser {
    pub const VAULT_USER_SPACE: usize = 8 // Discriminator
        + size_of::<u64>() // lp
        + size_of::<u64>(); // lp_lock
}
