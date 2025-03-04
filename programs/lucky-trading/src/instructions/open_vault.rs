use anchor_lang::prelude::*;
use anchor_spl::{associated_token::AssociatedToken, token::{Mint, Token, TokenAccount}};

use crate::{constants::constants::VAULT_SEED, state::Vault};

#[derive(Accounts)]
#[instruction(
    agent: Pubkey,
)]
pub struct OpenVault<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init,
        seeds = [VAULT_SEED, agent.as_ref()], 
        bump,
        payer = authority,
        space = Vault::VAULT_SPACE
    )]
    pub vault: Account<'info, Vault>,
    #[account(mut)]
    pub collateral: Account<'info, Mint>,

    #[account(
        init,
        payer = authority,
        associated_token::authority = vault,
        associated_token::mint = collateral,
    )]
    pub vault_collateral: Box<Account<'info, TokenAccount>>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

impl<'info> OpenVault<'info> {
    pub fn handler(&mut self, agent: Pubkey, vault_config_bump: u8) -> Result<()> {
    let vault = &mut self.vault;
        vault.bump = vault_config_bump;
        vault.authority = self.authority.key();
        vault.agent = agent; 
        vault.nonce = 0;
        vault.collateral = self.collateral.key();
        vault.collateral_amount = 0;
        vault.total_lp = 0;
        vault.is_paused = false;
        Ok(())
    }   
}