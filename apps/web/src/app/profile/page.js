"use client";

import ContentWidth from "@/components/layout/ContentWidth";
import ProfileContent from "@/components/account/ProfileContent";
import Section from "@/components/Section";

/**
 * Public shell for the profile screen: navbar + footer.
 * The sections themselves are shared with /dashboard/profile.
 */
const ProfilePage = () => (
    <main className='min-h-screen flex flex-col'>
        <Section>
            <ContentWidth compact='max-w-3xl' className='px-4 py-6'>
                <ProfileContent />
            </ContentWidth>
        </Section>
    </main>
);

export default ProfilePage;
