import SearchClient from "@/app/search/SearchClient";

export default async function DashboardSearchPage(props) {
    const searchParams = await props.searchParams;
    return (
        <div className='py-2'>
            <SearchClient
                initialQuery={searchParams?.q ?? ""}
                initialType={searchParams?.type ?? "all"}
                routeScope='dashboard'
            />
        </div>
    );
}
