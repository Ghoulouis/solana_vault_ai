use anchor_lang::prelude::*;
use anchor_spl::{associated_token::AssociatedToken, token::{Mint, Token, TokenAccount}, token_2022::Token2022};

use crate::{constants::constants::VAULT_SEED, error::VaultError, state::{ Vault, VaultUser}, WithdrawRequestEvent};

#[derive(Accounts)]
#[instruction(
    agent:Pubkey,
)]
pub struct RequestWithdraw<'info> {

    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut, 
        seeds = [VAULT_SEED, agent.as_ref() ], 
        bump
    )]
    pub vault: Account<'info, Vault>,

    #[account(
        init_if_needed,
        seeds = [VAULT_SEED, vault.key().as_ref(), user.key().as_ref()],
        bump,
        payer = user,
        space = VaultUser::VAULT_USER_SPACE
    )]
    pub vault_user: Box<Account<'info, VaultUser>>,
    #[account(
        mut,
        constraint = vault.collateral == collateral.key() @VaultError::InvalidCollateral,
    )]
    pub collateral: Box<Account<'info, Mint>>,
    #[account(
        init_if_needed,
        payer = user,
        associated_token::authority = user,
        associated_token::mint = collateral,
    )]
    pub user_collateral: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
        constraint = vault_collateral.mint == collateral.key() @VaultError::InvalidOwnerUserCollateralATA,
        constraint = vault_collateral.owner == vault.key() @VaultError::InvalidCollateralUserCollateralATA,
    )]
    pub vault_collateral: Box<Account<'info, TokenAccount>>,
    pub token_program: Program<'info, Token>,
    pub token_2022_program: Program<'info, Token2022>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}
impl  <'info> RequestWithdraw<'info> {
    pub fn handler(&mut self, _agent: Pubkey, lp_amount: u64) -> Result<()> {
        let vault_user = &mut self.vault_user;
        vault_user.lp = vault_user.lp.checked_sub(lp_amount).ok_or(VaultError::Overflow)?;
        vault_user.lp_lock += lp_amount;

        emit!(WithdrawRequestEvent {
            user: self.user.key(),
            lp_amount,
        });
        Ok(())
    }
    
}
