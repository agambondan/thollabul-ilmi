import { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { Pause, Play, Radio as RadioIcon } from "lucide-react-native";
import {
    CompactRow,
    EmptyState,
    ErrorState,
    IconActionButton,
    PaperSearchInput,
} from "../components/Paper";
import { colors, spacing } from "../theme";
import { getRadioIslamicStations } from "../api/client";
import { playAudioUrl, stopAudio } from "../utils/audioPlayer";

export function RadioIslamicContent() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [search, setSearch] = useState("");
    const [playingId, setPlayingId] = useState(null);
    const [loadingAudioId, setLoadingAudioId] = useState(null);
    const isMounted = useRef(true);

    const load = useCallback(async () => {
        setLoading(true);
        setError(false);
        try {
            const params = { page: "1", size: "50" };
            if (search) params.q = search;
            const list = await getRadioIslamicStations(params);
            setItems(list);
        } catch {
            setError(true);
        } finally {
            setLoading(false);
        }
    }, [search]);

    useEffect(() => {
        load();
    }, [load]);

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
            stopAudio();
        };
    }, []);

    const togglePlay = async (station) => {
        const id = station.id ?? station.name;
        if (playingId === id) {
            stopAudio();
            setPlayingId(null);
            return;
        }
        if (!station.stream_url) return;

        setLoadingAudioId(id);
        try {
            await playAudioUrl(station.stream_url, {
                onEnded: () => {
                    if (isMounted.current) setPlayingId(null);
                },
            });
            if (isMounted.current) setPlayingId(id);
        } finally {
            if (isMounted.current) setLoadingAudioId(null);
        }
    };

    return (
        <View style={styles.container}>
            <PaperSearchInput
                onChangeText={setSearch}
                placeholder='Cari nama radio, frekuensi, atau kota...'
                value={search}
            />

            {loading ? (
                <View style={styles.loading}>
                    <ActivityIndicator color={colors.primary} size='large' />
                </View>
            ) : error ? (
                <ErrorState />
            ) : items.length === 0 ? (
                <EmptyState
                    Icon={RadioIcon}
                    title='Radio tidak ditemukan'
                    description='Coba kata kunci lain.'
                />
            ) : (
                <ScrollView showsVerticalScrollIndicator={false}>
                    {items.map((station) => {
                        const id = station.id ?? station.name;
                        const isPlaying = playingId === id;
                        const isBuffering = loadingAudioId === id;
                        return (
                            <CompactRow
                                Icon={RadioIcon}
                                key={id}
                                meta={station.frequency}
                                onPress={
                                    station.stream_url
                                        ? () => togglePlay(station)
                                        : undefined
                                }
                                right={
                                    station.stream_url ? (
                                        isBuffering ? (
                                            <ActivityIndicator
                                                color={colors.primary}
                                                size='small'
                                            />
                                        ) : (
                                            <IconActionButton
                                                Icon={isPlaying ? Pause : Play}
                                                active={isPlaying}
                                                label={
                                                    isPlaying
                                                        ? `Jeda ${station.name}`
                                                        : `Putar ${station.name}`
                                                }
                                                onPress={() =>
                                                    togglePlay(station)
                                                }
                                            />
                                        )
                                    ) : null
                                }
                                selected={isPlaying}
                                subtitle={station.city}
                                title={station.name}
                            />
                        );
                    })}
                    <View style={styles.listBottomPad} />
                </ScrollView>
            )}
            {!loading &&
            !error &&
            items.length > 0 &&
            !items.some((s) => s.stream_url) ? (
                <Text style={styles.notice}>
                    Belum ada siaran online untuk daftar ini.
                </Text>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loading: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: spacing.xxl,
    },
    listBottomPad: {
        height: spacing.xl,
    },
    notice: {
        color: colors.muted,
        fontSize: 12,
        marginTop: spacing.sm,
    },
});

export default RadioIslamicContent;
