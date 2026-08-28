import { BookOpen, Pencil, PlusCircle, Trash2, X } from "lucide-react-native";
import { useState } from "react";
import {
    ActivityIndicator,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import { useMobileLocale } from "../../i18n/MobileLocaleProvider";
import {
    digitsOnly,
    emptyUserWirdForm,
    getExploreItemKey,
} from "../ExploreScreen.helpers";
import { radius, spacing } from "../../theme";

const getRaw = (item) => item?.raw ?? item ?? {};
const getCount = (item) => Number(getRaw(item).count ?? 0);
const getOccasion = (item) => getRaw(item).occasion ?? "";
const getSource = (item) => getRaw(item).source ?? "";
const getArabic = (item) => item?.arabic ?? getRaw(item).arabic ?? "";
const getTransliteration = (item) => getRaw(item).transliteration ?? "";
const getTranslation = (item) => getRaw(item).translation ?? "";
const getNote = (item) => getRaw(item).note ?? "";

function Field({
    field,
    label,
    multiline = false,
    placeholder,
    setUserWirdForm,
    value,
}) {
    return (
        <View style={styles.field}>
            <Text style={styles.fieldLabel}>{label}</Text>
            <TextInput
                multiline={multiline}
                onChangeText={(nextValue) =>
                    setUserWirdForm((current) => ({
                        ...current,
                        [field]: nextValue,
                    }))
                }
                placeholder={placeholder}
                placeholderTextColor='#94a3b8'
                style={[
                    styles.input,
                    multiline && styles.textArea,
                    field === "arabic" && styles.arabicInput,
                ]}
                value={value}
            />
        </View>
    );
}

function LoginPrompt({ onOpenProfile, t }) {
    return (
        <View style={styles.loginCard}>
            <View style={styles.loginIcon}>
                <BookOpen color='#047857' size={30} strokeWidth={2.2} />
            </View>
            <Text style={styles.loginTitle}>{t("explore.userWird.title")}</Text>
            <Text style={styles.loginText}>
                {t("explore.userWird.loginText")}
            </Text>
            <Pressable onPress={onOpenProfile} style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>
                    {t("explore.userWird.login")}
                </Text>
            </Pressable>
        </View>
    );
}

function WirdCard({ item, onEdit, onRemove, t }) {
    const count = getCount(item);
    const occasion = getOccasion(item);
    const source = getSource(item);
    const arabic = getArabic(item);
    const transliteration = getTransliteration(item);
    const translation = getTranslation(item);
    const note = getNote(item);

    return (
        <View style={styles.wirdCard} testID='web-app-user-wird-card'>
            <View style={styles.wirdHeader}>
                {count > 0 ? (
                    <View style={styles.countBadge}>
                        <Text style={styles.countBadgeText}>{count}x</Text>
                    </View>
                ) : null}
                <View style={styles.wirdTitleBlock}>
                    <Text numberOfLines={1} style={styles.wirdTitle}>
                        {item.title}
                    </Text>
                    {occasion ? (
                        <Text style={styles.wirdMeta}>{occasion}</Text>
                    ) : null}
                </View>
                <View style={styles.cardActions}>
                    <Pressable
                        accessibilityLabel={t(
                            "explore.userWird.editAccessibility",
                        )}
                        onPress={() => onEdit(item)}
                        style={styles.iconButton}
                        testID='web-app-user-wird-edit'
                    >
                        <Pencil color='#047857' size={16} strokeWidth={2.2} />
                    </Pressable>
                    <Pressable
                        accessibilityLabel={t(
                            "explore.userWird.deleteAccessibility",
                        )}
                        onPress={() => onRemove(item)}
                        style={styles.iconButton}
                        testID='web-app-user-wird-delete'
                    >
                        <Trash2 color='#dc2626' size={16} strokeWidth={2.2} />
                    </Pressable>
                </View>
            </View>
            {arabic ? <Text style={styles.wirdArabic}>{arabic}</Text> : null}
            {transliteration ? (
                <Text style={styles.wirdTransliteration}>
                    {transliteration}
                </Text>
            ) : null}
            {translation ? (
                <Text style={styles.wirdTranslation}>{translation}</Text>
            ) : null}
            {source ? <Text style={styles.wirdSource}>{source}</Text> : null}
            {note ? <Text style={styles.wirdNote}>{note}</Text> : null}
        </View>
    );
}

export function WebAppUserWirdRoute({
    editingUserWirdId = "",
    error = "",
    fillUserWirdForm = () => {},
    items = [],
    loading = false,
    onOpenProfile = () => {},
    removeUserWird = () => {},
    resetUserWirdForm = () => {},
    savingUserWird = false,
    session = null,
    setUserWirdForm = () => {},
    submitUserWird = () => {},
    userWirdForm = emptyUserWirdForm,
    visibleItems = [],
}) {
    const { t } = useMobileLocale();
    const [formVisible, setFormVisible] = useState(false);
    const listItems = visibleItems?.length ? visibleItems : items;
    const hasSession = Boolean(session?.token);

    const openCreate = () => {
        resetUserWirdForm();
        setFormVisible(true);
    };

    const openEdit = (item) => {
        fillUserWirdForm(item);
        setFormVisible(true);
    };

    const closeForm = () => {
        setFormVisible(false);
        resetUserWirdForm();
    };

    const handleSubmit = async () => {
        const saved = await submitUserWird();
        if (saved) setFormVisible(false);
    };

    return (
        <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps='handled'
            showsVerticalScrollIndicator={false}
            style={styles.root}
        >
            <View testID='explore-web-app-user-wird-surface' />
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>
                        {t("explore.userWird.title")}
                    </Text>
                    <Text style={styles.subtitle}>
                        {t("explore.userWird.subtitle")}
                    </Text>
                </View>
                {hasSession ? (
                    <Pressable
                        onPress={openCreate}
                        style={styles.addButton}
                        testID='web-app-user-wird-add'
                    >
                        <PlusCircle
                            color='#ffffff'
                            size={16}
                            strokeWidth={2.3}
                        />
                        <Text style={styles.addButtonText}>
                            {t("explore.userWird.add")}
                        </Text>
                    </Pressable>
                ) : null}
            </View>

            {!hasSession ? (
                <LoginPrompt onOpenProfile={onOpenProfile} t={t} />
            ) : (
                <>
                    <View style={styles.summaryGrid}>
                        <View style={styles.summaryTile}>
                            <Text style={styles.summaryValue}>
                                {listItems.length}
                            </Text>
                            <Text style={styles.summaryLabel}>
                                {t("explore.userWird.wiridCount")}
                            </Text>
                        </View>
                        <View style={styles.summaryTile}>
                            <Text style={styles.summaryValue}>
                                {listItems.reduce(
                                    (sum, item) => sum + getCount(item),
                                    0,
                                )}
                            </Text>
                            <Text style={styles.summaryLabel}>
                                {t("explore.userWird.readTarget")}
                            </Text>
                        </View>
                    </View>

                    {loading ? (
                        <View style={styles.stateCard}>
                            <ActivityIndicator color='#047857' />
                            <Text style={styles.stateText}>
                                {t("explore.userWird.loading")}
                            </Text>
                        </View>
                    ) : null}

                    {error ? (
                        <Text style={styles.errorText}>{error}</Text>
                    ) : null}

                    {!loading && listItems.length === 0 ? (
                        <View style={styles.emptyCard}>
                            <BookOpen
                                color='#94a3b8'
                                size={30}
                                strokeWidth={2.1}
                            />
                            <Text style={styles.emptyTitle}>
                                {t("explore.userWird.emptyTitle")}
                            </Text>
                            <Pressable
                                onPress={openCreate}
                                style={styles.linkButton}
                            >
                                <Text style={styles.linkButtonText}>
                                    {t("explore.userWird.createFirst")}
                                </Text>
                            </Pressable>
                        </View>
                    ) : (
                        <View style={styles.list}>
                            {listItems.map((item, index) => (
                                <WirdCard
                                    item={item}
                                    key={`${getExploreItemKey(item)}-${index}`}
                                    onEdit={openEdit}
                                    onRemove={removeUserWird}
                                    t={t}
                                />
                            ))}
                        </View>
                    )}
                </>
            )}

            <Modal
                animationType='fade'
                onRequestClose={closeForm}
                transparent
                visible={formVisible}
            >
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {editingUserWirdId
                                    ? t("explore.userWird.editTitle")
                                    : t("explore.userWird.createTitle")}
                            </Text>
                            <Pressable
                                accessibilityLabel={t(
                                    "explore.userWird.closeFormAccessibility",
                                )}
                                onPress={closeForm}
                                style={styles.modalClose}
                            >
                                <X
                                    color='#64748b'
                                    size={18}
                                    strokeWidth={2.2}
                                />
                            </Pressable>
                        </View>
                        <ScrollView
                            keyboardShouldPersistTaps='handled'
                            showsVerticalScrollIndicator={false}
                        >
                            <Field
                                field='title'
                                label={t("explore.userWird.field.title")}
                                placeholder={t(
                                    "explore.userWird.placeholder.title",
                                )}
                                setUserWirdForm={setUserWirdForm}
                                value={userWirdForm.title}
                            />
                            <Field
                                field='arabic'
                                label={t("explore.userWird.field.arabic")}
                                multiline
                                placeholder={t(
                                    "explore.userWird.placeholder.arabic",
                                )}
                                setUserWirdForm={setUserWirdForm}
                                value={userWirdForm.arabic}
                            />
                            <Field
                                field='transliteration'
                                label={t(
                                    "explore.userWird.field.transliteration",
                                )}
                                placeholder={t(
                                    "explore.userWird.placeholder.transliteration",
                                )}
                                setUserWirdForm={setUserWirdForm}
                                value={userWirdForm.transliteration}
                            />
                            <Field
                                field='translation'
                                label={t("explore.userWird.field.translation")}
                                multiline
                                placeholder={t(
                                    "explore.userWird.placeholder.translation",
                                )}
                                setUserWirdForm={setUserWirdForm}
                                value={userWirdForm.translation}
                            />
                            <View style={styles.fieldRow}>
                                <View style={styles.fieldHalf}>
                                    <Text style={styles.fieldLabel}>
                                        {t("explore.userWird.field.count")}
                                    </Text>
                                    <TextInput
                                        keyboardType='numeric'
                                        onChangeText={(value) =>
                                            setUserWirdForm((current) => ({
                                                ...current,
                                                count: digitsOnly(value),
                                            }))
                                        }
                                        placeholder='1'
                                        placeholderTextColor='#94a3b8'
                                        style={styles.input}
                                        value={userWirdForm.count}
                                    />
                                </View>
                                <View style={styles.fieldHalf}>
                                    <Field
                                        field='occasion'
                                        label={t(
                                            "explore.userWird.field.occasion",
                                        )}
                                        placeholder={t(
                                            "explore.userWird.placeholder.occasion",
                                        )}
                                        setUserWirdForm={setUserWirdForm}
                                        value={userWirdForm.occasion}
                                    />
                                </View>
                            </View>
                            <Field
                                field='source'
                                label={t("explore.userWird.field.source")}
                                placeholder={t(
                                    "explore.userWird.placeholder.source",
                                )}
                                setUserWirdForm={setUserWirdForm}
                                value={userWirdForm.source}
                            />
                            <Field
                                field='note'
                                label={t("explore.userWird.field.note")}
                                multiline
                                placeholder={t(
                                    "explore.userWird.placeholder.note",
                                )}
                                setUserWirdForm={setUserWirdForm}
                                value={userWirdForm.note}
                            />
                        </ScrollView>
                        <View style={styles.modalActions}>
                            <Pressable
                                onPress={closeForm}
                                style={styles.cancelButton}
                            >
                                <Text style={styles.cancelButtonText}>
                                    {t("explore.userWird.cancel")}
                                </Text>
                            </Pressable>
                            <Pressable
                                disabled={
                                    savingUserWird ||
                                    !userWirdForm.title?.trim()
                                }
                                onPress={handleSubmit}
                                style={[
                                    styles.saveButton,
                                    (savingUserWird ||
                                        !userWirdForm.title?.trim()) &&
                                        styles.disabledButton,
                                ]}
                                testID='web-app-user-wird-save'
                            >
                                <Text style={styles.saveButtonText}>
                                    {savingUserWird
                                        ? t("explore.userWird.saving")
                                        : t("explore.userWird.save")}
                                </Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    root: {
        backgroundColor: "#f8fafc",
        flex: 1,
    },
    content: {
        backgroundColor: "#f8fafc",
        flexGrow: 1,
        padding: spacing.md,
        paddingBottom: spacing.xl,
    },
    header: {
        alignItems: "flex-start",
        flexDirection: "row",
        gap: spacing.md,
        justifyContent: "space-between",
        marginBottom: spacing.lg,
    },
    title: {
        color: "#064e3b",
        fontSize: 24,
        fontWeight: "900",
        lineHeight: 30,
    },
    subtitle: {
        color: "#64748b",
        fontSize: 13,
        fontWeight: "700",
        lineHeight: 19,
        marginTop: 3,
    },
    addButton: {
        alignItems: "center",
        backgroundColor: "#047857",
        borderRadius: radius.md,
        flexDirection: "row",
        gap: 6,
        minHeight: 40,
        paddingHorizontal: spacing.md,
    },
    addButtonText: {
        color: "#ffffff",
        fontSize: 12,
        fontWeight: "900",
    },
    loginCard: {
        alignItems: "center",
        backgroundColor: "#ffffff",
        borderColor: "#d1fae5",
        borderRadius: radius.xl,
        borderWidth: 1,
        padding: spacing.xl,
    },
    loginIcon: {
        alignItems: "center",
        backgroundColor: "#ecfdf5",
        borderRadius: radius.lg,
        height: 58,
        justifyContent: "center",
        marginBottom: spacing.md,
        width: 58,
    },
    loginTitle: {
        color: "#064e3b",
        fontSize: 20,
        fontWeight: "900",
    },
    loginText: {
        color: "#64748b",
        fontSize: 13,
        fontWeight: "700",
        lineHeight: 19,
        marginTop: spacing.xs,
        textAlign: "center",
    },
    primaryButton: {
        backgroundColor: "#047857",
        borderRadius: radius.md,
        marginTop: spacing.md,
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.sm,
    },
    primaryButtonText: {
        color: "#ffffff",
        fontSize: 13,
        fontWeight: "900",
    },
    summaryGrid: {
        flexDirection: "row",
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    summaryTile: {
        backgroundColor: "#ffffff",
        borderColor: "#e5e7eb",
        borderRadius: radius.lg,
        borderWidth: 1,
        flex: 1,
        padding: spacing.md,
    },
    summaryValue: {
        color: "#047857",
        fontSize: 24,
        fontWeight: "900",
        lineHeight: 29,
    },
    summaryLabel: {
        color: "#64748b",
        fontSize: 11,
        fontWeight: "800",
        marginTop: 2,
    },
    stateCard: {
        alignItems: "center",
        backgroundColor: "#ffffff",
        borderColor: "#e5e7eb",
        borderRadius: radius.lg,
        borderWidth: 1,
        gap: spacing.sm,
        padding: spacing.lg,
    },
    stateText: {
        color: "#64748b",
        fontSize: 13,
        fontWeight: "800",
    },
    errorText: {
        backgroundColor: "#fef3c7",
        borderRadius: radius.md,
        color: "#92400e",
        fontSize: 12,
        fontWeight: "800",
        lineHeight: 17,
        marginBottom: spacing.md,
        padding: spacing.md,
    },
    emptyCard: {
        alignItems: "center",
        backgroundColor: "#ffffff",
        borderColor: "#e5e7eb",
        borderRadius: radius.xl,
        borderWidth: 1,
        gap: spacing.sm,
        padding: spacing.xl,
    },
    emptyTitle: {
        color: "#64748b",
        fontSize: 13,
        fontWeight: "800",
    },
    linkButton: {
        padding: spacing.xs,
    },
    linkButtonText: {
        color: "#047857",
        fontSize: 13,
        fontWeight: "900",
    },
    list: {
        gap: spacing.sm,
    },
    wirdCard: {
        backgroundColor: "#ffffff",
        borderColor: "#e5e7eb",
        borderRadius: radius.lg,
        borderWidth: 1,
        padding: spacing.md,
    },
    wirdHeader: {
        alignItems: "center",
        flexDirection: "row",
        gap: spacing.sm,
    },
    countBadge: {
        alignItems: "center",
        backgroundColor: "#10b981",
        borderRadius: 999,
        minWidth: 36,
        paddingHorizontal: spacing.sm,
        paddingVertical: 5,
    },
    countBadgeText: {
        color: "#ffffff",
        fontSize: 12,
        fontWeight: "900",
    },
    wirdTitleBlock: {
        flex: 1,
        minWidth: 0,
    },
    wirdTitle: {
        color: "#111827",
        fontSize: 15,
        fontWeight: "900",
    },
    wirdMeta: {
        color: "#b45309",
        fontSize: 11,
        fontWeight: "800",
        marginTop: 2,
    },
    cardActions: {
        flexDirection: "row",
        gap: spacing.xs,
    },
    iconButton: {
        alignItems: "center",
        borderRadius: radius.sm,
        height: 34,
        justifyContent: "center",
        width: 34,
    },
    wirdArabic: {
        color: "#064e3b",
        fontSize: 24,
        lineHeight: 40,
        marginTop: spacing.md,
        textAlign: "right",
    },
    wirdTransliteration: {
        color: "#64748b",
        fontSize: 13,
        fontStyle: "italic",
        fontWeight: "700",
        lineHeight: 19,
        marginTop: spacing.xs,
    },
    wirdTranslation: {
        color: "#334155",
        fontSize: 13,
        fontWeight: "700",
        lineHeight: 20,
        marginTop: spacing.xs,
    },
    wirdSource: {
        color: "#047857",
        fontSize: 12,
        fontWeight: "900",
        marginTop: spacing.sm,
    },
    wirdNote: {
        borderLeftColor: "#a7f3d0",
        borderLeftWidth: 2,
        color: "#64748b",
        fontSize: 12,
        fontStyle: "italic",
        fontWeight: "700",
        lineHeight: 18,
        marginTop: spacing.sm,
        paddingLeft: spacing.sm,
    },
    modalBackdrop: {
        backgroundColor: "rgba(15, 23, 42, 0.5)",
        flex: 1,
        justifyContent: "center",
        padding: spacing.md,
    },
    modalCard: {
        backgroundColor: "#ffffff",
        borderRadius: radius.xl,
        maxHeight: "90%",
        padding: spacing.lg,
    },
    modalHeader: {
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: spacing.md,
    },
    modalTitle: {
        color: "#111827",
        fontSize: 17,
        fontWeight: "900",
    },
    modalClose: {
        alignItems: "center",
        height: 34,
        justifyContent: "center",
        width: 34,
    },
    field: {
        marginBottom: spacing.sm,
    },
    fieldLabel: {
        color: "#475569",
        fontSize: 12,
        fontWeight: "900",
        marginBottom: 5,
    },
    input: {
        backgroundColor: "#ffffff",
        borderColor: "#e5e7eb",
        borderRadius: radius.md,
        borderWidth: 1,
        color: "#111827",
        fontSize: 14,
        minHeight: 42,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
    },
    textArea: {
        minHeight: 82,
        textAlignVertical: "top",
    },
    arabicInput: {
        fontSize: 18,
        lineHeight: 30,
        textAlign: "right",
    },
    fieldRow: {
        flexDirection: "row",
        gap: spacing.sm,
    },
    fieldHalf: {
        flex: 1,
    },
    modalActions: {
        flexDirection: "row",
        gap: spacing.sm,
        justifyContent: "flex-end",
        marginTop: spacing.md,
    },
    cancelButton: {
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
    },
    cancelButtonText: {
        color: "#64748b",
        fontSize: 13,
        fontWeight: "900",
    },
    saveButton: {
        backgroundColor: "#047857",
        borderRadius: radius.md,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
    },
    saveButtonText: {
        color: "#ffffff",
        fontSize: 13,
        fontWeight: "900",
    },
    disabledButton: {
        opacity: 0.45,
    },
});
