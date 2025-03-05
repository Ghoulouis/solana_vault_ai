use anchor_lang::prelude::*;

#[event]
pub struct OpenVaultEvent {
    pub agent: Pubkey,
    pub vault: Pubkey,
}

#[event]
pub struct DepositEvent {
    pub user: Pubkey,
    pub collateral_amount: u64,
    pub lp_amount: u64,
}
#[event]
pub struct WithdrawRequestEvent {
    pub user: Pubkey,
    pub lp_amount: u64,
}

#[event]
pub struct WithdrawEvent {
    pub user: Pubkey,
    pub lp_amount: u64,
    pub collateral_amount: u64,
}

#[event]
pub struct AgentDepositEvent {
    pub collateral_amount: u64,
}

#[event]
pub struct AgentWithdrawEvent {
    pub collateral_amount: u64,
}
