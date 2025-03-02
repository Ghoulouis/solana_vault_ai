use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token};

use crate::{constants::constants::VAULT_SEED, state::Vault};

#[derive(Accounts)]
#[instruction(
    agent: Pubkey,
)]
pub struct CloseVault<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
  
    #[account(
        mut,
        seeds = [VAULT_SEED, agent.as_ref() ], 
        bump,
        close = authority,
    )]
    pub vault: Account<'info, Vault>,
    #[account(mut)]
    pub collateral: Account<'info, Mint>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}
impl<'info> CloseVault<'info> {
    pub fn handler(&mut self, _agent: Pubkey) -> Result<()> {
        Ok(())
    }
}
