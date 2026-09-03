import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { MessageCircle, Send, Trash2, Users } from "lucide-react-native";
import { Card } from "../../components/Card";
import { useMobileLocale } from "../../i18n/MobileLocaleProvider";
import { colors, radius, spacing } from "../../theme";
import { deleteJson, postJson, requestJson } from "../../api/client";

export function WebAppKomunitasRoute({
    feature,
    isDarkTheme,
    session,
    styles: injectedStyles,
}) {
    const { t } = useMobileLocale();
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [inputText, setInputText] = useState("");
    const [sending, setSending] = useState(false);

    const fetchChat = async () => {
        try {
            const data = await requestJson("/api/v1/komunitas/chat?limit=50", {
                auth: true,
            });
            setMessages(data?.data?.items || data?.items || []);
        } catch {
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchChat();
        const interval = setInterval(fetchChat, 10000);
        return () => clearInterval(interval);
    }, []);

    const handleSend = async () => {
        if (!inputText.trim() || sending) return;
        if (!session?.token) return;

        setSending(true);
        try {
            await postJson(
                "/api/v1/komunitas/chat",
                { message: inputText.trim() },
                { auth: true },
            );
            setInputText("");
            fetchChat();
        } catch {
        } finally {
            setSending(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteJson(`/api/v1/komunitas/chat/${id}`, {
                auth: true,
            });
            setMessages((prev) => prev.filter((m) => m.id !== id));
        } catch {}
    };

    return (
        <View
            style={localStyles.container}
            testID='explore-web-app-komunitas-surface'
        >
            <View
                style={[
                    localStyles.header,
                    isDarkTheme && {
                        backgroundColor: "#111827",
                        borderColor: "#374151",
                    },
                ]}
            >
                <View style={localStyles.headerInfo}>
                    <Users
                        size={20}
                        color={isDarkTheme ? "#34d399" : colors.primary}
                    />
                    <Text
                        style={[
                            localStyles.headerTitle,
                            isDarkTheme && { color: "#f9fafb" },
                        ]}
                    >
                        {t("komunitas.chat") || "Obrolan Komunitas"}
                    </Text>
                </View>
                <Text
                    style={[
                        localStyles.headerSubtitle,
                        isDarkTheme && { color: "#9ca3af" },
                    ]}
                >
                    {messages.length} pesan
                </Text>
            </View>

            {loading ? (
                <View style={localStyles.center}>
                    <ActivityIndicator
                        color={isDarkTheme ? "#34d399" : colors.primary}
                    />
                </View>
            ) : (
                <ScrollView
                    style={localStyles.chatList}
                    contentContainerStyle={localStyles.chatListContent}
                >
                    {messages.length === 0 ? (
                        <Text
                            style={[
                                localStyles.emptyText,
                                isDarkTheme && { color: "#9ca3af" },
                            ]}
                        >
                            {t("komunitas.chat_empty") ||
                                "Belum ada obrolan. Mulai diskusi pertama!"}
                        </Text>
                    ) : (
                        messages.map((item) => {
                            const isMe =
                                session?.user?.id &&
                                item.user_id === session?.user?.id;
                            return (
                                <View
                                    key={item.id}
                                    style={[
                                        localStyles.msgBubble,
                                        isMe
                                            ? localStyles.msgMe
                                            : localStyles.msgOther,
                                        isDarkTheme &&
                                            (isMe
                                                ? { backgroundColor: "#065f46" }
                                                : {
                                                      backgroundColor:
                                                          "#1f2937",
                                                  }),
                                    ]}
                                >
                                    <View style={localStyles.msgHeader}>
                                        <Text
                                            style={[
                                                localStyles.msgSender,
                                                isMe && localStyles.msgSenderMe,
                                                isDarkTheme && {
                                                    color: isMe
                                                        ? "#a7f3d0"
                                                        : "#d1d5db",
                                                },
                                            ]}
                                        >
                                            {item.user_name || "Penuntut Ilmu"}
                                        </Text>
                                        {isMe && (
                                            <Pressable
                                                accessibilityLabel={t(
                                                    "a11y.deleteMessage",
                                                )}
                                                accessibilityRole='button'
                                                onPress={() =>
                                                    handleDelete(item.id)
                                                }
                                                style={localStyles.deleteBtn}
                                            >
                                                <Trash2
                                                    size={12}
                                                    color={
                                                        isDarkTheme
                                                            ? "#9ca3af"
                                                            : "#6b7280"
                                                    }
                                                />
                                            </Pressable>
                                        )}
                                    </View>
                                    <Text
                                        style={[
                                            localStyles.msgText,
                                            isMe && localStyles.msgTextMe,
                                            isDarkTheme && {
                                                color: "#f3f4f6",
                                            },
                                        ]}
                                    >
                                        {item.message}
                                    </Text>
                                    <Text
                                        style={[
                                            localStyles.msgTime,
                                            isDarkTheme && {
                                                color: "#9ca3af",
                                            },
                                        ]}
                                    >
                                        {item.created_at
                                            ? new Date(
                                                  item.created_at,
                                              ).toLocaleTimeString([], {
                                                  hour: "2-digit",
                                                  minute: "2-digit",
                                              })
                                            : ""}
                                    </Text>
                                </View>
                            );
                        })
                    )}
                </ScrollView>
            )}

            <View
                style={[
                    localStyles.inputContainer,
                    isDarkTheme && {
                        backgroundColor: "#111827",
                        borderColor: "#374151",
                    },
                ]}
            >
                {!session?.token ? (
                    <Text
                        style={[
                            localStyles.loginPrompt,
                            isDarkTheme && { color: "#9ca3af" },
                        ]}
                    >
                        Masuk untuk bergabung dalam obrolan
                    </Text>
                ) : (
                    <View style={localStyles.inputRow}>
                        <TextInput
                            style={[
                                localStyles.input,
                                isDarkTheme && {
                                    backgroundColor: "#1f2937",
                                    color: "#f9fafb",
                                },
                            ]}
                            placeholder='Ketik pesan...'
                            placeholderTextColor={
                                isDarkTheme ? "#6b7280" : "#9ca3af"
                            }
                            value={inputText}
                            onChangeText={setInputText}
                        />
                        <Pressable
                            accessibilityLabel={t("a11y.sendMessage")}
                            accessibilityRole='button'
                            accessibilityState={{
                                disabled: sending || !inputText.trim(),
                            }}
                            onPress={handleSend}
                            disabled={sending || !inputText.trim()}
                            style={[
                                localStyles.sendBtn,
                                (!inputText.trim() || sending) &&
                                    localStyles.sendBtnDisabled,
                                isDarkTheme && { backgroundColor: "#059669" },
                            ]}
                        >
                            {sending ? (
                                <ActivityIndicator size='small' color='#fff' />
                            ) : (
                                <Send size={18} color='#fff' />
                            )}
                        </Pressable>
                    </View>
                )}
            </View>
        </View>
    );
}

const localStyles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderColor: "#e5e7eb",
        backgroundColor: "#ffffff",
    },
    headerInfo: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.xs,
    },
    headerTitle: {
        fontSize: 15,
        fontWeight: "600",
        color: colors.textPrimary,
    },
    headerSubtitle: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    center: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    emptyText: {
        textAlign: "center",
        padding: spacing.xl,
        fontSize: 13,
        color: colors.textSecondary,
    },
    chatList: {
        flex: 1,
    },
    chatListContent: {
        padding: spacing.md,
        gap: spacing.sm,
    },
    msgBubble: {
        maxWidth: "80%",
        padding: spacing.sm,
        borderRadius: radius.md,
        gap: 2,
    },
    msgMe: {
        alignSelf: "flex-end",
        backgroundColor: colors.primaryLight || "#ecfdf5",
    },
    msgOther: {
        alignSelf: "flex-start",
        backgroundColor: "#f3f4f6",
    },
    msgHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: spacing.xs,
    },
    msgSender: {
        fontSize: 11,
        fontWeight: "600",
        color: colors.textSecondary,
    },
    msgSenderMe: {
        color: colors.primary,
    },
    deleteBtn: {
        padding: 2,
    },
    msgText: {
        fontSize: 13,
        lineHeight: 18,
        color: colors.textPrimary,
    },
    msgTextMe: {
        color: "#064e3b",
    },
    msgTime: {
        fontSize: 10,
        alignSelf: "flex-end",
        color: "#9ca3af",
    },
    inputContainer: {
        padding: spacing.sm,
        borderTopWidth: 1,
        borderColor: "#e5e7eb",
        backgroundColor: "#ffffff",
    },
    loginPrompt: {
        textAlign: "center",
        paddingVertical: spacing.xs,
        fontSize: 13,
        color: colors.textSecondary,
    },
    inputRow: {
        flexDirection: "row",
        gap: spacing.xs,
    },
    input: {
        flex: 1,
        height: 40,
        backgroundColor: "#f3f4f6",
        borderRadius: radius.full,
        paddingHorizontal: spacing.md,
        fontSize: 13,
        color: colors.textPrimary,
    },
    sendBtn: {
        width: 40,
        height: 40,
        borderRadius: radius.full,
        backgroundColor: colors.primary,
        alignItems: "center",
        justifyContent: "center",
    },
    sendBtnDisabled: {
        opacity: 0.5,
    },
});
