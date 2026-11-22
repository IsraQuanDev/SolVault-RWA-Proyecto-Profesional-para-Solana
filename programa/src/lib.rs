use anchor_lang::prelude::*;

declare_id!("A719PHJSLKVG9WFGad9od28zx17PfKdaC3Rgetbcq5dW");

#[program]
pub mod boveda {
    use super::*;

    /////////////////////////// INSTRUCCIONES ///////////////////////////

    /////////////////////////// Crear Boveda ///////////////////////////
    pub fn crear_boveda(context: Context<NuevaBoveda>, nombre_boveda: String) -> Result<()> {
        context.accounts.boveda.set_inner(Boveda {
            owner: context.accounts.owner.key(),
            nombre_boveda: nombre_boveda.clone(),
            lotes: Vec::new(),
            id_counter: 0,
        });

        msg!("Boveda RWA: {} creada exitosamente!", nombre_boveda);
        Ok(())
    }

    /////////////////////////// Crear Lote ///////////////////////////
    pub fn crear_lote(context: Context<NuevoLote>, categoria: String) -> Result<()> {
        let lote_key = context.accounts.lote.key(); // Se lee ANTES del &mut para no solapar prestamos

        let boveda = &mut context.accounts.boveda;

        require!(boveda.lotes.len() < 10, Errores::LimiteAlcanzado);

        let id_lote = boveda.id_counter + 1;
        boveda.id_counter = id_lote;
        boveda.lotes.push(lote_key);

        context.accounts.lote.set_inner(Lote {
            id_lote,
            categoria: categoria.clone(),
            total_activos: 0,
            activos: Vec::new(),
        });

        msg!("Lote {} creado con id: {}", categoria, id_lote);
        Ok(())
    }

    /////////////////////////// Registrar Activo ///////////////////////////
    pub fn registrar_activo(
        context: Context<NuevoActivo>,
        _id_lote: u16,
        serial: String,
        descripcion: String,
        valor_estimado: u32,
    ) -> Result<()> {
        let activo_key = context.accounts.activo.key(); // Se lee ANTES del &mut de lote

        let lote = &mut context.accounts.lote;

        require!(lote.activos.len() < 10, Errores::LimiteAlcanzado);

        context.accounts.activo.set_inner(Activo {
            serial: serial.clone(),
            descripcion,
            valor_estimado,
        });

        lote.activos.push(activo_key);
        lote.total_activos += 1;

        msg!("Activo {} registrado en el lote id: {}", serial, lote.id_lote);
        Ok(())
    }

    /////////////////////////// Actualizar Valor ///////////////////////////
    pub fn actualizar_valor(
        context: Context<ModificarActivo>,
        _id_lote: u16,
        serial: String,
        nuevo_valor: u32,
    ) -> Result<()> {
        let activo = &mut context.accounts.activo;
        let viejo_valor = activo.valor_estimado;
        activo.valor_estimado = nuevo_valor;

        msg!(
            "El valor del activo {} paso de: {} a: {}",
            serial,
            viejo_valor,
            nuevo_valor
        );
        Ok(())
    }

    /////////////////////////// Liquidar Activo (Cierre condicionado) ///////////////////////////
    pub fn liquidar_activo(
        context: Context<EliminarActivo>,
        _id_lote: u16,
        serial: String,
    ) -> Result<()> {
        let activo_key = context.accounts.activo.key();

        let lote = &mut context.accounts.lote;

        require!(lote.activos.contains(&activo_key), Errores::NoExisteActivo);

        lote.activos.retain(|&k| k != activo_key);
        lote.total_activos -= 1;

        msg!(
            "Activo con serial: {} liquidado del lote id: {}. Cuenta cerrada.",
            serial,
            lote.id_lote
        );
        Ok(())
    }

    /////////////////////////// Cerrar Lote (Baja de entidad condicionada) ///////////////////////////
    pub fn cerrar_lote(
        context: Context<EliminarLote>,
        _id_lote: u16,
    ) -> Result<()> {
        let lote_key = context.accounts.lote.key();

        // Regla critica de negocio: No permitir cerrar un lote si todavia tiene activos
        let lote = &context.accounts.lote;
        require!(lote.activos.is_empty(), Errores::LoteTieneActivos);

        let boveda = &mut context.accounts.boveda;
        require!(boveda.lotes.contains(&lote_key), Errores::NoExisteLote);

        boveda.lotes.retain(|&k| k != lote_key);

        msg!("Lote con id: {} cerrado exitosamente. Cero activos huerfanos.", lote.id_lote);
        Ok(())
    }
}

/////////////////////////// Codigos de Error ///////////////////////////
#[error_code]
pub enum Errores {
    #[msg("Error, no eres el owner de la boveda")]
    NoOwner,
    #[msg("Error, el activo no esta en el lote indicado")]
    NoExisteActivo,
    #[msg("Error, se alcanzo el limite de 10 elementos")]
    LimiteAlcanzado,
    #[msg("Error, no se puede cerrar un lote con activos activos")]
    LoteTieneActivos,
    #[msg("Error, el lote no esta registrado en la boveda")]
    NoExisteLote,
}

/////////////////////////// CUENTAS ///////////////////////////

/////////////////////////// Boveda ///////////////////////////
#[account]
#[derive(InitSpace)]
pub struct Boveda {
    pub owner: Pubkey, // pub: has_one = owner necesita leer este campo

    #[max_len(30)]
    pub nombre_boveda: String,

    #[max_len(10)]
    pub lotes: Vec<Pubkey>,

    pub id_counter: u16,
}

/////////////////////////// Lote ///////////////////////////
#[account]
#[derive(InitSpace, PartialEq)]
pub struct Lote {
    pub id_lote: u16,

    #[max_len(30)]
    pub categoria: String,

    pub total_activos: u16,

    #[max_len(10)]
    pub activos: Vec<Pubkey>,
}

/////////////////////////// Activo ///////////////////////////
#[account]
#[derive(InitSpace, PartialEq)]
pub struct Activo {
    #[max_len(5)]
    pub serial: String,

    #[max_len(50)]
    pub descripcion: String,

    pub valor_estimado: u32,
}

/////////////////////////// CONTEXTOS ///////////////////////////
/*
La jerarquia del modelo vive en las seeds:

    boveda  <- [b"boveda", nombre_boveda, owner]
    lote    <- [b"lote",   boveda,        id_lote]
    activo  <- [b"activo", lote,          serial]

Cada cuenta se deriva de su padre, asi que la pertenencia queda garantizada por construccion:
si la direccion coincide, el lote ES de esa boveda y el activo ES de ese lote.

El "has_one = owner" comprueba que boveda.owner == owner.key(), garantizando que quien firma
es el dueño de la boveda raiz.
*/

/////////////////////////// Nueva Boveda ///////////////////////////
/// Instruccion: crear_boveda
#[derive(Accounts)]
#[instruction(nombre_boveda: String)]
pub struct NuevaBoveda<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        init,
        payer = owner,
        space = Boveda::INIT_SPACE + 8,
        seeds = [b"boveda", nombre_boveda.as_bytes(), owner.key().as_ref()],
        bump
    )]
    pub boveda: Account<'info, Boveda>,

    pub system_program: Program<'info, System>,
}

/////////////////////////// Nuevo Lote ///////////////////////////
/// Instruccion: crear_lote
#[derive(Accounts)]
pub struct NuevoLote<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(mut, has_one = owner @ Errores::NoOwner)]
    pub boveda: Account<'info, Boveda>,

    #[account(
        init,
        payer = owner,
        space = Lote::INIT_SPACE + 8,
        seeds = [b"lote", boveda.key().as_ref(), (boveda.id_counter + 1).to_le_bytes().as_ref()],
        bump
    )]
    pub lote: Account<'info, Lote>,

    pub system_program: Program<'info, System>,
}

/////////////////////////// Nuevo Activo ///////////////////////////
/// Instruccion: registrar_activo
#[derive(Accounts)]
#[instruction(id_lote: u16, serial: String)]
pub struct NuevoActivo<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(has_one = owner @ Errores::NoOwner)]
    pub boveda: Account<'info, Boveda>,

    #[account(
        mut,
        seeds = [b"lote", boveda.key().as_ref(), id_lote.to_le_bytes().as_ref()],
        bump
    )]
    pub lote: Account<'info, Lote>,

    #[account(
        init,
        payer = owner,
        space = Activo::INIT_SPACE + 8,
        seeds = [b"activo", lote.key().as_ref(), serial.as_bytes()],
        bump
    )]
    pub activo: Account<'info, Activo>,

    pub system_program: Program<'info, System>,
}

/////////////////////////// Modificar Activo ///////////////////////////
/// Instruccion: actualizar_valor
#[derive(Accounts)]
#[instruction(id_lote: u16, serial: String)]
pub struct ModificarActivo<'info> {
    pub owner: Signer<'info>,

    #[account(has_one = owner @ Errores::NoOwner)]
    pub boveda: Account<'info, Boveda>,

    #[account(
        seeds = [b"lote", boveda.key().as_ref(), id_lote.to_le_bytes().as_ref()],
        bump
    )]
    pub lote: Account<'info, Lote>,

    #[account(
        mut,
        seeds = [b"activo", lote.key().as_ref(), serial.as_bytes()],
        bump
    )]
    pub activo: Account<'info, Activo>,
}

/////////////////////////// Eliminar Activo ///////////////////////////
/// Instruccion: liquidar_activo -> cierra la cuenta y reembolsa renta al owner
#[derive(Accounts)]
#[instruction(id_lote: u16, serial: String)]
pub struct EliminarActivo<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(has_one = owner @ Errores::NoOwner)]
    pub boveda: Account<'info, Boveda>,

    #[account(
        mut,
        seeds = [b"lote", boveda.key().as_ref(), id_lote.to_le_bytes().as_ref()],
        bump
    )]
    pub lote: Account<'info, Lote>,

    #[account(
        mut,
        close = owner,
        seeds = [b"activo", lote.key().as_ref(), serial.as_bytes()],
        bump
    )]
    pub activo: Account<'info, Activo>,
}

/////////////////////////// Eliminar Lote ///////////////////////////
/// Instruccion: cerrar_lote -> cierra la cuenta del lote y devuelve renta al owner
#[derive(Accounts)]
#[instruction(id_lote: u16)]
pub struct EliminarLote<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(mut, has_one = owner @ Errores::NoOwner)]
    pub boveda: Account<'info, Boveda>,

    #[account(
        mut,
        close = owner,
        seeds = [b"lote", boveda.key().as_ref(), id_lote.to_le_bytes().as_ref()],
        bump
    )]
    pub lote: Account<'info, Lote>,
}
