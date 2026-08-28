import { redirect } from "next/navigation";

export default async function Page(props) {
    const { slug, number } = await props.params;
    redirect(`/hadith/${slug}/${number}`);
}
