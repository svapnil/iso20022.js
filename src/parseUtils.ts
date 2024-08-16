import { Account, Agent } from "lib/types"


export const parseAccount = (account: any): Account => {
    // Return just IBAN if it exists, else detailed local account details
    if (account.Id.IBAN) {
        return {
            iban: account.Id.IBAN,
        } as Account
    }

    return {
        ...(account.Id?.Othr?.Id && { accountNumber: String(account.Id.Othr.Id) }),
        ...(account.Nm && { name: account.Nm }),
        ...(account.Ccy && { currency: account.Ccy }),
    } as Account
}

// TODO: Add both BIC and ABA routing numbers at the same time
export const parseAgent = (agent: any): Agent => {
    // Get BIC if it exists first
    if (agent.FinInstnId.BIC) {
        return {
            bic: agent.FinInstnId.BIC,
        } as Agent
    }

    return {
        routingNumber: agent.FinInstnId.Othr.Id,
    } as Agent
}