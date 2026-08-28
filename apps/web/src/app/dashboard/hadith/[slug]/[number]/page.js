import HadithNumberContent from "@/app/hadith/[slug]/[number]/HadithNumberContent";

export default async function Page(props) {
    const params = await props.params;

    return <HadithNumberContent params={params} basePath='/dashboard/hadith' />;
}
