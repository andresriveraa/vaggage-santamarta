import React, {useState, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Pressable,
  FlatList,
} from 'react-native';
import colors from '../../constants/colors';
import { SafeAreaView } from 'react-native-safe-area-context';

const {width} = Dimensions.get('window');

type Lang = 'es' | 'en';

const SLIDES: Record<Lang, {id: string; title: string; description: string; emoji: string}[]> = {
  es: [
    {
      id: '1',
      title: 'Tu próximo destino, en audio',
      description: 'Encuentra audioguías de los mejores lugares en Colombia. Empieza por La Candelaria, en Bogotá.',
      emoji: '🔍',
    },
    {
      id: '2',
      title: 'Cada lugar tiene una historia',
      description: 'Con tu audioguía, accedes a contenido exclusivo sobre la historia, cultura y secretos de cada rincón.',
      emoji: '🛒',
    },
    {
      id: '3',
      title: 'Camina. Escucha. Descubre.',
      description: 'Pon tus audífonos y deja que Vaggage te lleve por los lugares que no aparecen en los mapas.',
      emoji: '🎧',
    },
  ],
  en: [
    {
      id: '1',
      title: 'Your next destination, in audio',
      description: 'Find audio guides for the best places in Colombia. Start with La Candelaria, in Bogotá.',
      emoji: '🔍',
    },
    {
      id: '2',
      title: 'Every place has a story',
      description: 'With your audio guide, you get exclusive content about the history, culture, and hidden stories of each spot.',
      emoji: '🛒',
    },
    {
      id: '3',
      title: 'Walk. Listen. Discover.',
      description: 'Put on your headphones and let Vaggage take you to the places maps don\'t show.',
      emoji: '🎧',
    },
  ],
};

const UI_TEXT: Record<Lang, {skip: string; next: string; start: string}> = {
  es: {skip: 'Saltar', next: 'Siguiente', start: 'Empezar'},
  en: {skip: 'Skip', next: 'Next', start: 'Get Started'},
};

type SlideItem = {id: string; title: string; description: string; emoji: string};

interface OnboardingProps {
  lang?: Lang;
  onFinish: () => void;
}

const Slide = ({item}: {item: SlideItem}) => (
  <View style={styles.slide}>
    <Text style={styles.emoji}>{item.emoji}</Text>
    <Text style={styles.title}>{item.title}</Text>
    <Text style={styles.description}>{item.description}</Text>
  </View>
);

const Onboarding: React.FC<OnboardingProps> = ({lang = 'es', onFinish}) => {
  const slides = SLIDES[lang];
  const ui = UI_TEXT[lang];
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const updateCurrentSlideIndex = (e: any) => {
    const contentOffsetX = e.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(contentOffsetX / width);
    setCurrentSlideIndex(currentIndex);
  };

  const goToNextSlide = () => {
    const nextSlideIndex = currentSlideIndex + 1;
    if (nextSlideIndex !== slides.length) {
      const offset = nextSlideIndex * width;
      flatListRef?.current?.scrollToOffset({offset});
      setCurrentSlideIndex(nextSlideIndex);
    } else {
      onFinish();
    }
  };

  const skip = () => {
    onFinish();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Content */}
      <View style={styles.contentContainer}>
        <FlatList
          ref={flatListRef}
          onMomentumScrollEnd={updateCurrentSlideIndex}
          contentContainerStyle={{height: width}}
          showsHorizontalScrollIndicator={false}
          horizontal
          data={slides}
          pagingEnabled
          renderItem={({item}) => <Slide item={item} />}
        />
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        {/* Indicators */}
        <View style={styles.indicatorContainer}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                currentSlideIndex === index && styles.indicatorActive,
              ]}
            />
          ))}
        </View>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          {currentSlideIndex < slides.length - 1 ? (
            <>
              <Pressable onPress={skip}>
                <Text style={styles.skipButtonText}>{ui.skip}</Text>
              </Pressable>
              <Pressable style={styles.nextButton} onPress={goToNextSlide}>
                <Text style={styles.nextButtonText}>{ui.next}</Text>
              </Pressable>
            </>
          ) : (
            <Pressable style={styles.startButton} onPress={goToNextSlide}>
              <Text style={styles.startButtonText}>{ui.start}</Text>
            </Pressable>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slide: {
    alignItems: 'center',
    justifyContent: 'center',
    width: width,
    paddingHorizontal: 20,
  },
  emoji: {
    fontSize: 100,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.green.textSecondary,
    textAlign: 'center',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: colors.green.textPrimary,
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    height: 150,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  indicator: {
    height: 8,
    width: 8,
    backgroundColor: '#ccc',
    marginHorizontal: 4,
    borderRadius: 4,
  },
  indicatorActive: {
    backgroundColor: colors.green.textSecondary,
    width: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  skipButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: 'bold',
  },
  nextButton: {
    backgroundColor: colors.green.textSecondary,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  startButton: {
    backgroundColor: colors.green.textSecondary,
    paddingVertical: 15,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default Onboarding;
