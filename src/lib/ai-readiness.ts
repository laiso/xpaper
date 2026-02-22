export function isChromeBuiltinAiAvailable(windowObj: any = window): boolean {
    const ai = windowObj.ai || windowObj.LanguageModel;
    if (ai && (ai.languageModel || typeof ai.create === 'function')) {
        return true;
    }
    return false;
}
