use anchor_lang::prelude::*;
use anchor_spl::{associated_token::AssociatedToken, token::{Mint, Token, TokenAccount}, token_2022::Token2022};

use crate::{constants::constants::VAULT_SEED, state::Vault, OpenVaultEvent};

#[derive(Accounts)]

pub struct OpenVault<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
   #[account(mut)]
    pub agent: AccountInfo<'info>,
    #[account(
        init,
        seeds = [VAULT_SEED, agent.key().as_ref()], 
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
    #[account(
        init_if_needed,
        payer = authority,
        associated_token::authority = agent,
        associated_token::mint = collateral,
    )]
    pub agent_collateral: Box<Account<'info, TokenAccount>>,
    pub token_program: Program<'info, Token>,
    pub token_2022_program: Program<'info, Token2022>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

impl<'info> OpenVault<'info> {
    pub fn handler(&mut self, vault_config_bump: u8) -> Result<()> {
    let vault = &mut self.vault;
        vault.bump = vault_config_bump;
        vault.authority = self.authority.key();
        vault.agent = self.agent.key(); 
        vault.nonce = 0;
        vault.collateral = self.collateral.key();
        vault.collateral_amount = 0;
        vault.total_lp = 0;
        vault.total_lp_lock = 0;
        vault.is_paused = false;

        emit!(OpenVaultEvent {
            agent: self.agent.key(),
            vault: vault.key(),
        });

        Ok(())
    }   
}