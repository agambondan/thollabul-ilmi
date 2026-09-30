export const NISAB_GOLD_GRAM = 85;
export const NISAB_SILVER_GRAM = 595;
export const NISAB_HARVEST_KG = 653;

const isMissing = (price) => !(price > 0);

export function calculateZakat({
    assets = 0,
    debts = 0,
    familyCount = 1,
    goldGrams = 0,
    goldHaul = true,
    goldPrice = 0,
    harvest = 0,
    harvestIrrigated = false,
    haul = true,
    riceKgPrice = 0,
    ricePrice = 0,
    silverGrams = 0,
    silverPrice = 0,
    tradeCapital = 0,
    tradeDebt = 0,
    tradeHaul = true,
    tradeReceivable = 0,
    tradeStock = 0,
} = {}) {
    const goldPriceMissing = isMissing(goldPrice);
    const silverPriceMissing = isMissing(silverPrice);
    const ricePriceMissing = isMissing(ricePrice);
    const riceKgPriceMissing = isMissing(riceKgPrice);

    const nisab = NISAB_GOLD_GRAM * goldPrice;
    const net = Math.max(0, assets - debts);
    const zakatMaal =
        !goldPriceMissing && net >= nisab && haul ? net * 0.025 : 0;

    const zakatFitrah = ricePriceMissing ? 0 : 2.5 * ricePrice * familyCount;

    const tradeNet = tradeCapital + tradeStock + tradeReceivable - tradeDebt;
    const zakatTrade =
        !goldPriceMissing && tradeNet >= nisab && tradeHaul
            ? tradeNet * 0.025
            : 0;

    const harvestRate = harvestIrrigated ? 0.05 : 0.1;
    const zakatAgriculture =
        !riceKgPriceMissing && harvest >= NISAB_HARVEST_KG
            ? harvest * harvestRate * riceKgPrice
            : 0;

    const goldValue = goldGrams * goldPrice;
    const silverValue = silverGrams * silverPrice;
    const goldNisabValue = NISAB_GOLD_GRAM * goldPrice;
    const silverNisabValue = NISAB_SILVER_GRAM * silverPrice;
    const zakatGold =
        !goldPriceMissing &&
        !silverPriceMissing &&
        goldHaul &&
        (goldValue >= goldNisabValue || silverValue >= silverNisabValue)
            ? (goldValue + silverValue) * 0.025
            : 0;

    return {
        goldNisabValue,
        goldPriceMissing,
        goldValue,
        harvestRate,
        net,
        nisab,
        ricePriceMissing,
        riceKgPriceMissing,
        silverNisabValue,
        silverPriceMissing,
        silverValue,
        tradeNet,
        zakatAgriculture,
        zakatFitrah,
        zakatGold,
        zakatMaal,
        zakatTrade,
    };
}
