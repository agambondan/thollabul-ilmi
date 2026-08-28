export const shareToWhatsApp = (shareUrl) => {
    const text = "Check out this article!";

    const whatsappUrl = `https://api.whatsapp.com/send?text=${text}%20${shareUrl}`;
    window.open(whatsappUrl);
};

export const shareToFacebook = (shareUrl) => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`;
    window.open(facebookUrl);
};

export const shareToTwitter = (shareUrl) => {
    const text = "Check out this article!";
    const twitterUrl = `https://twitter.com/intent/tweet?url=${shareUrl}&text=${text}`;
    window.open(twitterUrl);
};

export const shareToEmail = (shareUrl) => {
    const subject = "Check out this article!";
    const body =
        "Hi,\n\nI thought you might find this article interesting: " + shareUrl;

    const emailUrl = `mailto:?subject=${subject}&body=${body}`;
    window.location.href = emailUrl;
};

export const shareToLinkedIn = (shareUrl) => {
    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`;
    window.open(linkedinUrl);
};

export const shareToTelegram = (shareUrl) => {
    const text = "Check out this article!";
    const telegramUrl = `https://t.me/share/url?url=${shareUrl}&text=${text}`;
    window.open(telegramUrl);
};
