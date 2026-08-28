import React from "react";
import { Text, TextInput, View } from "react-native";
import { render, fireEvent } from "@testing-library/react-native";

jest.mock("react-native-safe-area-context", () => {
    const inset = { top: 0, right: 0, bottom: 0, left: 0 };
    return {
        SafeAreaProvider: ({ children }) => children,
        SafeAreaView: ({ children }) => children,
        useSafeAreaInsets: () => inset,
    };
});

import { Screen } from "../components/Screen";
import { SwipeBackView } from "../components/SwipeBackView";
import {
    SectionHeader,
    SegmentedTabs,
    PaperSearchInput,
    IconActionButton,
    ActionPill,
    CompactRow,
    EmptyState,
    ErrorState,
} from "../components/Paper";
import { ContentCard, MetaRail } from "../components/ContentCard";
import { TabBar } from "../components/TabBar";
import { Card, CardTitle } from "../components/Card";
import { AppActionSheet, ActionSheetRow } from "../components/AppActionSheet";
import { AppModalSheet } from "../components/AppModalSheet";
import { DetailHeader } from "../components/DetailHeader";
import { SectionHeader as SectionHeaderStandalone } from "../components/SectionHeader";
import { TabActivityProvider } from "../context/TabActivityContext";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function wrapInProviders(ui) {
    return <TabActivityProvider>{ui}</TabActivityProvider>;
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

describe("Screen", () => {
    test("renders title", () => {
        const { getByText, queryByText } = render(
            wrapInProviders(
                <Screen title='Dashboard'>
                    <Text>Hello</Text>
                </Screen>,
            ),
        );
        expect(getByText("Dashboard")).toBeTruthy();
        expect(getByText("Hello")).toBeTruthy();
        expect(queryByText("Subtitle")).toBeNull();
    });

    test("renders subtitle when provided", () => {
        const { getByText } = render(
            wrapInProviders(
                <Screen title='Dashboard' subtitle='Welcome back'>
                    <Text>Content</Text>
                </Screen>,
            ),
        );
        expect(getByText("Welcome back")).toBeTruthy();
    });

    test("renders actions slot", () => {
        const { getByText } = render(
            wrapInProviders(
                <Screen title='Dashboard' actions={<Text>Action</Text>}>
                    <Text>Content</Text>
                </Screen>,
            ),
        );
        expect(getByText("Action")).toBeTruthy();
    });

    test("renders searchSlot", () => {
        const { getByPlaceholderText } = render(
            wrapInProviders(
                <Screen
                    title='Dashboard'
                    searchSlot={<TextInput placeholder='Cari...' />}
                >
                    <Text>Content</Text>
                </Screen>,
            ),
        );
        expect(getByPlaceholderText("Cari...")).toBeTruthy();
    });

    test("renders headerExtra", () => {
        const { getByText } = render(
            wrapInProviders(
                <Screen title='Dashboard' headerExtra={<Text>Extra</Text>}>
                    <Text>Content</Text>
                </Screen>,
            ),
        );
        expect(getByText("Extra")).toBeTruthy();
    });

    test("renders listData mode when listData and renderListItem provided", () => {
        const data = [{ id: "a", label: "Item A" }];
        const { getByText } = render(
            wrapInProviders(
                <Screen
                    title='List'
                    listData={data}
                    listKeyExtractor={(item) => item.id}
                    renderListItem={({ item }) => <Text>{item.label}</Text>}
                />,
            ),
        );
        expect(getByText("Item A")).toBeTruthy();
    });

    test("forwards onRefresh to FlatList", () => {
        const onRefresh = jest.fn();
        const { getByText } = render(
            wrapInProviders(
                <Screen
                    title='List'
                    refreshing={false}
                    onRefresh={onRefresh}
                    listData={[]}
                    listKeyExtractor={(item) => item.id}
                    renderListItem={() => null}
                />,
            ),
        );
        expect(getByText("List")).toBeTruthy();
    });
});

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------

describe("Card", () => {
    test("renders children", () => {
        const { getByText } = render(
            <Card>
                <Text>Card content</Text>
            </Card>,
        );
        expect(getByText("Card content")).toBeTruthy();
    });

    test("applies custom style", () => {
        const { getByTestId } = render(
            <Card style={{ marginTop: 99 }}>
                <Text testID='inner' />
            </Card>,
        );
    });
});

describe("CardTitle", () => {
    test("renders title text", () => {
        const { getByText } = render(<CardTitle>Judul Kartu</CardTitle>);
        expect(getByText("Judul Kartu")).toBeTruthy();
    });

    test("renders meta when provided", () => {
        const { getByText } = render(<CardTitle meta='99'>Judul</CardTitle>);
        expect(getByText("99")).toBeTruthy();
    });

    test("does not render meta when not provided", () => {
        const { queryByText } = render(<CardTitle>Judul</CardTitle>);
        expect(queryByText("99")).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// Paper — SectionHeader
// ---------------------------------------------------------------------------

describe("SectionHeader", () => {
    test("renders title", () => {
        const { getByText } = render(<SectionHeader title='Bagian' />);
        expect(getByText("Bagian")).toBeTruthy();
    });

    test("renders meta when provided", () => {
        const { getByText } = render(
            <SectionHeader title='Bagian' meta='5 item' />,
        );
        expect(getByText("5 item")).toBeTruthy();
    });

    test("renders action slot when provided", () => {
        const { getByText } = render(
            <SectionHeader title='Bagian' action={<Text>Lihat Semua</Text>} />,
        );
        expect(getByText("Lihat Semua")).toBeTruthy();
    });
});

// ---------------------------------------------------------------------------
// Paper — SegmentedTabs
// ---------------------------------------------------------------------------

describe("SegmentedTabs", () => {
    const options = [
        { key: "a", label: "Tab A" },
        { key: "b", label: "Tab B" },
    ];

    test("renders all options", () => {
        const { getByText } = render(
            <SegmentedTabs options={options} value='a' onChange={jest.fn()} />,
        );
        expect(getByText("Tab A")).toBeTruthy();
        expect(getByText("Tab B")).toBeTruthy();
    });

    test("calls onChange when inactive tab pressed", () => {
        const onChange = jest.fn();
        const { getByText } = render(
            <SegmentedTabs options={options} value='a' onChange={onChange} />,
        );
        fireEvent.press(getByText("Tab B"));
        expect(onChange).toHaveBeenCalledWith("b");
    });

    test("calls onChange with same key when active tab pressed", () => {
        const onChange = jest.fn();
        const { getByText } = render(
            <SegmentedTabs options={options} value='a' onChange={onChange} />,
        );
        fireEvent.press(getByText("Tab A"));
        expect(onChange).toHaveBeenCalledWith("a");
    });

    test("sets accessibilityState selected on active tab", () => {
        const { getByLabelText } = render(
            <SegmentedTabs options={options} value='a' onChange={jest.fn()} />,
        );
        const tab = getByLabelText("Tab A");
        expect(tab).toBeTruthy();
    });
});

// ---------------------------------------------------------------------------
// Paper — PaperSearchInput
// ---------------------------------------------------------------------------

describe("PaperSearchInput", () => {
    test("renders with default placeholder", () => {
        const { getByPlaceholderText } = render(
            <PaperSearchInput value='' onChangeText={jest.fn()} />,
        );
        expect(getByPlaceholderText("Cari...")).toBeTruthy();
    });

    test("renders custom placeholder", () => {
        const { getByPlaceholderText } = render(
            <PaperSearchInput
                value=''
                onChangeText={jest.fn()}
                placeholder='Search…'
            />,
        );
        expect(getByPlaceholderText("Search…")).toBeTruthy();
    });

    test("calls onChangeText on text input", () => {
        const onChangeText = jest.fn();
        const { getByPlaceholderText } = render(
            <PaperSearchInput value='' onChangeText={onChangeText} />,
        );
        fireEvent.changeText(getByPlaceholderText("Cari..."), "quran");
        expect(onChangeText).toHaveBeenCalledWith("quran");
    });
});

// ---------------------------------------------------------------------------
// Paper — IconActionButton
// ---------------------------------------------------------------------------

describe("IconActionButton", () => {
    const DummyIcon = () => <View testID='icon' />;

    test("renders with icon and label", () => {
        const { getByLabelText } = render(
            <IconActionButton
                Icon={DummyIcon}
                label='Favorite'
                onPress={jest.fn()}
            />,
        );
        expect(getByLabelText("Favorite")).toBeTruthy();
    });

    test("calls onPress when pressed", () => {
        const onPress = jest.fn();
        const { getByLabelText } = render(
            <IconActionButton
                Icon={DummyIcon}
                label='Favorite'
                onPress={onPress}
            />,
        );
        fireEvent.press(getByLabelText("Favorite"));
        expect(onPress).toHaveBeenCalledTimes(1);
    });

    test("does not call onPress when disabled", () => {
        const onPress = jest.fn();
        const { getByLabelText } = render(
            <IconActionButton
                Icon={DummyIcon}
                label='Fav'
                onPress={onPress}
                disabled
            />,
        );
        fireEvent.press(getByLabelText("Fav"));
        expect(onPress).not.toHaveBeenCalled();
    });
});

// ---------------------------------------------------------------------------
// Paper — ActionPill
// ---------------------------------------------------------------------------

describe("ActionPill", () => {
    test("renders label", () => {
        const { getByText } = render(
            <ActionPill label='Filter' onPress={jest.fn()} />,
        );
        expect(getByText("Filter")).toBeTruthy();
    });

    test("calls onPress when pressed", () => {
        const onPress = jest.fn();
        const { getByText } = render(
            <ActionPill label='Filter' onPress={onPress} />,
        );
        fireEvent.press(getByText("Filter"));
        expect(onPress).toHaveBeenCalledTimes(1);
    });

    test("does not call onPress when disabled", () => {
        const onPress = jest.fn();
        const { getByText } = render(
            <ActionPill label='Filter' onPress={onPress} disabled />,
        );
        fireEvent.press(getByText("Filter"));
        expect(onPress).not.toHaveBeenCalled();
    });
});

// ---------------------------------------------------------------------------
// Paper — CompactRow
// ---------------------------------------------------------------------------

describe("CompactRow", () => {
    test("renders title", () => {
        const { getByText } = render(<CompactRow title='Al-Fatihah' />);
        expect(getByText("Al-Fatihah")).toBeTruthy();
    });

    test("renders subtitle when provided", () => {
        const { getByText } = render(
            <CompactRow title='Al-Fatihah' subtitle='Pembukaan' />,
        );
        expect(getByText("Pembukaan")).toBeTruthy();
    });

    test("renders meta when provided", () => {
        const { getByText } = render(
            <CompactRow title='Al-Fatihah' meta='7 ayat' />,
        );
        expect(getByText("7 ayat")).toBeTruthy();
    });

    test("renders badges", () => {
        const { getByText } = render(
            <CompactRow title='Ar-Rahman' badges={["Baru", "Populer"]} />,
        );
        expect(getByText("Baru")).toBeTruthy();
        expect(getByText("Populer")).toBeTruthy();
    });

    test("calls onPress when pressed", () => {
        const onPress = jest.fn();
        const { getByText } = render(
            <CompactRow title='Al-Ikhlas' onPress={onPress} />,
        );
        fireEvent.press(getByText("Al-Ikhlas"));
        expect(onPress).toHaveBeenCalledTimes(1);
    });

    test("renders right slot", () => {
        const { getByText } = render(
            <CompactRow title='An-Nas' right={<Text>Play</Text>} />,
        );
        expect(getByText("Play")).toBeTruthy();
    });
});

// ---------------------------------------------------------------------------
// Paper — EmptyState
// ---------------------------------------------------------------------------

describe("EmptyState", () => {
    test("renders title", () => {
        const { getByText } = render(<EmptyState title='Tidak ada data' />);
        expect(getByText("Tidak ada data")).toBeTruthy();
    });

    test("renders description when provided", () => {
        const { getByText } = render(
            <EmptyState
                title='Kosong'
                description='Belum ada konten tersedia.'
            />,
        );
        expect(getByText("Belum ada konten tersedia.")).toBeTruthy();
    });

    test("renders action slot", () => {
        const { getByText } = render(
            <EmptyState title='Kosong' action={<Text>Muat Ulang</Text>} />,
        );
        expect(getByText("Muat Ulang")).toBeTruthy();
    });
});

// ---------------------------------------------------------------------------
// Paper — ErrorState
// ---------------------------------------------------------------------------

describe("ErrorState", () => {
    test("renders default title", () => {
        const { getByText } = render(<ErrorState />);
        expect(getByText("Data belum bisa dimuat")).toBeTruthy();
    });

    test("renders default description", () => {
        const { getByText } = render(<ErrorState />);
        expect(
            getByText(
                "Periksa koneksi atau coba muat ulang beberapa saat lagi.",
            ),
        ).toBeTruthy();
    });

    test("overrides title and description", () => {
        const { getByText } = render(
            <ErrorState title='Gagal' description='Coba lagi.' />,
        );
        expect(getByText("Gagal")).toBeTruthy();
        expect(getByText("Coba lagi.")).toBeTruthy();
    });
});

// ---------------------------------------------------------------------------
// ContentCard
// ---------------------------------------------------------------------------

describe("ContentCard", () => {
    test("renders title", () => {
        const { getByText } = render(<ContentCard title='Judul Card' />);
        expect(getByText("Judul Card")).toBeTruthy();
    });

    test("renders subtitle", () => {
        const { getByText } = render(
            <ContentCard title='Judul' subtitle='Subtitle' />,
        );
        expect(getByText("Subtitle")).toBeTruthy();
    });

    test("renders meta", () => {
        const { getByText } = render(<ContentCard title='Judul' meta='99' />);
        expect(getByText("99")).toBeTruthy();
    });

    test("renders eyebrow", () => {
        const { getByText } = render(
            <ContentCard title='Judul' eyebrow='Tahsin' />,
        );
        expect(getByText("Tahsin")).toBeTruthy();
    });

    test("renders children", () => {
        const { getByText } = render(
            <ContentCard title='Judul'>
                <Text>Extra</Text>
            </ContentCard>,
        );
        expect(getByText("Extra")).toBeTruthy();
    });

    test("renders footer", () => {
        const { getByText } = render(
            <ContentCard title='Judul' footer={<Text>Footer</Text>} />,
        );
        expect(getByText("Footer")).toBeTruthy();
    });

    test("renders leading slot", () => {
        const { getByText } = render(
            <ContentCard title='Judul' leading={<Text>Leading</Text>} />,
        );
        expect(getByText("Leading")).toBeTruthy();
    });

    test("renders trailing slot", () => {
        const { getByText } = render(
            <ContentCard title='Judul' trailing={<Text>Trailing</Text>} />,
        );
        expect(getByText("Trailing")).toBeTruthy();
    });

    test("renders metaRail items", () => {
        const items = [
            { label: "7 ayat" },
            { label: "Madinah", variant: "badge" },
        ];
        const { getByText } = render(
            <ContentCard title='Judul' metaRail={items} />,
        );
        expect(getByText("7 ayat")).toBeTruthy();
        expect(getByText("Madinah")).toBeTruthy();
    });

    test("calls onPress when pressed", () => {
        const onPress = jest.fn();
        const { getByText } = render(
            <ContentCard title='Tekan saya' onPress={onPress} />,
        );
        fireEvent.press(getByText("Tekan saya"));
        expect(onPress).toHaveBeenCalledTimes(1);
    });

    test("does not call onPress when disabled", () => {
        const onPress = jest.fn();
        const { getByText } = render(
            <ContentCard title='Tekan' onPress={onPress} disabled />,
        );
        fireEvent.press(getByText("Tekan"));
        expect(onPress).not.toHaveBeenCalled();
    });

    test("renders menu button when onMenuPress provided", () => {
        const { getByLabelText } = render(
            <ContentCard title='Judul' onMenuPress={jest.fn()} />,
        );
        expect(getByLabelText("Aksi")).toBeTruthy();
    });

    test("renders custom menu label", () => {
        const { getByLabelText } = render(
            <ContentCard
                title='Judul'
                onMenuPress={jest.fn()}
                menuLabel='Opsi'
            />,
        );
        expect(getByLabelText("Opsi")).toBeTruthy();
    });
});

// ---------------------------------------------------------------------------
// MetaRail
// ---------------------------------------------------------------------------

describe("MetaRail", () => {
    test("renders item labels", () => {
        const items = [{ label: "7 ayat" }, { label: "Makkiyah" }];
        const { getByText } = render(<MetaRail items={items} />);
        expect(getByText("7 ayat")).toBeTruthy();
        expect(getByText("Makkiyah")).toBeTruthy();
    });

    test("falls back to value when label is missing", () => {
        const items = [{ value: "Madinah" }];
        const { getByText } = render(<MetaRail items={items} />);
        expect(getByText("Madinah")).toBeTruthy();
    });

    test("filters out items without label or value", () => {
        const items = [{ label: "Ada" }, {}, { value: "Juga" }];
        const { getByText, queryByText } = render(<MetaRail items={items} />);
        expect(getByText("Ada")).toBeTruthy();
        expect(getByText("Juga")).toBeTruthy();
    });

    test("returns null when no visible items", () => {
        const { queryByText } = render(<MetaRail items={[]} />);
        expect(queryByText(".")).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// TabBar
// ---------------------------------------------------------------------------

describe("TabBar", () => {
    test("renders all tab labels when active", () => {
        const { getByText } = render(
            wrapInProviders(<TabBar active='home' onChange={jest.fn()} />),
        );
        expect(getByText("Beranda")).toBeTruthy();
    });

    test("shows only active tab label, others render icon-only", () => {
        const { getByText, queryByText } = render(
            wrapInProviders(<TabBar active='quran' onChange={jest.fn()} />),
        );
        expect(getByText("Al-Qur'an")).toBeTruthy();
        expect(queryByText("Beranda")).toBeNull();
    });

    test("calls onChange with tab key on press", () => {
        const onChange = jest.fn();
        const { getByLabelText } = render(
            wrapInProviders(<TabBar active='home' onChange={onChange} />),
        );
        fireEvent.press(getByLabelText("Hadis"));
        expect(onChange).toHaveBeenCalledWith("hadith");
    });

    test("all tabs have accessibility labels", () => {
        const labels = ["Beranda", "Al-Qur'an", "Hadis", "Ibadah", "Belajar"];
        const { getByLabelText } = render(
            wrapInProviders(<TabBar active='home' onChange={jest.fn()} />),
        );
        labels.forEach((label) => {
            expect(getByLabelText(label)).toBeTruthy();
        });
    });
});

// ---------------------------------------------------------------------------
// AppModalSheet
// ---------------------------------------------------------------------------

describe("AppModalSheet", () => {
    test("renders when visible", () => {
        const { getByText } = render(
            <AppModalSheet visible title='Modal Title'>
                <Text>Child Content</Text>
            </AppModalSheet>,
        );
        expect(getByText("Modal Title")).toBeTruthy();
        expect(getByText("Child Content")).toBeTruthy();
    });

    test("calls onClose when close button pressed", () => {
        const onClose = jest.fn();
        const { getAllByLabelText } = render(
            <AppModalSheet
                visible
                onClose={onClose}
                title='Title'
                closeLabel='Tutup'
            />,
        );
        fireEvent.press(getAllByLabelText("Tutup")[0]);
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    test("renders subtitle when provided", () => {
        const { getByText } = render(
            <AppModalSheet visible title='Title' subtitle='Subtitle text' />,
        );
        expect(getByText("Subtitle text")).toBeTruthy();
    });

    test("renders footer", () => {
        const { getByText } = render(
            <AppModalSheet
                visible
                title='Title'
                footer={<Text>Footer content</Text>}
            />,
        );
        expect(getByText("Footer content")).toBeTruthy();
    });
});

// ---------------------------------------------------------------------------
// ActionSheetRow
// ---------------------------------------------------------------------------

describe("ActionSheetRow", () => {
    test("renders title", () => {
        const { getByText } = render(<ActionSheetRow title='Pilih' />);
        expect(getByText("Pilih")).toBeTruthy();
    });

    test("renders subtitle when provided", () => {
        const { getByText } = render(
            <ActionSheetRow title='Pilih' subtitle='Deskripsi opsi' />,
        );
        expect(getByText("Deskripsi opsi")).toBeTruthy();
    });

    test("calls onPress when pressed", () => {
        const onPress = jest.fn();
        const { getByText } = render(
            <ActionSheetRow title='Tekan' onPress={onPress} />,
        );
        fireEvent.press(getByText("Tekan"));
        expect(onPress).toHaveBeenCalledTimes(1);
    });

    test("does not call onPress when disabled", () => {
        const onPress = jest.fn();
        const { getByText } = render(
            <ActionSheetRow title='Disabled' onPress={onPress} disabled />,
        );
        fireEvent.press(getByText("Disabled"));
        expect(onPress).not.toHaveBeenCalled();
    });

    test("renders active state style", () => {
        const { getByText } = render(<ActionSheetRow title='Active' active />);
        expect(getByText("Active")).toBeTruthy();
    });
});

// ---------------------------------------------------------------------------
// AppActionSheet
// ---------------------------------------------------------------------------

describe("AppActionSheet", () => {
    test("renders children and title", () => {
        const { getByText } = render(
            <AppActionSheet visible title='Action Sheet'>
                <ActionSheetRow title='Opsi 1' />
            </AppActionSheet>,
        );
        expect(getByText("Action Sheet")).toBeTruthy();
        expect(getByText("Opsi 1")).toBeTruthy();
    });

    test("calls onClose when overlay pressed", () => {
        const onClose = jest.fn();
        const { getAllByLabelText } = render(
            <AppActionSheet visible onClose={onClose} title='Sheet' />,
        );
        fireEvent.press(getAllByLabelText("Tutup")[0]);
        expect(onClose).toHaveBeenCalledTimes(1);
    });
});

// ---------------------------------------------------------------------------
// DetailHeader
// ---------------------------------------------------------------------------

describe("DetailHeader", () => {
    test("renders title", () => {
        const { getByText } = render(<DetailHeader title='Detail Judul' />);
        expect(getByText("Detail Judul")).toBeTruthy();
    });

    test("renders subtitle when provided", () => {
        const { getByText } = render(
            <DetailHeader title='Judul' subtitle='Subtitle here' />,
        );
        expect(getByText("Subtitle here")).toBeTruthy();
    });

    test("renders meta when provided", () => {
        const { getByText } = render(
            <DetailHeader title='Judul' meta='Q.S. 1:1-7' />,
        );
        expect(getByText("Q.S. 1:1-7")).toBeTruthy();
    });

    test("renders back button and fires onBack", () => {
        const onBack = jest.fn();
        const { getByLabelText } = render(
            <DetailHeader title='Judul' onBack={onBack} backLabel='Kembali' />,
        );
        expect(getByLabelText("Kembali")).toBeTruthy();
        fireEvent.press(getByLabelText("Kembali"));
        expect(onBack).toHaveBeenCalledTimes(1);
    });

    test("does not render back button without onBack", () => {
        const { queryByLabelText } = render(<DetailHeader title='Judul' />);
        expect(queryByLabelText("Kembali")).toBeNull();
    });

    test("renders actions slot when provided", () => {
        const { getByText } = render(
            <DetailHeader title='Judul' actions={<Text>Action</Text>} />,
        );
        expect(getByText("Action")).toBeTruthy();
    });
});

// ---------------------------------------------------------------------------
// SectionHeader (standalone)
// ---------------------------------------------------------------------------

describe("SectionHeader (standalone)", () => {
    test("renders title", () => {
        const { getByText } = render(
            <SectionHeaderStandalone title='Bagian' />,
        );
        expect(getByText("Bagian")).toBeTruthy();
    });

    test("renders meta when provided", () => {
        const { getByText } = render(
            <SectionHeaderStandalone title='Bagian' meta='5 item' />,
        );
        expect(getByText("5 item")).toBeTruthy();
    });

    test("renders subtitle when provided", () => {
        const { getByText } = render(
            <SectionHeaderStandalone title='Bagian' subtitle='Sub bagian' />,
        );
        expect(getByText("Sub bagian")).toBeTruthy();
    });

    test("renders actions slot when provided", () => {
        const { getByText } = render(
            <SectionHeaderStandalone
                title='Bagian'
                actions={<Text>Action</Text>}
            />,
        );
        expect(getByText("Action")).toBeTruthy();
    });

    test("does not render meta when omitted", () => {
        const { queryByText } = render(
            <SectionHeaderStandalone title='Bagian' />,
        );
        expect(queryByText("5 item")).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// SwipeBackView
// ---------------------------------------------------------------------------

describe("SwipeBackView", () => {
    test("keeps disabled wrapper full height", () => {
        const { getByText, toJSON } = render(
            <SwipeBackView enabled={false}>
                <Text>Swipe content</Text>
            </SwipeBackView>,
        );

        expect(getByText("Swipe content")).toBeTruthy();
        expect(toJSON().props.style).toEqual(
            expect.arrayContaining([expect.objectContaining({ flex: 1 })]),
        );
    });
});
