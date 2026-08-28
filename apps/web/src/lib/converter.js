import FlagIcon from "@/components/icon/Flag";

const latinToArabic = {
    0: "٠",
    1: "١",
    2: "٢",
    3: "٣",
    4: "٤",
    5: "٥",
    6: "٦",
    7: "٧",
    8: "٨",
    9: "٩",
};

// Function to convert Latin numerals to Arabic
export const ConvertToArabic = (text) => {
    return text.toString().replace(/[0-9]/g, (match) => latinToArabic[match]);
};

export function NumberToArabic(number) {
    const arabicNumerals = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];

    const numberString = number.toString();
    let arabicString = "";

    for (let i = 0; i < numberString.length; i++) {
        const digit = parseInt(numberString[i]);
        arabicString += arabicNumerals[digit];
    }

    return arabicString;
}

export function ConvertNameLanguage(lang) {
    var res = "";
    if (lang.toLowerCase() === "en") {
        res = "EN";
    } else if (lang.toLowerCase() === "id") {
        res = "ID";
    }
    return res;
}

export function ConvertFLagLanguage(lang) {
    var res = <></>;
    if (lang.toLowerCase() === "en") {
        res = <FlagIcon code={"gb-eng"} size={"lg"} />;
    } else if (lang.toLowerCase() === "id") {
        res = <FlagIcon code={"id"} size={"lg"} />;
    }
    return res;
}
