const ADZAN_AUDIO_CDN =
    "https://cdn.jsdelivr.net/gh/mohsalvi/adhan-audio@main/general/";

export const ADZAN_SOUNDS = [
    {
        value: "default",
        label: "Default (Makkah)",
        qari: "Adzan Masjidil Haram",
        region: "Makkah Al-Mukarramah",
        src: `${ADZAN_AUDIO_CDN}makkah-haram-02.mp3`,
    },
    {
        value: "mishary-alafasy",
        label: "Mishary Rashid Al-Afasy",
        qari: "Syaikh Mishary Rashid Al-Afasy",
        region: "Kuwait",
        src: `${ADZAN_AUDIO_CDN}mishary-alafasy-01.mp3`,
    },
    {
        value: "mansour-al-zahrani",
        label: "Mansour Al-Zahrani",
        qari: "Syaikh Mansour Al-Zahrani",
        region: "Arab Saudi",
        src: `${ADZAN_AUDIO_CDN}mansour-al-zahrani-01.mp3`,
    },
    {
        value: "nasser-al-qatami",
        label: "Nasser Al-Qatami",
        qari: "Syaikh Nasser Al-Qatami",
        region: "Arab Saudi",
        src: `${ADZAN_AUDIO_CDN}nasser-al-qatami-01.mp3`,
    },
    {
        value: "abdul-basit",
        label: "Abdul Basit Abdul Samad",
        qari: "Syaikh Abdul Basit Abdul Samad",
        region: "Mesir",
        src: `${ADZAN_AUDIO_CDN}abdul-basit-abdul-samad-01.mp3`,
    },
    {
        value: "islam-sobhi",
        label: "Islam Sobhi",
        qari: "Syaikh Islam Sobhi",
        region: "Mesir",
        src: `${ADZAN_AUDIO_CDN}islam-sobhi-01.mp3`,
    },
    {
        value: "makkah-haram",
        label: "Adzan Masjidil Haram",
        qari: "Muadzin Resmi Masjidil Haram",
        region: "Makkah Al-Mukarramah",
        src: `${ADZAN_AUDIO_CDN}makkah-haram-02.mp3`,
    },
    {
        value: "madinah",
        label: "Adzan Masjid Nabawi",
        qari: "Muadzin Resmi Masjid Nabawi",
        region: "Madinah Al-Munawwarah",
        src: `${ADZAN_AUDIO_CDN}madinah-02.mp3`,
    },
    {
        value: "al-aqsa",
        label: "Adzan Masjid Al-Aqsha",
        qari: "Muadzin Masjid Al-Aqsha",
        region: "Yerusalem",
        src: `${ADZAN_AUDIO_CDN}al-aqsa-jerusalem-01.mp3`,
    },
];

export const getAdzanSound = (value) =>
    ADZAN_SOUNDS.find((s) => s.value === value) || ADZAN_SOUNDS[0];
