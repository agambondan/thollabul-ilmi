import { BookOpen, Calculator, History, Save } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { deleteKalkulasiZakat, saveKalkulasiZakat } from '../../api/personal';
import { deleteCalculatorHistory, mergeCalculatorHistory, saveCalculatorHistory } from '../../storage/calculatorHistory';
import { radius, spacing } from '../../theme';
import { digitsOnly, formatCurrency, formatNumericInput, parseNumericInput } from '../ExploreScreen.helpers';
import { WebAppZakatHistoryRoute } from './WebAppZakatHistoryRoute';

const NISAB_GRAM = 85;
const NISAB_SILVER_GRAM = 595;
const NISAB_HARVEST_KG = 653;

const ZAKAT_TABS = [
  { key: 'maal', label: 'Maal' },
  { key: 'fitrah', label: 'Fitrah' },
  { key: 'profesi', label: 'Profesi' },
  { key: 'dagang', label: 'Dagang' },
  { key: 'tani', label: 'Tani' },
  { key: 'emas', label: 'Emas' },
  { key: 'riwayat', label: 'Riwayat' },
];

function Field({ hint, label, onChangeText, placeholder = '0', value }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputShell}>
        <Text style={styles.inputPrefix}>Rp</Text>
        <TextInput
          keyboardType="numeric"
          onChangeText={(nextValue) => onChangeText(digitsOnly(nextValue))}
          placeholder={placeholder}
          placeholderTextColor="#94a3b8"
          returnKeyType="done"
          style={styles.input}
          value={formatNumericInput(value)}
        />
      </View>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

function NumberField({ hint, label, onChangeText, placeholder = '0', value }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        keyboardType="numeric"
        onChangeText={(nextValue) => onChangeText(digitsOnly(nextValue))}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        returnKeyType="done"
        style={[styles.inputShell, styles.numberInput]}
        value={formatNumericInput(value)}
      />
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

function InfoBox({ color = 'emerald', text }) {
  const themed = color === 'amber' ? styles.infoAmber : color === 'blue' ? styles.infoBlue : styles.infoEmerald;
  const textStyle = color === 'amber' ? styles.infoTextAmber : color === 'blue' ? styles.infoTextBlue : styles.infoTextEmerald;
  return (
    <View style={[styles.infoBox, themed]}>
      <BookOpen color={color === 'amber' ? '#b45309' : color === 'blue' ? '#1d4ed8' : '#047857'} size={17} strokeWidth={2.2} />
      <Text style={[styles.infoText, textStyle]}>{text}</Text>
    </View>
  );
}

function ToggleRow({ label, onValueChange, value }) {
  return (
    <View style={styles.toggleRow}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Switch
        onValueChange={onValueChange}
        thumbColor="#ffffff"
        trackColor={{ false: '#e5e7eb', true: '#10b981' }}
        value={value}
      />
    </View>
  );
}

function ResultCard({ amount, color = 'emerald', label, note }) {
  const valueStyle = color === 'amber' ? styles.resultAmountAmber : color === 'blue' ? styles.resultAmountBlue : styles.resultAmountEmerald;
  return (
    <View style={styles.resultCard}>
      <Text style={styles.resultLabel}>{label}</Text>
      <Text style={[styles.resultAmount, valueStyle]}>{formatCurrency(amount)}</Text>
      {note ? <Text style={styles.resultNote}>{note}</Text> : null}
    </View>
  );
}

function SaveButton({ disabled, onPress, saving }) {
  return (
    <Pressable disabled={disabled} onPress={onPress} style={[styles.saveButton, disabled && styles.disabledButton]} testID="web-app-zakat-save">
      <Save color="#047857" size={15} strokeWidth={2.3} />
      <Text style={styles.saveButtonText}>{saving ? 'Menyimpan...' : 'Simpan'}</Text>
    </Pressable>
  );
}

export function WebAppZakatRoute({
  loadZakatHistory = () => {},
  session = null,
  setZakat = () => {},
  setZakatFamilyCount = () => {},
  setZakatGoldGrams = () => {},
  setZakatGoldHaul = () => {},
  setZakatGoldPrice = () => {},
  setZakatHarvestIrrigated = () => {},
  setZakatHarvestWeight = () => {},
  setZakatHaul = () => {},
  setZakatHistory = () => {},
  setZakatMonthlyIncome = () => {},
  setZakatRiceKgPrice = () => {},
  setZakatRicePrice = () => {},
  setZakatSavedMsg = () => {},
  setZakatSaving = () => {},
  setZakatSilverGrams = () => {},
  setZakatSilverPrice = () => {},
  setZakatTab = () => {},
  setZakatTradeCapital = () => {},
  setZakatTradeDebt = () => {},
  setZakatTradeHaul = () => {},
  setZakatTradeReceivable = () => {},
  setZakatTradeStock = () => {},
  showError = () => {},
  zakat = { assets: '', debts: '' },
  zakatFamilyCount = 1,
  zakatGoldGrams = '',
  zakatGoldHaul = true,
  zakatGoldPrice = '1050000',
  zakatHarvestIrrigated = false,
  zakatHarvestWeight = '',
  zakatHaul = true,
  zakatHistory = [],
  zakatMonthlyIncome = '',
  zakatRiceKgPrice = '16000',
  zakatRicePrice = '16000',
  zakatSavedMsg = '',
  zakatSaving = false,
  zakatSilverGrams = '',
  zakatSilverPrice = '14000',
  zakatTab = 0,
  zakatTimerRef = { current: null },
  zakatTradeCapital = '',
  zakatTradeDebt = '',
  zakatTradeHaul = true,
  zakatTradeReceivable = '',
  zakatTradeStock = '',
}) {
  const goldPrice = parseNumericInput(zakatGoldPrice) || 1050000;
  const nisab = NISAB_GRAM * goldPrice;
  const nisabMonthly = nisab / 12;
  const assets = parseNumericInput(zakat.assets);
  const debts = parseNumericInput(zakat.debts);
  const net = Math.max(0, assets - debts);
  const zakatMaal = net >= nisab && zakatHaul ? net * 0.025 : 0;
  const ricePrice = parseNumericInput(zakatRicePrice) || 16000;
  const zakatFitrah = 2.5 * ricePrice * zakatFamilyCount;
  const income = parseNumericInput(zakatMonthlyIncome) || 0;
  const zakatProfesi = income >= nisabMonthly ? income * 0.025 : 0;
  const tradeNet =
    (parseNumericInput(zakatTradeCapital) || 0) +
    (parseNumericInput(zakatTradeStock) || 0) +
    (parseNumericInput(zakatTradeReceivable) || 0) -
    (parseNumericInput(zakatTradeDebt) || 0);
  const zakatTrade = tradeNet >= nisab && zakatTradeHaul ? tradeNet * 0.025 : 0;
  const harvest = parseNumericInput(zakatHarvestWeight) || 0;
  const riceKgPrice = parseNumericInput(zakatRiceKgPrice) || 16000;
  const harvestRate = zakatHarvestIrrigated ? 0.05 : 0.1;
  const zakatAgriculture = harvest >= NISAB_HARVEST_KG ? harvest * harvestRate * riceKgPrice : 0;
  const goldG = parseNumericInput(zakatGoldGrams) || 0;
  const silverPriceNum = parseNumericInput(zakatSilverPrice) || 14000;
  const silverG = parseNumericInput(zakatSilverGrams) || 0;
  const goldValue = goldG * goldPrice;
  const silverValue = silverG * silverPriceNum;
  const goldNisabValue = NISAB_GRAM * goldPrice;
  const silverNisabValue = NISAB_SILVER_GRAM * silverPriceNum;
  const zakatGold =
    zakatGoldHaul && (goldValue >= goldNisabValue || silverValue >= silverNisabValue)
      ? (goldValue + silverValue) * 0.025
      : 0;

  const handleSave = async (jenis, namaJenis, jumlahZakat, nilaiHarta = 0, nisabVal = 0, rate = 2.5, haul = true, catatan = '') => {
    if (jumlahZakat <= 0) return;
    setZakatSaving(true);
    setZakatSavedMsg('');
    const payload = {
      catatan,
      haul,
      jenis,
      jumlah_zakat: jumlahZakat,
      nama_jenis: namaJenis,
      nilai_harta: nilaiHarta,
      nisab: nisabVal,
      rate,
    };
    try {
      if (session?.token) {
        await saveKalkulasiZakat(payload);
        setZakatSavedMsg('Tersimpan ke akun.');
        loadZakatHistory();
      } else {
        const created = await saveCalculatorHistory('zakat', payload);
        setZakatHistory((current) => mergeCalculatorHistory(current, [created]));
        setZakatSavedMsg('Tersimpan di perangkat.');
      }
    } catch {
      setZakatSavedMsg('Gagal menyimpan');
    } finally {
      setZakatSaving(false);
      if (zakatTimerRef.current) clearTimeout(zakatTimerRef.current);
      zakatTimerRef.current = setTimeout(() => setZakatSavedMsg(''), 2500);
    }
  };

  const handleDelete = async (item) => {
    try {
      if (item?.is_local || `${item?.id ?? ''}`.startsWith('local-zakat-')) {
        await deleteCalculatorHistory('zakat', item.id);
      } else {
        await deleteKalkulasiZakat(item.id);
      }
      loadZakatHistory();
    } catch {
      showError('Riwayat zakat gagal dihapus.');
    }
  };

  if (zakatTab === 6) {
    return (
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} style={styles.root}>
        <View testID="explore-web-app-zakat-surface" />
        <WebAppZakatHistoryRoute
          formatCurrency={formatCurrency}
          onBack={() => setZakatTab(0)}
          onDelete={handleDelete}
          session={session}
          zakatHistory={zakatHistory}
        />
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} style={styles.root}>
      <View testID="explore-web-app-zakat-surface" />
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Calculator color="#047857" size={28} strokeWidth={2.2} />
        </View>
        <Text style={styles.title}>Kalkulator Zakat</Text>
        <Text style={styles.subtitle}>Hitung zakat maal, fitrah, profesi, dagang, tani, dan emas.</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroller}>
        <View style={styles.tabs}>
          {ZAKAT_TABS.map((tab, index) => (
            <Pressable
              key={tab.key}
              onPress={() => setZakatTab(index)}
              style={[styles.tab, zakatTab === index && styles.tabActive]}
              testID={`pill-${tab.label}`}
            >
              <Text style={[styles.tabText, zakatTab === index && styles.tabTextActive]}>{tab.label}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <View style={styles.card}>
        {zakatTab === 0 ? (
          <>
            <InfoBox text="Zakat 2,5% dari harta bersih yang sudah mencapai nisab dan haul." />
            <Field hint={`Nisab: ${formatCurrency(nisab)}`} label="Harga emas/gram" onChangeText={setZakatGoldPrice} value={zakatGoldPrice} />
            <Field label="Total harta" onChangeText={(value) => setZakat((current) => ({ ...current, assets: value }))} value={zakat.assets} />
            <Field label="Utang jatuh tempo" onChangeText={(value) => setZakat((current) => ({ ...current, debts: value }))} value={zakat.debts} />
            <ToggleRow label="Sudah haul (1 tahun)" onValueChange={setZakatHaul} value={zakatHaul} />
            {assets > 0 && assets < nisab ? <Text style={styles.warning}>Harta belum mencapai nisab ({formatCurrency(nisab)}).</Text> : null}
            {assets >= nisab && !zakatHaul ? <Text style={styles.warning}>Belum wajib zakat karena belum haul.</Text> : null}
            <ResultCard amount={zakatMaal} label="Zakat Maal" />
            {zakatMaal > 0 ? <SaveButton disabled={zakatSaving} onPress={() => handleSave('maal', 'Zakat Maal', zakatMaal, net, nisab, 2.5, zakatHaul)} saving={zakatSaving} /> : null}
          </>
        ) : null}

        {zakatTab === 1 ? (
          <>
            <InfoBox color="amber" text="Zakat fitrah 1 sha' atau sekitar 2,5 kg makanan pokok per jiwa." />
            <Field label="Harga beras/kg" onChangeText={setZakatRicePrice} value={zakatRicePrice} />
            <View style={styles.counterRow}>
              <Pressable onPress={() => setZakatFamilyCount(Math.max(1, zakatFamilyCount - 1))} style={styles.counterButton}><Text style={styles.counterText}>-</Text></Pressable>
              <View style={styles.counterCenter}>
                <Text style={styles.counterValue}>{zakatFamilyCount}</Text>
                <Text style={styles.counterLabel}>Jiwa</Text>
              </View>
              <Pressable onPress={() => setZakatFamilyCount(zakatFamilyCount + 1)} style={styles.counterButton}><Text style={styles.counterText}>+</Text></Pressable>
            </View>
            <ResultCard amount={zakatFitrah} color="amber" label="Zakat Fitrah" note={`${zakatFamilyCount} jiwa x 2,5 kg x ${formatCurrency(ricePrice)}/kg`} />
            {zakatFitrah > 0 ? <SaveButton disabled={zakatSaving} onPress={() => handleSave('fitrah', 'Zakat Fitrah', zakatFitrah, 0, 0, 0, true, `${zakatFamilyCount} orang x Rp${ricePrice}/kg`)} saving={zakatSaving} /> : null}
          </>
        ) : null}

        {zakatTab === 2 ? (
          <>
            <InfoBox color="blue" text="Zakat profesi 2,5% dari penghasilan bulanan jika mencapai nisab per bulan." />
            <Field hint={`Nisab bulanan: ${formatCurrency(nisabMonthly)}`} label="Harga emas/gram" onChangeText={setZakatGoldPrice} value={zakatGoldPrice} />
            <Field label="Penghasilan per bulan" onChangeText={setZakatMonthlyIncome} value={zakatMonthlyIncome} />
            {income > 0 && income < nisabMonthly ? <Text style={styles.warning}>Penghasilan belum mencapai nisab bulanan.</Text> : null}
            <ResultCard amount={zakatProfesi} color="blue" label="Zakat Profesi" />
            {zakatProfesi > 0 ? <SaveButton disabled={zakatSaving} onPress={() => handleSave('profesi', 'Zakat Profesi', zakatProfesi, income, nisabMonthly)} saving={zakatSaving} /> : null}
          </>
        ) : null}

        {zakatTab === 3 ? (
          <>
            <InfoBox text="Zakat perdagangan 2,5% dari modal, stok, dan piutang setelah dikurangi utang jika mencapai nisab." />
            <Field hint={`Nisab: ${formatCurrency(nisab)}`} label="Harga emas/gram" onChangeText={setZakatGoldPrice} value={zakatGoldPrice} />
            <Field label="Modal usaha" onChangeText={setZakatTradeCapital} value={zakatTradeCapital} />
            <Field label="Nilai stok barang" onChangeText={setZakatTradeStock} value={zakatTradeStock} />
            <Field label="Piutang bisa ditagih" onChangeText={setZakatTradeReceivable} value={zakatTradeReceivable} />
            <Field label="Utang usaha" onChangeText={setZakatTradeDebt} value={zakatTradeDebt} />
            <ToggleRow label="Sudah haul (1 tahun)" onValueChange={setZakatTradeHaul} value={zakatTradeHaul} />
            {tradeNet > 0 ? <Text style={styles.metaText}>Aset bersih: {formatCurrency(tradeNet)}</Text> : null}
            <ResultCard amount={zakatTrade} label="Zakat Perdagangan" />
            {zakatTrade > 0 ? <SaveButton disabled={zakatSaving} onPress={() => handleSave('perdagangan', 'Zakat Perdagangan', zakatTrade, tradeNet, nisab, 2.5, zakatTradeHaul)} saving={zakatSaving} /> : null}
          </>
        ) : null}

        {zakatTab === 4 ? (
          <>
            <InfoBox text={`Nisab 5 wasq (${NISAB_HARVEST_KG} kg). Irigasi 5%, tadah hujan 10%.`} />
            <NumberField label="Hasil panen (kg)" onChangeText={setZakatHarvestWeight} value={zakatHarvestWeight} />
            <Field label="Harga gabah/kg" onChangeText={setZakatRiceKgPrice} value={zakatRiceKgPrice} />
            <ToggleRow label="Pakai irigasi (tarif 5%)" onValueChange={setZakatHarvestIrrigated} value={zakatHarvestIrrigated} />
            {harvest > 0 && harvest < NISAB_HARVEST_KG ? <Text style={styles.warning}>Panen kurang dari nisab ({NISAB_HARVEST_KG} kg), belum wajib zakat.</Text> : null}
            <ResultCard amount={zakatAgriculture} label="Zakat Pertanian" note={harvest >= NISAB_HARVEST_KG ? `${harvestRate * 100}% x ${harvest} kg x ${formatCurrency(riceKgPrice)}/kg` : ''} />
            {zakatAgriculture > 0 ? <SaveButton disabled={zakatSaving} onPress={() => handleSave('pertanian', 'Zakat Pertanian', zakatAgriculture, 0, 0, harvestRate * 100, true, `${harvest} kg, irigasi: ${zakatHarvestIrrigated ? '5%' : '10%'}`)} saving={zakatSaving} /> : null}
          </>
        ) : null}

        {zakatTab === 5 ? (
          <>
            <InfoBox color="amber" text="Nisab emas 85g, perak 595g. Wajib setelah 1 haul dengan tarif 2,5%." />
            <Field hint={`Nisab emas: ${formatCurrency(goldNisabValue)}`} label="Harga emas/gram" onChangeText={setZakatGoldPrice} value={zakatGoldPrice} />
            <NumberField label="Berat emas (gram)" onChangeText={setZakatGoldGrams} value={zakatGoldGrams} />
            <Field hint={`Nisab perak: ${formatCurrency(silverNisabValue)}`} label="Harga perak/gram" onChangeText={setZakatSilverPrice} value={zakatSilverPrice} />
            <NumberField label="Berat perak (gram)" onChangeText={setZakatSilverGrams} value={zakatSilverGrams} />
            <ToggleRow label="Sudah haul (1 tahun)" onValueChange={setZakatGoldHaul} value={zakatGoldHaul} />
            <ResultCard amount={zakatGold} color="amber" label="Zakat Emas & Perak" note={zakatGold > 0 ? `2,5% x ${formatCurrency(goldValue + silverValue)}` : ''} />
            {zakatGold > 0 ? <SaveButton disabled={zakatSaving} onPress={() => handleSave('emas_perak', 'Zakat Emas & Perak', zakatGold, goldValue + silverValue, goldNisabValue, 2.5, zakatGoldHaul, `${goldG}g emas, ${silverG}g perak`)} saving={zakatSaving} /> : null}
          </>
        ) : null}
      </View>

      {zakatSavedMsg ? <Text style={styles.savedText}>{zakatSavedMsg}</Text> : null}
      <Pressable onPress={() => setZakatTab(6)} style={styles.historyLink} testID="web-app-zakat-history-link">
        <History color="#047857" size={15} strokeWidth={2.3} />
        <Text style={styles.historyText}>Lihat Riwayat Zakat</Text>
      </Pressable>
      <Text style={styles.disclaimer}>Kalkulator ini adalah alat bantu estimasi. Konsultasikan detail kasus khusus kepada ustadz atau lembaga zakat terpercaya.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: '#f8fafc',
    flex: 1,
  },
  content: {
    backgroundColor: '#f8fafc',
    flexGrow: 1,
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  hero: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  heroIcon: {
    alignItems: 'center',
    backgroundColor: '#d1fae5',
    borderRadius: 18,
    height: 64,
    justifyContent: 'center',
    marginBottom: spacing.md,
    width: 64,
  },
  title: {
    color: '#064e3b',
    fontSize: 27,
    fontWeight: '900',
    lineHeight: 33,
    textAlign: 'center',
  },
  subtitle: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  tabScroller: {
    marginBottom: spacing.md,
  },
  tabs: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingRight: spacing.md,
  },
  tab: {
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  tabActive: {
    backgroundColor: '#047857',
    borderColor: '#047857',
  },
  tabText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '900',
  },
  tabTextActive: {
    color: '#ffffff',
  },
  card: {
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
  },
  infoBox: {
    alignItems: 'flex-start',
    borderRadius: radius.lg,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
  },
  infoEmerald: {
    backgroundColor: '#ecfdf5',
  },
  infoAmber: {
    backgroundColor: '#fffbeb',
  },
  infoBlue: {
    backgroundColor: '#eff6ff',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 19,
  },
  infoTextEmerald: {
    color: '#065f46',
  },
  infoTextAmber: {
    color: '#92400e',
  },
  infoTextBlue: {
    color: '#1e40af',
  },
  field: {
    gap: 6,
  },
  fieldLabel: {
    color: '#374151',
    fontSize: 13,
    fontWeight: '900',
  },
  inputShell: {
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderColor: '#e5e7eb',
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 44,
    paddingHorizontal: spacing.md,
  },
  inputPrefix: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '900',
    marginRight: spacing.sm,
  },
  input: {
    color: '#111827',
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    paddingVertical: spacing.sm,
  },
  numberInput: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '700',
  },
  hint: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 16,
  },
  toggleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  toggleLabel: {
    color: '#374151',
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
  },
  warning: {
    color: '#b45309',
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 18,
    textAlign: 'center',
  },
  metaText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  resultCard: {
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderColor: '#e5e7eb',
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
  },
  resultLabel: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '900',
  },
  resultAmount: {
    fontSize: 26,
    fontWeight: '900',
    lineHeight: 32,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  resultAmountEmerald: {
    color: '#047857',
  },
  resultAmountAmber: {
    color: '#b45309',
  },
  resultAmountBlue: {
    color: '#1d4ed8',
  },
  resultNote: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 16,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  saveButton: {
    alignItems: 'center',
    borderColor: '#a7f3d0',
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'center',
    minHeight: 42,
  },
  saveButtonText: {
    color: '#047857',
    fontSize: 13,
    fontWeight: '900',
  },
  disabledButton: {
    opacity: 0.5,
  },
  counterRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'center',
  },
  counterButton: {
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: radius.md,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  counterText: {
    color: '#374151',
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 25,
  },
  counterCenter: {
    alignItems: 'center',
    minWidth: 58,
  },
  counterValue: {
    color: '#b45309',
    fontSize: 24,
    fontWeight: '900',
  },
  counterLabel: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '800',
  },
  savedText: {
    color: '#047857',
    fontSize: 13,
    fontWeight: '900',
    marginTop: spacing.md,
    textAlign: 'center',
  },
  historyLink: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'center',
    marginTop: spacing.md,
    padding: spacing.sm,
  },
  historyText: {
    color: '#047857',
    fontSize: 13,
    fontWeight: '900',
  },
  disclaimer: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 16,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});
