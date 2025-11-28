from lingua import Language, LanguageDetectorBuilder

class JapaneseDetector:
    def __init__(self):
        self.languages = [Language.JAPANESE, Language.CHINESE]
        self.detector = LanguageDetectorBuilder.from_languages(*self.languages).build()

    def is_japanese(self, text: str) -> bool:
        detected_language = self.detector.detect_language_of(text)
        return detected_language == Language.JAPANESE or detected_language == Language.CHINESE
