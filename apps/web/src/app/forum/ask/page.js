import ForumAskPage, {
    ForumAskContent,
} from "@/app/forum/ask/ForumAskPageClient";

export const metadata = {
    title: `Ajukan Pertanyaan — Forum Diskusi — Thullaabul 'Ilmi`,
    description:
        "Ajukan pertanyaan seputar Islam ke forum diskusi Thullaabul 'Ilmi.",
    robots: { index: false, follow: true },
};

export { ForumAskContent };
export default ForumAskPage;
