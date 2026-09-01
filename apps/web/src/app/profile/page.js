"use client";

import ProfileContent from "@/components/account/ProfileContent";
import Section from "@/components/Section";

/**
 * Public shell for the profile screen: navbar + footer.
 * The sections themselves are shared with /dashboard/profile.
 */
const ProfilePage = () => (
    <main className='min-h-screen flex flex-col'>
        <Section>
            <div className='w-full px-4'>
                <ProfileContent />
            </div>
        </Section>
    </main>
);

export default ProfilePage;
