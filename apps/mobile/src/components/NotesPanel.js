import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { createNote, deleteNote, getNotes, updateNote } from "../api/personal";
import { useFeedback } from "../context/FeedbackContext";
import { useSession } from "../context/SessionContext";
import { useMobileLocale } from "../i18n/MobileLocaleProvider";
import { colors, radius, spacing } from "../theme";
import { CardTitle } from "./Card";

export function NotesPanel({ refType, refId }) {
    const { user } = useSession();
    const { showError, showSuccess } = useFeedback();
    const { t } = useMobileLocale();
    const [content, setContent] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [showAll, setShowAll] = useState(false);
    const PREVIEW_COUNT = 5;

    const load = useCallback(async () => {
        if (!user || !refId) {
            setItems([]);
            return;
        }

        setLoading(true);
        try {
            setItems(await getNotes({ refType, refId }));
        } catch {
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, [refId, refType, user]);

    const resetForm = () => {
        setContent("");
        setEditingId(null);
    };

    const submit = async () => {
        const nextContent = content.trim();
        if (!nextContent) return;

        setLoading(true);
        setMessage("");

        try {
            if (editingId) {
                const updated = await updateNote({
                    id: editingId,
                    content: nextContent,
                });
                setItems((current) =>
                    current.map((item) =>
                        item.id === editingId ? updated : item,
                    ),
                );
                setMessage(t("notes.updated"));
                showSuccess(t("notes.updated"));
            } else {
                const created = await createNote({
                    refType,
                    refId,
                    content: nextContent,
                });
                setItems((current) => [created, ...current]);
                setMessage(t("notes.saved"));
                showSuccess(t("notes.saved"));
            }
            resetForm();
        } catch (err) {
            const nextMessage = err?.message ?? t("notes.saveError");
            setMessage(nextMessage);
            showError(nextMessage);
        } finally {
            setLoading(false);
        }
    };

    const startEdit = (item) => {
        setEditingId(item.id);
        setContent(item.content);
        setMessage("");
    };

    const remove = async (id) => {
        setLoading(true);
        setMessage("");

        try {
            await deleteNote(id);
            setItems((current) => current.filter((item) => item.id !== id));
            if (editingId === id) resetForm();
            setMessage(t("notes.deleted"));
            showSuccess(t("notes.deleted"));
        } catch (err) {
            const nextMessage = err?.message ?? t("notes.deleteError");
            setMessage(nextMessage);
            showError(nextMessage);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, [load]);

    if (!user) {
        return (
            <View style={styles.panel}>
                <CardTitle meta={t("notes.loginMeta")}>
                    {t("notes.title")}
                </CardTitle>
                <Text style={styles.muted}>{t("notes.loginPrompt")}</Text>
            </View>
        );
    }

    return (
        <View style={styles.panel}>
            <CardTitle meta={t("notes.itemCount", { count: items.length })}>
                {t("notes.title")}
            </CardTitle>
            <TextInput
                multiline
                onChangeText={setContent}
                placeholder={t("notes.placeholder")}
                placeholderTextColor={colors.muted}
                style={styles.input}
                value={content}
            />
            <View style={styles.actions}>
                {editingId ? (
                    <Pressable
                        onPress={resetForm}
                        style={styles.secondaryButton}
                    >
                        <Text style={styles.secondaryText}>
                            {t("notes.cancel")}
                        </Text>
                    </Pressable>
                ) : null}
                <Pressable
                    disabled={loading || !content.trim()}
                    onPress={submit}
                    style={styles.primaryButton}
                >
                    {loading ? (
                        <ActivityIndicator color='#ffffff' />
                    ) : (
                        <Text style={styles.primaryText}>
                            {editingId
                                ? t("notes.updateAction")
                                : t("notes.saveAction")}
                        </Text>
                    )}
                </Pressable>
            </View>
            {message ? <Text style={styles.message}>{message}</Text> : null}
            {loading && items.length === 0 ? (
                <ActivityIndicator color={colors.primary} />
            ) : null}
            {(showAll ? items : items.slice(0, PREVIEW_COUNT)).map((item) => (
                <View key={item.id} style={styles.note}>
                    <Text style={styles.noteText}>{item.content}</Text>
                    <View style={styles.noteActions}>
                        <Pressable
                            onPress={() => startEdit(item)}
                            style={styles.noteButton}
                        >
                            <Text style={styles.noteButtonText}>
                                {t("notes.editAction")}
                            </Text>
                        </Pressable>
                        <Pressable
                            onPress={() => remove(item.id)}
                            style={styles.noteButton}
                        >
                            <Text style={styles.deleteText}>
                                {t("notes.deleteAction")}
                            </Text>
                        </Pressable>
                    </View>
                </View>
            ))}
            {items.length > PREVIEW_COUNT ? (
                <Pressable
                    onPress={() => setShowAll((prev) => !prev)}
                    style={styles.showAllButton}
                >
                    <Text style={styles.showAllText}>
                        {showAll
                            ? t("notes.hideAll")
                            : t("notes.showAll", { count: items.length })}
                    </Text>
                </Pressable>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    panel: {
        borderTopColor: colors.faint,
        borderTopWidth: 1,
        marginTop: spacing.md,
        paddingTop: spacing.md,
    },
    muted: {
        color: colors.muted,
        fontSize: 13,
        lineHeight: 19,
    },
    input: {
        backgroundColor: colors.bg,
        borderColor: colors.faint,
        borderRadius: radius.md,
        borderWidth: 1,
        color: colors.ink,
        fontSize: 14,
        lineHeight: 20,
        minHeight: 86,
        padding: spacing.md,
        textAlignVertical: "top",
    },
    actions: {
        flexDirection: "row",
        gap: spacing.sm,
        justifyContent: "flex-end",
        marginTop: spacing.sm,
    },
    primaryButton: {
        alignItems: "center",
        backgroundColor: colors.primary,
        borderRadius: radius.md,
        justifyContent: "center",
        minHeight: 40,
        minWidth: 112,
        paddingHorizontal: spacing.md,
    },
    primaryText: {
        color: "#ffffff",
        fontSize: 13,
        fontWeight: "900",
    },
    secondaryButton: {
        alignItems: "center",
        borderColor: colors.faint,
        borderRadius: radius.md,
        borderWidth: 1,
        justifyContent: "center",
        minHeight: 40,
        minWidth: 84,
        paddingHorizontal: spacing.md,
    },
    secondaryText: {
        color: colors.primary,
        fontSize: 13,
        fontWeight: "800",
    },
    message: {
        color: colors.primary,
        fontSize: 12,
        marginTop: spacing.sm,
    },
    note: {
        borderTopColor: colors.faint,
        borderTopWidth: 1,
        paddingVertical: spacing.md,
    },
    noteText: {
        color: colors.text,
        fontSize: 14,
        lineHeight: 21,
    },
    noteActions: {
        flexDirection: "row",
        gap: spacing.sm,
        marginTop: spacing.sm,
    },
    noteButton: {
        borderColor: colors.faint,
        borderRadius: radius.sm,
        borderWidth: 1,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
    },
    noteButtonText: {
        color: colors.primary,
        fontSize: 12,
        fontWeight: "800",
    },
    deleteText: {
        color: colors.danger,
        fontSize: 12,
        fontWeight: "800",
    },
    showAllButton: {
        alignItems: "center",
        borderColor: colors.faint,
        borderRadius: radius.md,
        borderTopWidth: 0,
        borderWidth: 1,
        justifyContent: "center",
        marginTop: spacing.sm,
        minHeight: 40,
    },
    showAllText: {
        color: colors.primary,
        fontSize: 12,
        fontWeight: "800",
    },
});
