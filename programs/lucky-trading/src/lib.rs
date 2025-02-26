use anchor_lang::prelude::*;

use crate::instructions::*;
use crate::state::*;

pub mod constants;
pub mod instructions;
pub mod state;

declare_id!("6u3ArNty9HRsBnfh7nZZTSUsWfzLqPKscwPtuQhXkkT2");

#[program]
pub mod lucky_trading {
    use super::*;

    pub fn open_vault(ctx: Context<OpenVault>) -> Result<()> {
        instructions::open_vault::handler(ctx)
    }
}
